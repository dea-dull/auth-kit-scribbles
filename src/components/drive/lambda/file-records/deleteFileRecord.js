

//   DeleteFileRecordFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub deleteFileRecord-${Environment}
//       CodeUri: lambda/deleteFileRecord/
//       Handler: index.handler  #change
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//                - dynamodb:DeleteItem
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
//         DeleteFile:
//           Type: Api
//           Properties:
//             Path: /drive/file-records/deleteFileRecord/{id}
//             Method: DELETE 


const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const fileId = event.pathParameters.id;

        // Validate file exists and user owns it
        const file = await dynamoDB.send(new GetItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            }
        }));

        if (!file.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        // Check if already trashed
        if (file.Item.trashed && file.Item.trashed.N === '1') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File is already trashed' })
            };
        }

        // Calculate trash expiry (7 days from now)
        const trashExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

        // Soft delete - mark as trashed
        const updateCommand = new UpdateItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            },
            UpdateExpression: 'SET trashed = :trashed, trash_expiry = :trashExpiry, last_modified = :lastModified',
            ExpressionAttributeValues: {
                ':trashed': { N: '1' },
                ':trashExpiry': { N: trashExpiry.toString() },
                ':lastModified': { N: Math.floor(Date.now() / 1000).toString() }
            },
            ConditionExpression: 'attribute_exists(file_id)',
            ReturnValues: 'ALL_NEW'
        });

        const result = await dynamoDB.send(updateCommand);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'File moved to trash successfully',
                fileId,
                trashExpiry: new Date(trashExpiry * 1000).toISOString(),
                permanentDeletionDate: new Date((trashExpiry + 1) * 1000).toISOString() // +1 second for clarity
            })
        };

    } catch (error) {
        console.error('Error soft deleting file:', error);
        
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File not found' })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to move file to trash' })
        };
    }
};

