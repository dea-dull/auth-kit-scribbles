//   CreateFileRecordFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub createFileRecord-${Environment}
//       CodeUri: lambda/createFileRecord/
//       Handler: index.handler  #change
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//                 - dynamodb:PutItem
//               Resource:
//                 - !GetAtt DriveTable.Arn
//                 - !GetAtt ScanTable.Arn
//                 - !GetAtt ShareTable.Arn

//       Environment:
//         Variables:
//           SCAN_TABLE: !Ref ScanTable
//           DRIVE_TABLE: !Ref DriveTable
//           SHARE_TABLE: !Ref ShareTable
//       Events:
//         CreateFile:
//           Type: Api
//           Properties:
//             Path: /drive/file-records/createFileRecord
//             Method: POST
const { DynamoDBClient, PutItemCommand, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        let body = JSON.parse(event.body);

        // Normalize to array for batch
        const files = Array.isArray(body) ? body : [body];

        if (files.length === 0) return json(400, { error: 'No files provided' });

        const timestamp = Math.floor(Date.now() / 1000);
        const driveItems = [];
        const scanItems = [];
        const createdFiles = [];

        for (let f of files) {
            const { fileName, fileSize, fileType, folderId = 'root', tags = [], isPrivate = false } = f;

            if (!fileName || !fileSize) {
                return json(400, { error: 'Missing required fields: fileName, fileSize' });
            }

            const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const resolvedFolder = folderId === 'root' ? 'root' : folderId;
            const s3Key = `${userId}/${resolvedFolder}/${cleanFileName}`;
            const fileId = uuidv4();

            driveItems.push({
                PutRequest: {
                    Item: {
                        user_id: { S: userId },
                        file_id: { S: fileId },
                        file_name: { S: cleanFileName },
                        file_size: { N: fileSize.toString() },
                        file_type: { S: fileType || 'application/octet-stream' },
                        s3_key: { S: s3Key },
                        folder_id: { S: resolvedFolder },
                        tags: { L: tags.map(tag => ({ S: tag })) },
                        is_private: { BOOL: isPrivate },
                        created_at: { N: timestamp.toString() },
                        last_accessed: { N: timestamp.toString() },
                        last_modified: { N: timestamp.toString() },
                        trashed: { N: '0' },
                        version: { N: '1' }
                    }
                }
            });

            scanItems.push({
                PutRequest: {
                    Item: {
                        user_id: { S: userId },
                        file_id: { S: fileId },
                        scan_status: { S: 'pending' },
                        file_name: { S: cleanFileName },
                        s3_key: { S: s3Key },
                        uploaded_at: { N: timestamp.toString() },
                        scan_attempts: { N: '0' }
                    }
                }
            });

            createdFiles.push({
                fileId,
                fileName: cleanFileName,
                fileSize,
                fileType: fileType || 'application/octet-stream',
                s3Key,
                folderId: resolvedFolder,
                scanStatus: 'pending'
            });
        }

        // Use BatchWriteItem if more than 1 file, otherwise PutItem for single file
        if (files.length === 1) {
            await Promise.all([
                dynamoDB.send(new PutItemCommand({ TableName: process.env.DRIVE_TABLE, Item: driveItems[0].PutRequest.Item })),
                dynamoDB.send(new PutItemCommand({ TableName: process.env.SCAN_TABLE, Item: scanItems[0].PutRequest.Item }))
            ]);
        } else {
            await Promise.all([
                dynamoDB.send(new BatchWriteItemCommand({ RequestItems: { [process.env.DRIVE_TABLE]: driveItems } })),
                dynamoDB.send(new BatchWriteItemCommand({ RequestItems: { [process.env.SCAN_TABLE]: scanItems } }))
            ]);
        }

        return json(201, {
            message: 'File record(s) created successfully',
            files: createdFiles
        });

    } catch (error) {
        console.error('Error creating file record(s):', error);
        return json(500, { error: 'Failed to create file record(s)' });
    }
};

function json(status, body) {
    return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}
