
//   CleanupWorkerFunction:
//   Type: AWS::Serverless::Function
//   Properties:
//     FunctionName: !Sub cleanupWorker-${Environment}
//     CodeUri: lambda/cleanupWorker/
//     Handler: index.handler
//     Runtime: nodejs18.x
//     Timeout: 300
//     MemorySize: 512
//     Policies:
//       - Version: "2012-10-17"
//         Statement:
//           # S3: read and delete objects only
//           - Effect: Allow
//             Action:
//               - s3:ListBucket
//             Resource: !Ref DriveBucket
//           - Effect: Allow
//             Action:
//               - s3:GetObject
//               - s3:DeleteObject
//             Resource: !Sub arn:aws:s3:::${DriveBucket}/*
//           # DynamoDB: read and delete items only
//           - Effect: Allow
//             Action:
//               - dynamodb:GetItem
//               - dynamodb:Query
//               - dynamodb:DeleteItem
//             Resource: !GetAtt DriveTable.Arn
//     Environment:
//       Variables:
//         DRIVE_BUCKET: !Ref DriveBucket
//         DRIVE_TABLE: !Ref DriveTable
//     Events:
//       DailyCleanup:
//         Type: Schedule
//         Properties:
//           Schedule: rate(1 hour)

const { DynamoDBClient, QueryCommand, DeleteItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient();
const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        console.log('Starting cleanup process...');
        
        const currentTime = Math.floor(Date.now() / 1000);
        const deletedFiles = [];
        
        // Find expired trashed files
        const expiredFiles = await findExpiredFiles(currentTime);
        console.log(`Found ${expiredFiles.length} expired files to delete`);
        
        // Permanently delete each expired file
        for (const file of expiredFiles) {
            try {
                await permanentlyDeleteFile(file);
                deletedFiles.push({
                    fileId: file.file_id,
                    fileName: file.file_name,
                    userId: file.user_id
                });
                
                console.log(`Deleted file: ${file.file_name} (${file.file_id})`);
            } catch (error) {
                console.error(`Failed to delete file ${file.file_id}:`, error);
            }
        }
        
        // Clean up old scan records (optional - keep for 30 days)
        await cleanupOldScanRecords(currentTime);
        
        console.log(`Cleanup completed. Deleted ${deletedFiles.length} files.`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Cleanup completed successfully`,
                deletedFilesCount: deletedFiles.length,
                deletedFiles: deletedFiles
            })
        };
        
    } catch (error) {
        console.error('Cleanup process failed:', error);
        throw error;
    }
};

async function findExpiredFiles(currentTime) {
    const expiredFiles = [];
    let lastEvaluatedKey = null;
    
    do {
        const queryCommand = new QueryCommand({
            TableName: process.env.DRIVE_TABLE,
            IndexName: 'TrashIndex',
            KeyConditionExpression: 'trashed = :trashed',
            FilterExpression: 'trash_expiry <= :currentTime',
            ExpressionAttributeValues: {
                ':trashed': { N: '1' },
                ':currentTime': { N: currentTime.toString() }
            },
            ExclusiveStartKey: lastEvaluatedKey
        });
        
        const result = await dynamoDB.send(queryCommand);
        
        if (result.Items) {
            expiredFiles.push(...result.Items.map(item => unmarshall(item)));
        }
        
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    return expiredFiles;
}

async function permanentlyDeleteFile(file) {
    // Delete S3 object
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            Key: file.s3_key
        }));
        console.log(`Deleted S3 object: ${file.s3_key}`);
    } catch (error) {
        console.warn(`S3 object not found or already deleted: ${file.s3_key}`);
    }
    
    // Delete DynamoDB record
    await dynamoDB.send(new DeleteItemCommand({
        TableName: process.env.DRIVE_TABLE,
        Key: {
            user_id: { S: file.user_id },
            file_id: { S: file.file_id }
        }
    }));
    
    // Also delete from scan table
    try {
        await dynamoDB.send(new DeleteItemCommand({
            TableName: process.env.SCAN_TABLE,
            Key: {
                user_id: { S: file.user_id },
                file_id: { S: file.file_id }
            }
        }));
    } catch (error) {
        // Scan record might not exist, which is fine
        console.log(`No scan record found for ${file.file_id}`);
    }
}

async function cleanupOldScanRecords(currentTime) {
    const retentionPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
    const cutoffTime = currentTime - retentionPeriod;
    
    // This would typically scan the GSI on scan_status or use a TTL attribute
    // For now, we'll just log that this would happen
    console.log(`Would clean up scan records older than: ${new Date(cutoffTime * 1000).toISOString()}`);
    
    // Implementation would depend on your scan table structure
    // You might add a TTL attribute to automatically expire old records
}