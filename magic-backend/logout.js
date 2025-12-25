import setCookie from './setCookie.js';

const CORS_HEADERS = {
  // "Access-Control-Allow-Origin": "*", // temporarily allow all origins
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL, // enable later
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export const handler = async () => {

  
  // Clear all auth cookies using setCookie helper
  const clearCookies = [
    setCookie('accessToken', '', 0),
    setCookie('idToken', '', 0),
    setCookie('refreshToken', '', 0),
  ];

  return {
    statusCode: 200,
    multiValueHeaders: {
      'Access-Control-Allow-Origin': [process.env.FRONTEND_URL],
      'Access-Control-Allow-Credentials': ['true'],
      'Set-Cookie': clearCookies,
    },
    body: JSON.stringify({ success: true, message: 'Logged out successfully' }),
  };
};
