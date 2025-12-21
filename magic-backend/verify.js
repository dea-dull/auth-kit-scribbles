import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AdminConfirmSignUpCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { doc, cognito } from './clients.js';


export const handler = async (event) => {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return {
      statusCode: 302,
      headers: {
       Location: `${process.env.FRONTEND_URL}/verify?reason=missing_token` }
    };
  }

  try {
    // 1. Get token record
    const { Item } = await doc.send(new GetCommand({
      TableName: process.env.MAGIC_TOKEN_TABLE_NAME,
      Key: { token }
    }));

    if (!Item) {
      return { statusCode: 302, headers: { Location: `${process.env.FRONTEND_URL}/verify?reason=invalid_token` } };
    }

    if (Item.used) {
      return { 
        statusCode: 302,
        headers: { 
          Location: `${process.env.FRONTEND_URL}/verify?reason=already_used` 
        } };
    }

    if (Item.expiresAt < Math.floor(Date.now() / 1000)) {
      return { 
        statusCode: 302, 
        headers: { 
          Location: `${process.env.FRONTEND_URL}/verify?reason=expired` 
        } };
    }

    // 2. Confirm user in Cognito
    await cognito.send(new AdminConfirmSignUpCommand({
      UserPoolId: Item.userPoolId,
      Username: Item.username
    }));

    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: Item.userPoolId,
      Username: Item.username,
      UserAttributes: [{ Name: 'email_verified', Value: 'true' }]
    }));

    // 3. Mark token as used
    await doc.send(new UpdateCommand({
      TableName: process.env.MAGIC_TOKEN_TABLE_NAME,
      Key: { token },
      UpdateExpression: 'SET #used = :true, #usedAt = :now',
      ExpressionAttributeNames: { '#used': 'used', '#usedAt': 'usedAt' },
      ExpressionAttributeValues: { ':true': true, ':now': Math.floor(Date.now() / 1000) }
    }));

    return {
      statusCode: 302,
      headers: { 
        Location: `${process.env.FRONTEND_URL}/verify?reason=success` 
      }
    };
  } catch (error) {
    console.error('Verify error:', error);
    return {
      statusCode: 302,
      headers: { 
        Location: `${process.env.FRONTEND_URL}/verify-error?reason=error` 
      }
    };
  }
};
