const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_BASE_URL = BASE_URL;

function getToken() {
  return localStorage.getItem('deployflow_token');
}

/** For building EventSource (SSE) URLs, which can't carry an Authorization header. */
export function getAuthToken() {
  return getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return body.data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function setToken(token: string) {
  localStorage.setItem('deployflow_token', token);
}

export function clearToken() {
  localStorage.removeItem('deployflow_token');
}

export function hasToken() {
  return !!getToken();
}
