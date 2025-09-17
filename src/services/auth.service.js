import apiClient from './apiClient';

/**
 * Signup a new user.
 * @param {{username:string,email:string,password:string}} payload
 * @returns {Promise<{success:boolean,status?:number,data?:any,error?:string}>}
 */
export async function signup({ username, email, password ,role}) {
  return await apiClient.post('/auth/signup', { username, email, password,role }, { credentials: 'include' });
}

/**
 * Login user with username/password. If server returns a token in the response body
 * it will be saved to localStorage under `auth_token` for subsequent requests.
 * @param {{username:string,password:string}} payload
 * @returns {Promise<{success:boolean,status?:number,data?:any,error?:string}>}
 */
export async function login({ username, password }) {
  // Expect server to set cookie or return token in JSON
  const res = await apiClient.post('/auth/login', { username, password }, { credentials: 'include' });
  // If token in body, persist to localStorage (client option)
  try {
    if (res.success && res.data && res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
    }
  } catch (e) { /* ignore storage errors */ }
  return res;
}

/**
 * Get token from cookie (preferred) or localStorage.
 * @returns {string|null}
 */
export function getToken() {
  try {
    return (typeof document !== 'undefined' && (document.cookie.match(/(^|;)\s*(token|auth_token)\s*=\s*([^;]+)/)?.[3])) || localStorage.getItem('auth_token');
  } catch (e) { return null; }
}

/**
 * Logout user: request server to clear session and remove client token.
 * @returns {Promise<void>}
 */
export async function logout() {
  // tell server to invalidate cookie/session
  try { await apiClient.post('/auth/logout', {}, { credentials: 'include' }); } catch (e) {}
  try { 
    localStorage.removeItem('auth_token'); 
    // also remove legacy key if present
    localStorage.removeItem('token'); 
  } catch (e) {}
}

/**
 * Fetch or verify the current user's profile/session using server endpoint.
 * @returns {Promise<{success:boolean,status?:number,data?:any,error?:string}>}
 */
export async function fetchProfile() {
  // Use a verification endpoint; server may use cookie or bearer token
  return await apiClient.post('/auth/verifytoken', {}, { credentials: 'include' });
}

export default { signup, login, getToken, logout, fetchProfile };
