import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import setCookie from './setCookie.js'; 
import crypto from 'crypto';


const CORS_HEADERS = {
  'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
  'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'],
  'Access-Control-Allow-Methods': ['OPTIONS', 'POST'],
  'Access-Control-Allow-Credentials': ['true'],
};

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const csrfToken = generateCsrfToken();

export const handler = async (event) => {
  try {

     if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 204,
    multiValueHeaders: CORS_HEADERS,
    body: ''
  };
}
    const { email, password } = JSON.parse(event.body);
    
    // Authenticate with Cognito
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const response = await client.send(command);
    const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
    
    // Set secure httpOnly cookies
    const cookies = [
      setCookie('accessToken', AccessToken, ExpiresIn), // Expires with token
      setCookie('idToken', IdToken, ExpiresIn),
      setCookie('refreshToken', RefreshToken, 30 * 24 * 60 * 60), // 30 days for refresh token
      setCookie('csrfToken', csrfToken, ExpiresIn, { httpOnly: false, sameSite: 'Strict' }),
    ];
    
    return {
      statusCode: 200,
      multiValueHeaders: {
        'Access-Control-Allow-Origin': [process.env.FRONTEND_URL], 
        'Access-Control-Allow-Credentials': ['true'],
        'Set-Cookie': cookies
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Login successful' 
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    
    let message = 'Login failed. invalid credentials or unverified user.';
    
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL,
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({ message }),
    };
  }
};