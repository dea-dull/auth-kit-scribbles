/**
 * Generate a secure HTTP cookie string
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Lifetime in seconds
 * @param {Object} options - Optional flags
 * @param {boolean} options.httpOnly - Prevent JS access (default true)
 * @param {boolean} options.secure - Only over HTTPS (default true in production)
 * @param {string} options.sameSite - 'Strict', 'Lax', or 'None' (default 'Strict')
 * @param {string} options.path - Path for cookie (default '/')
 * @param {string} options.domain - Optional domain
 */
const setCookie = (
  name,
  value,
  maxAge,
  {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Strict',
    path = '/',
    domain
  } = {}
) => {
  let cookie = `${name}=${value}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite};`;
  if (httpOnly) cookie += ' HttpOnly;';
  if (secure) cookie += ' Secure;';
  if (domain) cookie += ` Domain=${domain};`;
  return cookie;
};

export default setCookie;
