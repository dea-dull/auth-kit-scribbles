

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient,  PutCommand } = require("@aws-sdk/lib-dynamodb");


const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client); // Add DocumentClient


const CORS_HEADERS = {
   'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
  'Access-Control-Allow-Headers': ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  'Access-Control-Allow-Methods': ['OPTIONS', 'POST'],
  'Access-Control-Allow-Credentials': ['true'],
};


const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...valParts] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(valParts.join('='));
    return cookies;
  }, {});
};

const validateCsrf = (event) => {
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
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, multiValueHeaders: CORS_HEADERS, body: "" };
    }

    validateCsrf(event);

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        multiValueHeaders: CORS_HEADERS,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const note = JSON.parse(event.body);

    if (!note.id || !note.title) {
      return {
        statusCode: 400,
        multiValueHeaders: CORS_HEADERS,
        body: JSON.stringify({
          error: "Missing required fields: id and title",
        }),
      };
    }

    // Much cleaner with DocumentClient - no manual type conversion needed
    const dbNote = {
      noteId: note.id,
      userId: "anonymous",
      title: note.title,
      content: note.content || "",
      tags: note.tags || [],
      pinned: note.pinned || false,
      favorite: note.favorite || false,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
      lastSynced: new Date().toISOString(),
    };

    // Use PutCommand instead of PutItemCommand with DocumentClient
    await dynamo.send(
      new PutCommand({
        TableName: process.env.NOTES_TABLE,
        Item: dbNote,
      })
    );

    return {
      statusCode: 200,
      multiValueHeaders: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        syncedAt: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Sync error:", error);
    return {
      statusCode: 500,
      multiValueHeaders: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};