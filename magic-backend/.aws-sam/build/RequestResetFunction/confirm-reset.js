
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL, 
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};


const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Missing fields" }) };
    }

    // Validate token again before confirming
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: process.env.RESET_TOKEN_TABLE_NAME,
        Key: { token },
      })
    );

    if (!Item || Date.now() > Item.expiry) {
      return { 
        statusCode: 400, 
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invalid or expired token" }) };
    }

    // Update password in Cognito
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: Item.username,
        Password: newPassword,
        Permanent: true,
      })
    );

    // Invalidate token
    await ddb.send(
      new DeleteCommand({
        TableName: process.env.RESET_TOKEN_TABLE_NAME,
        Key: { token },
      })
    );

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Confirm reset error:", err);

    if (err.name === "PasswordHistoryPolicyViolationException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "You cannot reuse a previous password. Please choose a new one.",
        }),
      };
    }


    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Could not reset password. Try again later." }),
    };
  }
};
