const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand  } = require("@aws-sdk/lib-dynamodb");


const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async () => {
  const currentDate = new Date().toISOString();

  try {
    // Find notes marked for deletion where deletion time has passed
    const scanParams = {
      TableName: process.env.NOTES_TABLE,
      FilterExpression: 'deletedAt < :currentDate',
      ExpressionAttributeValues: {
        ':currentDate': currentDate
      }
    };

    const result = await dynamo.send(new ScanCommand(scanParams));
    
    let deletedCount = 0;
    let failedDeletes = [];
    
    if (result.Items.length > 0) {
      // Group deletes into batches of 25 (DynamoDB limit)
      const batches = [];
      for (let i = 0; i < result.Items.length; i += 25) {
        batches.push(result.Items.slice(i, i + 25));
      }
      
      console.log(`Processing ${batches.length} batch(es) for ${result.Items.length} items`);
      
      // Process each batch with retry logic
      for (const batch of batches) {
        const deleteRequests = batch.map(note => ({
          DeleteRequest: {
            Key: {
              userId: note.userId,
              noteId: note.noteId
            }
          }
        }));
        
        const batchResult = await processBatchWithRetry(
          deleteRequests, 
          batch
        );
        
        deletedCount += batchResult.successful;
        failedDeletes = failedDeletes.concat(batchResult.failed);
      }
    }

    console.log(`Cleanup completed: ${deletedCount} notes permanently deleted`);
    
    const response = {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Cleanup completed: ${deletedCount} notes permanently deleted`,
        deletedCount: deletedCount
      })
    };

    // Add failed items info if any
    if (failedDeletes.length > 0) {
      response.body = JSON.stringify({
        success: true,
        message: `Cleanup partially completed: ${deletedCount} notes deleted, ${failedDeletes.length} failed`,
        deletedCount: deletedCount,
        failedCount: failedDeletes.length,
        failedItems: failedDeletes.map(item => ({
          userId: item.userId,
          noteId: item.noteId
        }))
      });
    }
    
    return response;
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Cleanup failed' })
    };
  }
};

// Helper function to process batch with retry logic
async function processBatchWithRetry(deleteRequests, originalBatch) {
  let unprocessedItems = deleteRequests;
  let retryCount = 0;
  const successfulItems = [];
  const failedItems = [];

  while (unprocessedItems.length > 0 && retryCount < MAX_RETRIES) {
    try {
      const batchParams = {
        RequestItems: {
          [process.env.NOTES_TABLE]: unprocessedItems
        }
      };

      const response = await dynamo.send(new BatchWriteCommand(batchParams));
      
      // Track successfully processed items
      const processedCount = unprocessedItems.length - 
        (response.UnprocessedItems?.[process.env.NOTES_TABLE]?.length || 0);
      successfulItems.push(...Array(processedCount));
      
      // Check if we have unprocessed items to retry
      if (response.UnprocessedItems && response.UnprocessedItems[process.env.NOTES_TABLE]) {
        unprocessedItems = response.UnprocessedItems[process.env.NOTES_TABLE];
        retryCount++;
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Retry ${retryCount}/${MAX_RETRIES} for ${unprocessedItems.length} unprocessed items`);
          await delay(RETRY_DELAY_MS * retryCount); // Exponential backoff
        } else {
          console.log(`Max retries exceeded for ${unprocessedItems.length} items`);
          // Map unprocessed items back to original note data for reporting
          const failedBatchItems = unprocessedItems.map((request, index) => {
            const originalIndex = deleteRequests.indexOf(request);
            return originalBatch[originalIndex];
          });
          failedItems.push(...failedBatchItems);
          break;
        }
      } else {
        // All items processed successfully
        unprocessedItems = [];
      }
      
    } catch (error) {
      console.error(`Batch processing error on attempt ${retryCount + 1}:`, error);
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        // All items in this batch failed after max retries
        failedItems.push(...originalBatch);
        break;
      }
      
      await delay(RETRY_DELAY_MS * retryCount);
    }
  }

  return {
    successful: successfulItems.length,
    failed: failedItems
  };
}

