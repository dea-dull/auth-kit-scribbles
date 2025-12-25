import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import setCookie from './setCookie.js'; // use your polished helper
import { parseCookies } from './jwtAuthorizer.js'; 

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
  'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'],
  'Access-Control-Allow-Methods': ['OPTIONS', 'POST'],
  'Access-Control-Allow-Credentials': ['true'],
};
 


export const handler = async (event) => {
  try {

    if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 204,
    multiValueHeaders: CORS_HEADERS,
    body: ''
  };
}

    const cookies = parseCookies(event.headers?.Cookie || event.headers?.cookie);
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return {
        statusCode: 401,
        multiValueHeaders: {
          'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
          'Access-Control-Allow-Credentials': ['true'],
        },
        body: JSON.stringify({ message: 'Unable to refresh session. Login required' }),
      };
    }

    // Use Cognito to refresh tokens
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });

    const response = await client.send(command);
    const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;

    // Set new cookies
    const cookiesToSet = [
      setCookie('accessToken', AccessToken, ExpiresIn),
      setCookie('idToken', IdToken, ExpiresIn),
      // keep the refresh token cookie as is
    ];

    return {
      statusCode: 200,
      multiValueHeaders: {
        'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
        'Access-Control-Allow-Credentials': ['true'],
        'Set-Cookie': cookiesToSet,
      },
      body: JSON.stringify({ success: true, message: 'Tokens refreshed' }),
    };
  } catch (error) {
    console.error('Refresh error:', error);

    // Clear invalid tokens on error
    const clearCookies = [
      setCookie('accessToken', '', 0),
      setCookie('idToken', '', 0),
      setCookie('refreshToken', '', 0),
    ];

    return {
      statusCode: 401,
      multiValueHeaders: {
        'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
        'Access-Control-Allow-Credentials': ['true'],
        'Set-Cookie': clearCookies,
      },
      body: JSON.stringify({ message: 'Session expired. Please login again.' }),
    };
  }
};
