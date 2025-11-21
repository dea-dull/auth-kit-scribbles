
//   UpdateFileRecordFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub updateFileRecord-${Environment}
//       CodeUri: lambda/updateFileRecord/
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//                 - dynamodb:UpdateItem   #updating file records
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
//         UpdateFile:
//           Type: Api
//           Properties:
//             Path: /drive/file-records/updateFileRecord/{id}
//             Method: PATCH




const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer.claims.sub;
        const body = JSON.parse(event.body);

        // Determine if single file or multiple
        const fileIds = body.fileIds || (event.pathParameters?.id ? [event.pathParameters.id] : []);
        const updates = body.updates || body; // support legacy single-file format

        if (!fileIds.length) {
            return json(400, { error: 'No file IDs provided' });
        }

        const results = [];

        for (const fileId of fileIds) {
            // Check ownership
            const file = await dynamoDB.send(new GetItemCommand({
                TableName: process.env.DRIVE_TABLE,
                Key: { user_id: { S: userId }, file_id: { S: fileId } }
            }));

            if (!file.Item) {
                results.push({ fileId, error: 'File not found' });
                continue;
            }

            // Build update expression
            const updateParams = buildUpdateExpression(updates);

            const result = await dynamoDB.send(new UpdateItemCommand({
                TableName: process.env.DRIVE_TABLE,
                Key: { user_id: { S: userId }, file_id: { S: fileId } },
                UpdateExpression: updateParams.updateExpression,
                ExpressionAttributeNames: updateParams.expressionAttributeNames,
                ExpressionAttributeValues: updateParams.expressionAttributeValues,
                ConditionExpression: 'attribute_exists(file_id)',
                ReturnValues: 'ALL_NEW'
            }));

            results.push({ fileId, updated: formatDynamoDBItem(result.Attributes) });
        }

        return json(200, { message: 'Update completed', results });

    } catch (error) {
        console.error('Error updating file record:', error);
        return json(500, { error: 'Failed to update file record' });
    }
};

function buildUpdateExpression(updates) {
    const allowedFields = ['fileName', 'folderId', 'tags', 'isPrivate'];
    let updateExpression = 'SET last_modified = :lastModified';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
        ':lastModified': { N: Math.floor(Date.now() / 1000).toString() }
    };

    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            const attrName = `#${key}`;
            const attrValue = `:${key}`;
            updateExpression += `, ${attrName} = ${attrValue}`;
            expressionAttributeNames[attrName] = mapFieldName(key);

            if (key === 'fileName' || key === 'folderId') {
                expressionAttributeValues[attrValue] = { S: updates[key] };
            } else if (key === 'tags') {
                expressionAttributeValues[attrValue] = { L: updates[key].map(tag => ({ S: tag })) };
            } else if (key === 'isPrivate') {
                expressionAttributeValues[attrValue] = { BOOL: updates[key] };
            }
        }
    });

    return { updateExpression, expressionAttributeNames, expressionAttributeValues };
}

function mapFieldName(field) {
    const map = { fileName: 'file_name', folderId: 'folder_id', isPrivate: 'is_private' };
    return map[field] || field;
}

function formatDynamoDBItem(item) {
    const formatted = {};
    Object.keys(item).forEach(key => {
        const val = item[key];
        if (val.S) formatted[key] = val.S;
        else if (val.N) formatted[key] = parseInt(val.N);
        else if (val.BOOL !== undefined) formatted[key] = val.BOOL;
        else if (val.L) formatted[key] = val.L.map(i => i.S);
    });
    return formatted;
}

function json(status, body) {
    return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

