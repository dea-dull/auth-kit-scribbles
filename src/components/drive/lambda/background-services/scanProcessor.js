
//   ScanProcessorFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub scanProcessor-${Environment}
//       CodeUri: lambda/scanProcessor/
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Timeout: 900
//       Policies:
//       - Statement:
//           # --- SQS ---
//           - Effect: Allow
//             Action:
//               - sqs:ReceiveMessage
//               - sqs:DeleteMessage
//               - sqs:GetQueueAttributes
//             Resource: !GetAtt ScanQueue.Arn

//           # --- S3: read object to scan ---
//           - Effect: Allow
//             Action:
//               - s3:GetObject
//               - s3:DeleteObject  # once processed, remove from unscanned
//             Resource: !Sub arn:aws:s3:::${DriveUnscannedBucket}/*

//           # --- S3: write to clean bucket ---
//           - Effect: Allow
//             Action:
//               - s3:PutObject
//             Resource: !Sub arn:aws:s3:::${DriveBucket}/*

//           # --- S3: write to quarantined bucket ---
//           - Effect: Allow
//             Action:
//               - s3:PutObject
//             Resource: !Sub arn:aws:s3:::${DriveQuarantinedBucket}/*

//           # --- DynamoDB: update scan and drive status ---
//           - Effect: Allow
//             Action:
//               - dynamodb:UpdateItem
//               - dynamodb:GetItem
//               - dynamodb:PutItem
//             Resource:
//               - !GetAtt ScanTable.Arn
//               - !GetAtt DriveTable.Arn

//           # --- Optional if using Step Functions orchestration ---
//           - Effect: Allow
//             Action:
//               - states:StartExecution
//             Resource: "*"
//             Condition:
//               StringLikeIfExists:
//                 "aws:CalledVia": "lambda.amazonaws.com"

      
//       Environment:
//         Variables:
//           DRIVE_UNSCANNED_BUCKET: !Ref DriveUnscannedBucket
//           DRIVE_BUCKET: !Ref DriveBucket
//           DRIVE_QUARANTINED_BUCKET: !Ref DriveQuarantinedBucket
//           SCAN_TABLE: !Ref ScanTable
//           DRIVE_TABLE: !Ref DriveTable
//       Events:
//         ScanQueueEvent:
//           Type: SQS
//           Properties:
//             Queue: !GetArn ScanQueue
//             BatchSize: 20

const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoDB = new DynamoDBClient();
const s3Client = new S3Client();

exports.handler = async (event) => {
    console.log('Scan processor invoked with', event.Records?.length, 'records');
    
    const results = [];
    
    for (const record of event.Records) {
        try {
            const result = await processFile(record);
            results.push(result);
        } catch (error) {
            console.error('Error processing record:', error);
            results.push({
                success: false,
                error: error.message,
                recordId: record.messageId
            });
        }
    }
    
    console.log('Processing complete. Results:', results);
    return { batchItemFailures: [] }; // All processed successfully
};

async function processFile(record) {
    const s3Event = JSON.parse(record.body);
    
    for (const s3Record of s3Event.Records) {
        const bucket = s3Record.s3.bucket.name;
        const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' '));
        
        console.log(`Processing file: ${key} from bucket: ${bucket}`);
        
        // Extract user ID and file info from S3 key
        const keyParts = key.split('/');
        if (keyParts.length < 3) {
            throw new Error(`Invalid S3 key format: ${key}`);
        }
        
        const userId = keyParts[1]; // uploads/{userId}/filename
        const fileName = keyParts[keyParts.length - 1];
        
        try {
            // Update scan status to "scanning"
            await updateScanStatus(userId, key, 'scanning');
            
            // Simulate virus scanning (replace with actual scanner integration)
            const scanResult = await performVirusScan(bucket, key);
            
            // Move file to appropriate bucket based on scan result
            const destinationBucket = scanResult.clean ? 
                process.env.DRIVE_BUCKET : 
                process.env.DRIVE_QUARANTINED_BUCKET;
                
            const destinationKey = `files/${userId}/${fileName}`;
            
            await s3Client.send(new CopyObjectCommand({
                Bucket: destinationBucket,
                CopySource: `${bucket}/${key}`,
                Key: destinationKey,
                MetadataDirective: 'COPY'
            }));
            
            // Delete original from unscanned bucket
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            }));
            
            // Update scan status and create/update drive record
            await updateFileRecords(userId, key, destinationKey, scanResult, destinationBucket);
            
            console.log(`File ${key} processed successfully. Clean: ${scanResult.clean}`);
            
            return {
                success: true,
                fileKey: key,
                scanResult: scanResult.clean ? 'clean' : 'infected',
                destination: destinationBucket
            };
            
        } catch (error) {
            console.error(`Error processing file ${key}:`, error);
            
            // Update scan status to failed
            await updateScanStatus(userId, key, 'failed', error.message);
            
            throw error;
        }
    }
}

async function performVirusScan(bucket, key) {
    // TODO: Integrate with actual virus scanning service (AWS Marketplace, ClamAV, etc.)
    // This is a simulation - replace with real scanning logic
    
    console.log(`Scanning file: ${key}`);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, mark files with "virus" in name as infected
    const isInfected = key.toLowerCase().includes('virus');
    
    // Randomly flag 5% of files as infected for testing
    const randomCheck = Math.random() < 0.05;
    
    return {
        clean: !isInfected && !randomCheck,
        scannedAt: new Date().toISOString(),
        scanner: 'simulated-scanner-v1.0',
        details: isInfected ? 'Simulated virus detected' : 'No threats found'
    };
}

async function updateScanStatus(userId, s3Key, status, errorMessage = null) {
    const updateParams = {
        TableName: process.env.SCAN_TABLE,
        Key: {
            user_id: { S: userId },
            file_id: { S: s3Key } // Using S3 key as file_id for scanning
        },
        UpdateExpression: 'SET scan_status = :status, last_updated = :timestamp',
        ExpressionAttributeValues: {
            ':status': { S: status },
            ':timestamp': { N: Math.floor(Date.now() / 1000).toString() }
        }
    };
    
    if (status === 'scanning') {
        updateParams.UpdateExpression += ', scan_attempts = if_not_exists(scan_attempts, :zero) + :inc';
        updateParams.ExpressionAttributeValues[':zero'] = { N: '0' };
        updateParams.ExpressionAttributeValues[':inc'] = { N: '1' };
    }
    
    if (status === 'clean' || status === 'infected') {
        updateParams.UpdateExpression += ', scanned_at = :scannedAt, scan_result = :result';
        updateParams.ExpressionAttributeValues[':scannedAt'] = { N: Math.floor(Date.now() / 1000).toString() };
        updateParams.ExpressionAttributeValues[':result'] = { S: status };
    }
    
    if (errorMessage) {
        updateParams.UpdateExpression += ', error_message = :error';
        updateParams.ExpressionAttributeValues[':error'] = { S: errorMessage };
    }
    
    await dynamoDB.send(new UpdateItemCommand(updateParams));
}

async function updateFileRecords(userId, originalKey, newKey, scanResult, destinationBucket) {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create or update drive table record
    await dynamoDB.send(new UpdateItemCommand({
        TableName: process.env.DRIVE_TABLE,
        Key: {
            user_id: { S: userId },
            file_id: { S: newKey }
        },
        UpdateExpression: `SET 
            file_name = :fileName,
            s3_key = :s3Key,
            file_size = :fileSize,
            file_type = :fileType,
            folder_id = :folderId,
            scan_status = :scanStatus,
            last_modified = :timestamp,
            created_at = if_not_exists(created_at, :timestamp),
            trashed = if_not_exists(trashed, :trashed)
        `,
        ExpressionAttributeValues: {
            ':fileName': { S: extractFileName(newKey) },
            ':s3Key': { S: newKey },
            ':fileSize': { N: '0' }, // TODO: Get actual file size from S3
            ':fileType': { S: 'application/octet-stream' }, // TODO: Detect MIME type
            ':folderId': { S: 'root' },
            ':scanStatus': { S: scanResult.clean ? 'clean' : 'infected' },
            ':timestamp': { N: timestamp.toString() },
            ':trashed': { N: '0' }
        }
    }));
}

function extractFileName(s3Key) {
    const parts = s3Key.split('/');
    return parts[parts.length - 1];
}