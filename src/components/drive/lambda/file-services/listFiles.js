
//   ListFilesFunction:

//  ListFilesFunction:
//     Type: AWS::Serverless::Function
//     Properties:
//       FunctionName: !Sub listFiles-${Environment}
//       CodeUri: lambda/listFiles/
//       Handler: index.handler
//       Runtime: nodejs18.x
//       Policies:
//         - Statement:
//             - Effect: Allow
//               Action:
//                 - dynamodb:Query
//               Resource:
//                 - !GetAtt DriveTable.Arn
//                 - !Sub ${DriveTable.Arn}/index/UserLastAccessedIndex
//                 - !Sub ${DriveTable.Arn}/index/UserFolderIndex
//                 - !Sub ${DriveTable.Arn}/index/UserTrashedIndex    # updated index
//         - Statement:
//             - Effect: Allow
//               Action:
//                 - dynamodb:GetItem
//               Resource: !GetAtt UserSettingsTable.Arn
//       Environment:
//         Variables:
//           DRIVE_TABLE: !Ref DriveTable
//           USER_SETTINGS_TABLE: !Ref UserSettingsTable
//       Events:
//         ListFiles:
//           Type: Api
//           Properties:
//             Path: /drive/file-service/listFiles
//             Method: GET



// Also used to list Recent Files and Files in Trash



const { DynamoDBClient, QueryCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient();

// Allowed sorts
const ALLOWED_SORTS = new Set(['last_accessed', 'created_at']); // extend if needed
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    if (!userId) return fail(401, 'Unauthorized');

    // parse and validate query params
    const qs = event.queryStringParameters || {};
    const folderId = qs.folderId;
    const tag = qs.tag;
    const trashed = qs.trashed === 'true';
    const sort = qs.sort || 'last_accessed';
    const order = (qs.order || 'desc').toLowerCase();
    const limit = Math.min(parseInt(qs.limit || DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, MAX_LIMIT);

    if (!ALLOWED_SORTS.has(sort)) return fail(400, 'Invalid sort parameter');
    if (order !== 'asc' && order !== 'desc') return fail(400, 'Invalid order parameter');

    // Only token-based pagination supported
    const nextPageToken = qs.nextPageToken || null;
    const exclusiveStartKey = decodeNextPageToken(nextPageToken);

    // fetch user settings (plan limits / feature gates)
    const userSettings = await getUserSettings(userId, process.env.USER_SETTINGS_TABLE);
    const planLimits = (userSettings && userSettings.plan_limits) || {};
    const tagFilteringAllowed = !!planLimits.tag_filtering;
    const trashAllowed = !!planLimits.trash_feature;

    // if user tries to use tag filter but plan doesn't allow -> forbidden
    if (tag && !tagFilteringAllowed) return fail(403, 'Tag filtering not enabled for your plan');

    // if user tries to list trashed but plan doesn't allow -> forbidden
    if (trashed && !trashAllowed) return fail(403, 'Trash access not enabled for your plan');

    // build DynamoDB query params depending on request type
    const { params, indexUsed } = buildQueryParams({
      userId, folderId, tag, trashed, sort, order, limit, exclusiveStartKey
    });

    // run query
    const result = await dynamoDB.send(new QueryCommand(params));

    const items = (result.Items || []).map(i => unmarshall(i));
    const response = {
      files: items,
      pagination: {
        limit,
        hasMore: !!result.LastEvaluatedKey
      }
    };

    if (result.LastEvaluatedKey) {
      response.pagination.nextPageToken = encodeNextPageToken(result.LastEvaluatedKey);
    }

    // optionally include which index was used for debugging (remove in prod if you prefer)
    response.meta = { indexUsed };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (err) {
    console.error('ListFiles error:', err);
    return fail(500, 'Failed to list files');
  }
};

/* ---------------- helpers ---------------- */

async function getUserSettings(userId, tableName) {
  if (!tableName) return null;
  try {
    const cmd = new GetItemCommand({
      TableName: tableName,
      Key: { user_id: { S: userId } }
    });
    const res = await dynamoDB.send(cmd);
    if (!res.Item) return null;
    const item = unmarshall(res.Item);
    // ensure plan_limits exists as object
    item.plan_limits = item.plan_limits || {};
    return item;
  } catch (err) {
    console.error('getUserSettings failed:', err);
    return null;
  }
}

function buildQueryParams({ userId, folderId, tag, trashed, sort, order, limit, exclusiveStartKey }) {
  // Default to recent files index when not folder or trash
  let params = {
    TableName: process.env.DRIVE_TABLE,
    Limit: limit,
    ScanIndexForward: order === 'asc', // true => ascending
    ExpressionAttributeValues: { ':userId': { S: userId } }
  };

  // If folderId -> use UserFolderIndex (assumes PK=user_id, SK=folder_id)
  if (folderId) {
    params.IndexName = 'UserFolderIndex';
    params.KeyConditionExpression = 'user_id = :userId AND folder_id = :folderId';
    params.ExpressionAttributeValues[':folderId'] = { S: folderId };
    if (tag) {
      params.FilterExpression = 'contains (#tags, :tag)';
      params.ExpressionAttributeValues[':tag'] = { S: tag };
      params.ExpressionAttributeNames = { '#tags': 'tags' };
    }
    if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey;
    return { params, indexUsed: params.IndexName };
  }

  // If trashed -> use UserTrashedIndex (assumes PK=user_id, SK=trashed_at, sparse index)
  if (trashed) {
    params.IndexName = 'UserTrashedIndex';
    params.KeyConditionExpression = 'user_id = :userId';
    // optional tag filter
    if (tag) {
      params.FilterExpression = 'contains (#tags, :tag)';
      params.ExpressionAttributeValues[':tag'] = { S: tag };
      params.ExpressionAttributeNames = { '#tags': 'tags' };
    }
    if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey;
    return { params, indexUsed: params.IndexName };
  }

  // Default recent files -> UserLastAccessedIndex (assumes PK=user_id, SK=last_accessed)
  params.IndexName = 'UserLastAccessedIndex';
  params.KeyConditionExpression = 'user_id = :userId';
  if (tag) {
    params.FilterExpression = 'contains (#tags, :tag)';
    params.ExpressionAttributeValues[':tag'] = { S: tag };
    params.ExpressionAttributeNames = { '#tags': 'tags' };
  }
  if (exclusiveStartKey) params.ExclusiveStartKey = exclusiveStartKey;
  return { params, indexUsed: params.IndexName };
}

function decodeNextPageToken(token) {
  if (!token) return undefined;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('Invalid nextPageToken', err);
    return undefined;
  }
}

function encodeNextPageToken(lastEvaluatedKey) {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
}

function fail(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, error: message })
  };
}










// {
//   "user_id": "user-123",
//   "plan_type": "pro",
//   "plan_limits": {
//     "tag_filtering": true,
//     "max_shares_per_month": 50,
//     "max_expiry_seconds": 604800
//   },
//   "storage_limit_mb": 250,
//   "shares_used_this_month": 4,
//   "quota_reset_at": 1735689600
// }
// Your UserSettings DynamoDB item should look like this: