const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  try {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'DELETE') {
      return { 
        statusCode: 405, 
        headers, 
        body: JSON.stringify({ error: 'Method not allowed' }) 
      };
    }

    const noteId = event.pathParameters?.id;
    if (!noteId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Note ID is required' })
      };
    }

    const currentDate = new Date();
    const sevenDaysLater = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Soft delete - mark for deletion in 7 days
    const params = {
      TableName: process.env.NOTES_TABLE,
      Key: {
        userId: 'anonymous',
        noteId: noteId
      },
      UpdateExpression: 'SET deletedAt = :deletedAt',
      ConditionExpression: 'attribute_exists(noteId)',
      ExpressionAttributeValues: {
        ':deletedAt': sevenDaysLater.toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    // SDK v3 style - use UpdateCommand
    const result = await dynamo.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Note marked for deletion. It will be permanently deleted in 7 days.',
        deletedAt: result.Attributes.deletedAt
      })
    };
  } catch (error) {
    // Note: In SDK v3, error names are the same but accessed via error.name
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Note not found' })
      };
    }
    
    console.error('Delete note error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};