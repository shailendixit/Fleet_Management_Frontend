import { config } from "../config/config";

const BASE_URL = config.backendBaseUrl;

/**
 * Read a cookie value by name in the browser.
 * Returns null when not in a browser environment or when cookie not found.
 * @param {string} name - Cookie name to read
 * @returns {string|null}
 */
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

/**
 * Resolve token from cookie (preferred) or localStorage as a fallback.
 * Uses cookie names: `token` or `auth_token` when available.
 * @returns {string|null}
 */
function getStoredToken() {
  try {
    if (typeof document !== "undefined") {
      const c = readCookie("token") || readCookie("auth_token");
      if (c) return c;
    }
    return localStorage.getItem("auth_token");
  } catch (e) {
    return null;
  }
}

/**
 * Low-level HTTP request helper built on fetch.
 * - Attaches stored Authorization Bearer token if present
 * - Applies a timeout using AbortController
 * - Parses JSON responses when present and returns a normalized object
 * @param {string} path - URL path (absolute or relative to BASE_URL)
 * @param {object} options - Request options: method, headers, body, credentials, timeout
 * @returns {Promise<{success:boolean,status?:number,data?:any,error?:string}>}
 */
async function request(path, { method = "GET", headers = {}, body, credentials = "include", timeout = 10000 } = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const token = getStoredToken();
  const defaultHeaders = {
    Accept: "application/json",
    ...(body && { "Content-Type": "application/json" }),
  };
  if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body && typeof body === "object" ? JSON.stringify(body) : body,
      credentials,
      signal: controller.signal,
    });

    clearTimeout(id);

    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // not json
      data = text;
    }

    if (!res.ok) {
      return { success: false, status: res.status, error: data?.message || data || res.statusText, data };
    }

    return { success: true, status: res.status, data };
  } catch (error) {
    const err = (error && error.name === 'AbortError') ? { message: 'Request timed out' } : error;
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Higher-level convenience API exposing common HTTP methods.
 * Each method returns the normalized { success, status, data, error } shape produced by `request`.
 */
export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  rawRequest: request,
};

export default api;
