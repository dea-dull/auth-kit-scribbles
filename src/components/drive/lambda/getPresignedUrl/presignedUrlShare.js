/*  PresignedUrlShareFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub presignedUrlShare-${Environment}
      CodeUri: lambda/presignedUrlShare/ #change code uri
      Handler: index.handler
      Runtime: nodejs18.x
      Layers:
        - !Ref AwsSdkV3Layer  # ← Attach layer here
      Policies:
       - Statement:
          - Sid: AllowGetObjectFromDriveBucket
            Effect: Allow
            Action:
              - s3:GetObject
            Resource: !Sub arn:aws:s3:::${DriveBucket}/*
          
          - Sid: AllowPutAndGetItemInShareTable
            Effect: Allow
            Action:
              - dynamodb:PutItem
              - dynamodb:GetItem
            Resource: !GetAtt ShareTable.Arn
          - Sid: AllowReadAndUpdateUserSettings
            Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:UpdateItem
            Resource: !GetAtt UserSettingsTable.Arn 
      Environment:
        Variables:
          DRIVE_BUCKET: !Ref DriveBucket
          SHARE_TABLE: !Ref ShareTable
          USER_SETTINGS_TABLE: !Ref UserSettingsTable
      Events:
        ShareUrl:
          Type: Api
          Properties:
            Path: /drive/pre-signed/share
            Method: POST
 */


const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client();
const dynamoDB = new DynamoDBClient();

// --- fetch user plan/settings from UserSettings table ---
async function getUserSettings(userId, tableName) {
  const command = new GetItemCommand({
    TableName: tableName,
    Key: { user_id: { S: userId } }
  });

  const result = await dynamoDB.send(command);
  if (!result.Item) return null;

  return {
    plan: result.Item.plan?.S || 'free',
    sharesUsedThisMonth: parseInt(result.Item.shares_used_this_month?.N || '0'),
    maxSharesPerMonth: parseInt(result.Item.max_shares_per_month?.N || '7'),
    maxExpirySeconds: parseInt(result.Item.max_expiry_seconds?.N || (24*3600)) // default 1 day
  };
}

exports.handler = async (event) => {
  try {
    const { fileKey, expiresIn } = JSON.parse(event.body);
    const userId = event.requestContext.authorizer.claims.sub;

    if (!fileKey)
      return fail(400, 'Missing required field: fileKey');

    // --- verify ownership ---
    if (!fileKey.startsWith(`uploads/${userId}/`))
      return fail(403, 'You do not have permission to share this file.');

    // --- get user settings from UserSettings table ---
    const userSettings = await getUserSettings(userId, process.env.USER_SETTINGS_TABLE);
    const userPlan = userSettings?.plan || 'free';
    const sharesUsed = userSettings?.sharesUsedThisMonth || 0;
    const maxShares = userSettings?.maxSharesPerMonth || 7;
    const planMaxExpiry = userSettings?.maxExpirySeconds || 24*3600; // fallback 1 day

    // --- enforce per-plan monthly share limit ---
    if (sharesUsed >= maxShares)
      return fail(403, `Monthly share limit reached for plan "${userPlan}"`);

    // --- clamp expiry ---
    const MAX_AWS_EXPIRY = 7 * 24 * 3600; // 7 days
    const requestedExpiry = parseInt(expiresIn) || 3600; // default 1h
    const finalExpiry = Math.min(requestedExpiry, MAX_AWS_EXPIRY, planMaxExpiry);

    // --- generate presigned URL ---
    const shareId = uuidv4();
    const command = new GetObjectCommand({
      Bucket: process.env.DRIVE_BUCKET,
      Key: fileKey
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: finalExpiry });

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + finalExpiry;

    // --- store share record in DynamoDB ---
    await dynamoDB.send(new PutItemCommand({
      TableName: process.env.SHARE_TABLE,
      Item: {
        share_id: { S: shareId },
        user_id: { S: userId },
        file_key: { S: fileKey },
        created_at: { N: now.toString() },
        expires_at: { N: expiresAt.toString() },
        plan: { S: userPlan }
      }
    }));

    await dynamoDB.send(new UpdateItemCommand({
      TableName: process.env.USER_SETTINGS_TABLE,
      Key: { user_id: { S: userId } },
      UpdateExpression: 'SET shares_used_this_month = if_not_exists(shares_used_this_month, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': { N: '1' },
        ':zero': { N: '0' }
      }
    }));

    return ok({
      shareId,
      signedUrl,
      fileKey,
      expiresIn: finalExpiry,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error creating share URL:', error);
    return fail(500, 'Failed to create shareable URL');
  }
};

// --- helpers ---
function ok(data) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ success: true, data })
  };
}

function fail(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ success: false, error: message })
  };
}

/* NOTES:
- Per-plan limits (monthly shares, max expiry) are fetched from "UserSettings" table.
- UserSettings table must store:
    - plan
    - shares_used_this_month
    - max_shares_per_month
    - max_expiry_seconds
- MAX_AWS_EXPIRY ensures we do not exceed AWS's 7-day presigned URL limit.
*/
