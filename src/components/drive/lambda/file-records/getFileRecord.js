//  GetFileRecordFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub getFileRecord-${Environment}
//       CodeUri: lambda/getFileRecord/ #change code uri
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//               - dynamodb:GetItem
//               - dynamodb:Query
//               - dynamodb:Scan
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
//         FileInfo:
//           Type: Api
//           Properties:
//             Path: /drive/file-records/getFileRecord/{id}
//             Method: GET
const { DynamoDBClient, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const fileId = event.pathParameters?.id;
    const folderId = event.queryStringParameters?.folderId || 'root';

    if (fileId) {
      // --- Single file fetch ---
      const fileResult = await dynamoDB.send(new GetItemCommand({
        TableName: process.env.DRIVE_TABLE,
        Key: { user_id: { S: userId }, file_id: { S: fileId } }
      }));

      if (!fileResult.Item) return json(404, { error: 'File not found' });

      const scanResult = await dynamoDB.send(new GetItemCommand({
        TableName: process.env.SCAN_TABLE,
        Key: { user_id: { S: userId }, file_id: { S: fileId } }
      }));

      const fileData = unmarshall(fileResult.Item);
      const scanData = scanResult.Item ? unmarshall(scanResult.Item) : {};

      return json(200, {
        ...fileData,
        scanStatus: scanData.scan_status || 'unknown',
        scannedAt: scanData.scanned_at || null,
        scanResult: scanData.scan_result || null
      });
    } else {
            // --- Multiple files in a folder ---
        const queryResult = await dynamoDB.send(new QueryCommand({
        TableName: process.env.DRIVE_TABLE,
        IndexName: 'user_folder_index', // ensure GSI exists
        KeyConditionExpression: 'user_id = :uid AND folder_id = :fid',
        ExpressionAttributeValues: {
            ':uid': { S: userId },
            ':fid': { S: folderId }
        }
        }));

        const files = queryResult.Items.map(unmarshall);

        if (files.length > 0) {
        const batchKeys = files.map(f => ({
            user_id: { S: userId },
            file_id: { S: f.file_id }
        }));

        const scanResults = await dynamoDB.send({
            BatchGetItemCommand: {
            RequestItems: {
                [process.env.SCAN_TABLE]: { Keys: batchKeys }
            }
            }
        });

        const scanMap = {};
        const scanItems = scanResults.Responses?.[process.env.SCAN_TABLE] || [];
        scanItems.forEach(item => {
            const data = unmarshall(item);
            scanMap[data.file_id] = data;
        });

        // merge scan info
        files.forEach(f => {
            const scan = scanMap[f.file_id] || {};
            f.scanStatus = scan.scan_status || 'unknown';
            f.scannedAt = scan.scanned_at || null;
            f.scanResult = scan.scan_result || null;
        });
        }

        return json(200, files);

    }
  } catch (error) {
    console.error('Error getting file records:', error);
    return json(500, { error: 'Failed to get file record(s)' });
  }
};

// --- helper ---
function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}
