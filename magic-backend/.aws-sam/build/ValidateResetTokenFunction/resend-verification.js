import crypto from 'crypto';
import { AdminGetUserCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { doc, cognito, ses } from './clients.js';




const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL, 
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};


export const handler = async (event) => {
  const { email } = JSON.parse(event.body);

  try {
    // 1. Check if user exists and is unconfirmed in Cognito
    const user = await cognito.send(new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email
    }));

    // Check if user is already confirmed
    const userStatus = user.UserStatus;
    if (userStatus !== 'UNCONFIRMED') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          message: 'User is already verified or does not exist.'
        })
      };
    }

    // 2. Check if there's an existing unused token that hasn't expired
    const now = Math.floor(Date.now() / 1000);
    const existingTokenScan = await doc.send(new ScanCommand({
      TableName: process.env.MAGIC_TOKEN_TABLE_NAME,
      FilterExpression: 'username = :username AND used = :used AND expiresAt > :now',
      ExpressionAttributeValues: {
        ':username': email,
        ':used': false,
        ':now': now
      }
    }));

    let token;
    
    if (existingTokenScan.Items && existingTokenScan.Items.length > 0) {
        // Use existing valid token (get the first one)
        token = existingTokenScan.Items[0].token;
        } else {
        // 3. Generate new token and store it
        token = crypto.randomBytes(32).toString('hex');
        const expiresAt = now + 10 * 60; // 10 minutes from now

      await doc.send(new PutCommand({
        TableName: process.env.MAGIC_TOKEN_TABLE_NAME,
        Item: {
          token,
          username: email,
          userPoolId: process.env.USER_POOL_ID,
          expiresAt,
          used: false,
          createdAt: now
        }
      }));
    }

    // 4. Send new magic link email
    const magicLink = `${process.env.API_URL}/verify?token=${encodeURIComponent(token)}`;

    const plainTextTemplate = `Hi there,

We received a request to resend your verification email.

Verify your account: ${magicLink}

This link will expire in 10 minutes. If you didn't request this, you can safely ignore this email.

Thanks,  
The Ellionis Team  
support@ellionis.click
`;

    const htmlTemplate = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
      
      <!-- Header -->
      <tr>
        <td style="padding: 25px; text-align: center; 
                   background: linear-gradient(90deg, #013220, #024d2a); 
                   color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">Verify Your Account</h1>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 20px; color: #222;">
          <p>Hi there,</p>
          <p>We received a request to resend your verification email. Click the button below to verify your account:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: #013220; color: #ffffff; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;
                      display: inline-block; transition: all 0.3s ease;">
              Verify Email
            </a>
          </p>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${magicLink}" style="color: #013220;">${magicLink}</a></p>
          <p style="margin-top: 20px;">This link will expire in 10 minutes.</p>
          <p>Thank you,<br>The Ellionis Team</p>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #555;">
          Need help? Contact us at 
          <a href="mailto:support@ellionis.click" style="color: #bfa14a;">support@ellionis.click</a>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    await ses.send(new SendEmailCommand({
      Source: process.env.FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Verify Your Ellionis Account' },
        Body: {
          Text: { Data: plainTextTemplate },
          Html: { Data: htmlTemplate }
        }
      }
    }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'If an unverified account exists with this email, a new verification link has been sent.'
      })
    };

  } catch (error) {
    console.error('Resend verification error:', error);
    
    // Return generic success message for security
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'If an unverified account exists with this email, a new verification link has been sent.'
      })
    };
  }
};
