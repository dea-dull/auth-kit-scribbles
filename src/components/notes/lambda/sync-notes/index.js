

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient,  PutCommand } = require("@aws-sdk/lib-dynamodb");


const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client); // Add DocumentClient

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  try {
    // Handle preflight
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const note = JSON.parse(event.body);

    if (!note.id || !note.title) {
      return {
        statusCode: 400,
        headers,
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
      headers,
      body: JSON.stringify({
        success: true,
        syncedAt: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Sync error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};