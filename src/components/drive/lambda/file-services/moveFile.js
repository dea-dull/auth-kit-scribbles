//  MoveFileFunction:
//       Type: AWS::Serverless::Function
//       Properties:
//         FunctionName: !Sub moveFile-${Environment}
//         CodeUri: lambda/moveFile/
//         Handler: index.handler
//         Runtime: nodejs18.x
//         Policies:
//           - Statement:
//               - Effect: Allow
//                 Action:
//                   - s3:PutObject       # needed to upload or copy objects into a bucket
//                   - s3:DeleteObject    # needed to remove the original object
//                   - s3:GetObject  
//                 Resource:
//                   - !GetAtt DriveBucket.Arn
//               - Effect: Allow
//                 Action:
//                   - dynamodb:UpdateItem
//                   - dynamodb:GetItem
//                 Resource: !GetAtt DriveTable.Arn
//         Environment:
//           Variables:
//             DRIVE_BUCKET: !Ref DriveBucket
//             DRIVE_TABLE: !Ref DriveTable
//         Events:
//           MoveFile:
//             Type: Api
//             Properties:
//               Path: /drive/file-services/{id}/move
//               Method: PATCH
      

const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoDB = new DynamoDBClient();
const s3Client = new S3Client();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const fileId = event.pathParameters.id;

        const body = JSON.parse(event.body || '{}');
        const { targetFolderId, newFileName } = body;

        if (!targetFolderId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'targetFolderId is required' }),
            };
        }

        // Fetch file metadata
        const fileResult = await dynamoDB.send(new GetItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId },
            },
        }));

        if (!fileResult.Item) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'File not found' }),
            };
        }

        const currentFile = fileResult.Item;

        if (currentFile.trashed && currentFile.trashed.N === '1') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Cannot move a trashed file' }),
            };
        }

        const currentS3Key = currentFile.s3_key.S;
        const currentFileName = currentFile.file_name.S;

        // Build new key
        const newS3Key = generateNewS3Key(currentS3Key, targetFolderId, newFileName || currentFileName);

        // Copy to new location
        await s3Client.send(new CopyObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            CopySource: encodeURIComponent(`${process.env.DRIVE_BUCKET}/${currentS3Key}`),
            Key: newS3Key,
            MetadataDirective: 'COPY',
        }));

        // Delete old object
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.DRIVE_BUCKET,
            Key: currentS3Key,
        }));

        // Build update expression dynamically
        let updateExpression = 'SET folder_id = :folderId, s3_key = :s3Key, last_modified = :now';
        const values = {
            ':folderId': { S: targetFolderId },
            ':s3Key': { S: newS3Key },
            ':now': { N: Math.floor(Date.now() / 1000).toString() },
        };

        if (newFileName) {
            updateExpression += ', file_name = :fileName';
            values[':fileName'] = { S: newFileName };
        }

        // Update DynamoDB
        await dynamoDB.send(new UpdateItemCommand({
            TableName: process.env.DRIVE_TABLE,
            Key: {
                user_id: { S: userId },
                file_id: { S: fileId },
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: values,
            ConditionExpression: 'attribute_exists(file_id)',
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'File moved successfully',
                fileId,
                oldFolderId: currentFile.folder_id.S,
                newFolderId: targetFolderId,
                newS3Key,
                newFileName: newFileName || currentFileName,
            }),
        };

    } catch (error) {
        console.error('Error moving file:', error);

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to move file' }),
        };
    }
};


function generateNewS3Key(currentS3Key, targetFolderId, fileName) {
    // Detect extension from the newFileName itself OR from the old file
    const ext = fileName.includes('.') ?
        fileName.substring(fileName.lastIndexOf('.')) :
        currentS3Key.substring(currentS3Key.lastIndexOf('.'));

    // Strip extension if included inside provided fileName
    const baseName = fileName.replace(ext, '');

    const cleanName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_') + ext;

    return `${targetFolderId}/${cleanName}`;
}
