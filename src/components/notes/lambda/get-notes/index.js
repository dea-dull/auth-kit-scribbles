const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");


const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const headers = {
   "Access-Control-Allow-Origin": process.env.FRONTEND_URL,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type,X-CSRF-Token",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
};

export const validateCsrf = (event) => {
  const cookies = parseCookies(event.headers.cookie);
  const csrfCookie = cookies.csrfToken;
  const csrfHeader = event.headers['x-csrf-token'];

  if (!csrfCookie || csrfCookie !== csrfHeader) {
    throw new Error('CSRF validation failed');
  }
};



exports.handler = async (event) => {
  try {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    validateCsrf(event);

    if (event.httpMethod !== 'GET') {
      return { 
        statusCode: 405, 
        headers, 
        body: JSON.stringify({ error: 'Method not allowed' }) 
      };
    }

    const { tag, pinned, favorite } = event.queryStringParameters || {};
    const userId = 'anonymous';
    
    // Base query for user's notes
    let params = {
      TableName: process.env.NOTES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    // Add filters for non-deleted notes and additional filters
    let filterExpressions = ['attribute_not_exists(deletedAt)'];
    
    if (tag) {
      filterExpressions.push('contains(tags, :tag)');
      params.ExpressionAttributeValues[':tag'] = tag;
    }
    
    if (pinned !== undefined) {
      filterExpressions.push('pinned = :pinned');
      params.ExpressionAttributeValues[':pinned'] = pinned === 'true';
    }
    
    if (favorite !== undefined) {
      filterExpressions.push('favorite = :favorite');
      params.ExpressionAttributeValues[':favorite'] = favorite === 'true';
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    // SDK v3 style - no .promise() needed
    const result = await dynamo.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    console.error('Get notes error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  };
};