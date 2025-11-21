//   DeleteFileFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub DeleteFile-${Environment}
//       CodeUri: lambda/DeleteFile/
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//                 - s3:DeleteObject    # needed to remove the original object
//               Resource:
//                 - !Sub "${DriveBucket.Arn}/*"
//             - Effect: Allow
//               Action:
//                 - dynamodb:UpdateItem
//               Resource: !GetAtt DriveTable.Arn

//       Environment:
//         Variables:
//           DRIVE_BUCKET: !Ref DriveBucket
//           DRIVE_TABLE: !Ref DriveTable
//       Events:
//         SoftDelete:
//           Type: Api
//           Properties:
//             Path: /drive/file-services/{id}/soft-delete
//             Method: DELETE

const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoDB = new DynamoDBClient();
const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const fileId = event.pathParameters.id;

        // 1. Fetch file
        const fileResult = await dynamoDB.send(new GetItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            }
        }));

        if (!fileResult.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File not found' })
            };
        }

        const file = fileResult.Item;

        // 2. Prevent double delete
        if (file.trashed?.N === '1') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File is already in trash' })
            };
        }

        const currentS3Key = file.s3_key.S;
        const fileName = file.file_name.S;

        // S3 trash destination
        const trashS3Key = `trash/${userId}/${fileId}/${fileName}`;

        // 3. Copy → Trash
        await s3Client.send(new CopyObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            CopySource: `${process.env.DRIVE_BUCKET}/${currentS3Key}`,
            Key: trashS3Key,
            MetadataDirective: 'COPY'
        }));

        // 4. Remove original
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            Key: currentS3Key
        }));

        // 5. Set trash expiry (always 7 days for now)
        const trashExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

        // 6. Update DB record
        await dynamoDB.send(new UpdateItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            },
            UpdateExpression:
                'SET trashed = :t, trash_expiry = :exp, s3_key = :newKey, last_modified = :modified REMOVE folder_id',
            ExpressionAttributeValues: {
                ':t': { N: '1' },
                ':exp': { N: trashExpiry.toString() },
                ':newKey': { S: trashS3Key },
                ':modified': { N: Math.floor(Date.now() / 1000).toString() }
            },
            ConditionExpression: 'attribute_exists(file_id)'
        }));

        // 7. Return clean output
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'File moved to trash',
                fileId,
                fileName,
                trashExpiry: new Date(trashExpiry * 1000).toISOString()
            })
        };

    } catch (error) {
        console.error('Soft delete error:', error);

        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File not found during update' })
            };
        }

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to move file to trash' })
        };
    }
};
