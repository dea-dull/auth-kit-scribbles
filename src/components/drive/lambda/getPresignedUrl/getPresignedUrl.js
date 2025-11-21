

// const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
//   #Getting presigned urls
//   GetPresignedUrlFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub getPresignedUrl-${Environment}
//       CodeUri: lambda/getPresignedUrl/ #change code uri
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Layers:
//         - !Ref AwsSdkV3Layer
//       Policies:
//         - Statement:
//             - Sid: AllowUploadOnlyToUnscannedBucket
//               Effect: Allow
//               Action:
//                 - s3:PutObject
//               Resource: !Sub arn:aws:s3:::${DriveUnscannedBucket}/*

//             - Sid: AllowDownloadOnlyFromDriveBucket
//               Effect: Allow
//               Action:
//                 - s3:GetObject
//               Resource: !Sub arn:aws:s3:::${DriveBucket}/*

//             - Sid: AllowReadUserSettings
//               Effect: Allow
//               Action:
//                 - dynamodb:GetItem
//                 - dynamodb:Query
//               Resource: !GetAtt UserSettingsTable.Arn   # <--- add this
//       Environment:
//         Variables:
//           DRIVE_UNSCANNED_BUCKET: !Ref DriveUnscannedBucket
//           DRIVE_BUCKET: !Ref DriveBucket
//           USER_SETTINGS_TABLE: !Ref UserSettingsTable
//       Events:
//         PresignedUrl:
//           Type: Api
//           Properties:
//             Path: /drive/pre-signed/transmit
//             Method: POST
// 





const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client();
const dynamoDB = new DynamoDBClient();

// --- constants ---
const MAX_EXPIRY = 1800; // 30 mins
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg','image/png','image/gif','image/webp','image/avif',
  'application/pdf','text/plain','application/zip','application/x-tar','application/x-gzip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-outlook',
  'audio/mpeg','audio/wav','audio/ogg',
  'video/mp4','video/webm'
];

const DEFAULT_LIMIT = 150 * 1024 * 1024; // fallback if user settings not found

// --- fetch user settings from DynamoDB ---
async function getUserSettings(userId, tableName) {
  const command = new GetItemCommand({
    TableName: tableName,
    Key: { user_id: { S: userId } }
  });

  const result = await dynamoDB.send(command);
  if (!result.Item) return null;

  return {
    storageLimit: parseInt(result.Item.storage_limit_mb?.N || '150') * 1024 * 1024,
    fileExpiryLimit: parseInt(result.Item.file_expiry_limit_minutes?.N || '30') * 60
  };
}

exports.handler = async (event) => {
  try {
    const { action, key, contentType } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.sub;

    if (!action || !key)
      return fail(400, 'Missing required fields: action, key');

    // --- Key sanitisation ---
    if (key.includes('..') || key.includes('//') || key.startsWith('/'))
      return fail(400, 'Invalid key format');

    // --- Restrict content types for upload ---
    if (action === 'upload' && !ALLOWED_CONTENT_TYPES.includes(contentType))
      return fail(400, 'Unsupported content type');

    // --- Get user settings ---
    const userSettings = await getUserSettings(userId, process.env.USER_SETTINGS_TABLE);
    const sizeLimit = userSettings?.storageLimit || DEFAULT_LIMIT;

    let bucket, command;

    if (action === 'upload') {
      bucket = process.env.DRIVE_UNSCANNED_BUCKET;
      const cleanKey = key.split('/').map(k => k.replace(/[^a-zA-Z0-9._-]/g,'_')).join('/');
      const fullKey = `${userId}/root/${cleanKey}`;


      // --- Enforce user-specific file size limit ---
      const fileSizeHeader = event.headers['content-length'] || event.headers['Content-Length'];
      if (fileSizeHeader && parseInt(fileSizeHeader) > sizeLimit) {
        return fail(400, `File exceeds your upload limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`);
      }

      command = new PutObjectCommand({
        Bucket: bucket,
        Key: fullKey,
        ContentType: contentType,
        Metadata: {
          uploadedBy: userId,
          uploadTime: Date.now().toString(),
          sizeLimit: sizeLimit.toString()
        }
      });
    } else if (action === 'download') {
      bucket = process.env.DRIVE_BUCKET;
     const cleanKey = key.split('/').map(k => k.replace(/[^a-zA-Z0-9._-]/g,'_')).join('/');
     const fullKey = `${userId}/root/${cleanKey}`;


      command = new GetObjectCommand({
        Bucket: bucket,
        Key: fullKey
      });
    } else {
      return fail(400, 'Invalid action. Use "upload" or "download"');
    }

    // --- Generate signed URL (fixed 30 min) ---
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: MAX_EXPIRY });

    return ok({
      signedUrl,
      key: fullKey,
      action,
      expiresIn: MAX_EXPIRY
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error.stack || error);
    return fail(500, 'Failed to generate presigned URL');
  }
};

// --- helpers ---
function ok(data) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, data })
  };
}

function fail(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: message })
  };
}
