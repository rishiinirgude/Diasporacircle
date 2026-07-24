const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function isRealJwt(token: string | null): boolean {
  if (!token) return false;
  // Real JWTs have 3 base64 parts separated by dots
  // Old demo tokens look like: local_GADDR_timestamp
  const parts = token.split('.');
  return parts.length === 3;
}

function clearStaleAuth() {
  localStorage.removeItem('dc_token');
  localStorage.removeItem('dc_address');
  // Clear Zustand persisted wallet store too
  localStorage.removeItem('dc_wallet');
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('dc_token');

  // If token exists but isn't a real JWT, clear it immediately
  // so the user gets redirected to reconnect rather than seeing "invalid token"
  if (token && !isRealJwt(token)) {
    clearStaleAuth();
    throw new Error('Session expired. Please reconnect your wallet.');
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();

  // On 401, clear stale auth so the UI redirects to reconnect
  if (res.status === 401) {
    clearStaleAuth();
    throw new Error('Session expired. Please reconnect your wallet.');
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
