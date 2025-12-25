// src/api/fetchWithAuth.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://your-api-id.execute-api.region.amazonaws.com/dev';

/**
 * A single shared refresh promise (mutex)
 * Ensures only ONE refresh request is in-flight at a time
 */
let refreshPromise = null;

/**
 * Call refresh endpoint with locking
 */
async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Refresh failed');
        }
        return true;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Fetch wrapper with:
 * - HttpOnly cookies
 * - 401 handling
 * - silent refresh
 * - retry-once protection
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const csrfToken = getCookie('csrfToken'); // read token from cookie

  const opts = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }) // add CSRF header
    },
  };

  let res = await fetch(url, opts);

  // Fast path: request succeeded
  if (res.ok) {
    return res.status === 204 ? null : res.json();
  }

  // Only handle auth failure
  if (res.status !== 401) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  // Attempt refresh (with lock)
  try {
    await refreshToken();
  } catch {
    // Refresh token invalid → hard logout
    window.location.href = '/login';
    return null;
  }

  // Retry original request ONCE
  res = await fetch(url, opts);

  if (!res.ok) {
    // Still failing after refresh → logout
    window.location.href = '/login';
    return null;
  }

  return res.status === 204 ? null : res.json();
}
