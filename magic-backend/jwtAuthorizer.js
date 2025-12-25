import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...valParts] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(valParts.join('='));
    return cookies;
  }, {});
};



export const handler = async (event) => {
  try {

    // Get token from cookies instead of Authorization header
    const cookies = parseCookies(event.headers?.Cookie || event.headers?.cookie);
    const token = cookies.accessToken;
    
    if (!token) {
      throw new Error('No access token found in cookies');
    }
    
    // Verify the token
    const payload = await verifier.verify(token);
    const userGroups = payload['cognito:groups'] || []; // get groups, empty array if none

    return {
      principalId: payload.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        userId: payload.sub,
        email: payload.email,
        groups: userGroups,
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    throw new Error('Unauthorized');
  }
};


