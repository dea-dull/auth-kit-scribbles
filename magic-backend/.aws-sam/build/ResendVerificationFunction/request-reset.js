import crypto from "crypto";
import { AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { doc, cognito, ses } from "./clients.js";


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL, 
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export const handler = async (event) => {
  const { email } = JSON.parse(event.body);

  function maskEmail(email) {
    const [local, domain] = email.split("@");
    if (local.length <= 2) {
      return local[0] + "*".repeat(local.length - 1) + "@" + domain;
    }
    return local[0] + "*".repeat(local.length - 2) + local.slice(-1) + "@" + domain;
  }



  try {
    // 1. Check user exists in Cognito
    const user = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
      })
    );

    if (!user) {
      // Return generic response (don't leak info)
      return successResponse();
    }

    // 2. Create reset token
    const now = Math.floor(Date.now() / 1000);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = now + 10 * 60; // 10 min

    await doc.send(
      new PutCommand({
        TableName: process.env.RESET_TOKEN_TABLE_NAME,
        Item: {
          token,
          username: email,
          userPoolId: process.env.USER_POOL_ID,
          expiresAt,
          used: false,
          createdAt: now,
        },
      })
    );

    const maskedEmail = maskEmail(email);

    // 3. Build reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(
      token)}&maskedEmail=${encodeURIComponent(maskedEmail)}`;

    // 4. Email templates
    const plainTextTemplate = `Hi there,

We received a request to reset your Ellionis account password.

Reset your password: ${resetLink}

This link will expire in 10 minutes. If you didn’t request this, you can safely ignore this email.

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
          <h1 style="margin: 0; font-size: 24px;">Reset Your Password</h1>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding: 20px; color: #222;">
          <p>Hi there,</p>
          <p>We received a request to reset your Ellionis account password. Click the button below to continue:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #013220; color: #ffffff; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;
                      display: inline-block; transition: all 0.3s ease;">
              Reset Password
            </a>
          </p>

          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}" style="color: #013220;">${resetLink}</a></p>
          <p style="margin-top: 20px;">This link will expire in 10 minutes. If you didn’t request this, you can ignore this email.</p>
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

    await ses.send(
      new SendEmailCommand({
        Source: process.env.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: "Reset Your Ellionis Password" },
          Body: {
            Text: { Data: plainTextTemplate },
            Html: { Data: htmlTemplate },
          },
        },
      })
    );

    return successResponse();
  } catch (error) {
    console.error("Request reset error", error);
    return successResponse(); // Always generic
  }
};

function successResponse() {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    }),
  };
}
