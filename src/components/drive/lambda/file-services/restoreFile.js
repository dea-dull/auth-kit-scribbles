//  RestoreFileFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub restoreFile-${Environment}
//       CodeUri: lambda/restoreFile/
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Policies:
//       - Statement:
//           - Effect: Allow
//             Action:
//               - s3:ListObjectVersions     # find the delete marker
//               - s3:DeleteObjectVersion    # remove the delete marker to restore
//             Resource:
//               - !Sub "${DriveBucket.Arn}/*"
//           - Effect: Allow
//             Action:
//               - dynamodb:UpdateItem
//             Resource: !GetAtt DriveTable.Arn
//       Environment:
//         Variables:
//           DRIVE_BUCKET: !Ref DriveBucket
//           DRIVE_TABLE: !Ref DriveTable
//       Events:
//         RestoreFile:
//           Type: Api
//           Properties:
//             RestApiId: !Ref DriveApi
//             Path: /drive/file-services/{id}/restore
//             Method: POST


const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoDB = new DynamoDBClient();
const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const fileId = event.pathParameters.id;
        const body = JSON.parse(event.body || '{}');
        const targetFolderId = body.targetFolderId || 'root';

        // Get file metadata
        const fileResult = await dynamoDB.send(new GetItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            }
        }));

        if (!fileResult.Item) {
            return json(404, { error: 'File not found' });
        }

        const file = fileResult.Item;

        // Must be trashed
        if (!file.trashed || file.trashed.N !== '1') {
            return json(400, { error: 'File is not in trash' });
        }

        const fileName = file.file_name.S;
        const trashS3Key = file.s3_key.S;

        // Build restored S3 key
        const restoredS3Key = buildRestoredS3Key(userId, targetFolderId, fileName);

        // Copy file back from trash
        await s3Client.send(new CopyObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            CopySource: `${process.env.DRIVE_BUCKET}/${trashS3Key}`,
            Key: restoredS3Key,
            MetadataDirective: 'COPY'
        }));

        // Delete the trash object
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            Key: trashS3Key
        }));

        // Prepare update expressions
        const updateExpressions = [];
        const expressionValues = {
            ':newKey': { S: restoredS3Key },
            ':modified': { N: Math.floor(Date.now() / 1000).toString() }
        };

        // Trash attributes MUST be removed
        updateExpressions.push('REMOVE trashed, trash_expiry');

        // Set new values
        const setExpressions = ['s3_key = :newKey', 'last_modified = :modified'];

        // Only set folder_id if restoring into a folder, not root
        if (targetFolderId !== 'root') {
            setExpressions.push('folder_id = :folderId');
            expressionValues[':folderId'] = { S: targetFolderId };
        } else {
            // Remove folder_id if restoring to root
            updateExpressions.push('REMOVE folder_id');
        }

        // Combine
        const fullUpdateExpression = updateExpressions.join(' ') + ' SET ' + setExpressions.join(', ');

        // Update DynamoDB
        await dynamoDB.send(new UpdateItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId }
            },
            UpdateExpression: fullUpdateExpression,
            ExpressionAttributeValues: expressionValues,
            ConditionExpression: 'attribute_exists(file_id)'
        }));

        return json(200, {
            message: 'File restored successfully',
            fileId,
            fileName,
            restoredTo: targetFolderId,
            s3Key: restoredS3Key
        });

    } catch (error) {
        console.error('Restore error:', error);

        if (error.name === 'ConditionalCheckFailedException') {
            return json(404, { error: 'File not found during update' });
        }

        return json(500, { error: 'Failed to restore file' });
    }
};

function buildRestoredS3Key(userId, folderId, fileName) {
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();

   if (folderId === 'root') {
        return `${userId}/root/${cleanName}_restored_${timestamp}`;
    }

    return `${userId}/root/${folderId}/${cleanName}_restored_${timestamp}`;
    
}

function json(status, body) {
    return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}
