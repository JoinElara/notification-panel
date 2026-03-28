/**
 * Base URL for backend-admin (Nest global prefix `api`, routes `/admin/...`).
 * - Dev: default `/api` → Vite proxies `/api` → backend (see vite.config server.proxy)
 * - Prod: set VITE_API_URL to e.g. https://your-host.com/api
 */
const API_BASE = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  '/api'
).replace(/\/$/, '');

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const raw = errBody?.message ?? errBody?.error?.message;
    const msg = Array.isArray(raw)
      ? raw.map((e: { property?: string; constraints?: Record<string, string> }) =>
          e?.property && e?.constraints
            ? `${e.property}: ${Object.values(e.constraints).join(', ')}`
            : JSON.stringify(e),
        ).join('; ')
      : raw;
    throw new Error(msg || res.statusText || `Request failed: ${res.status}`);
  }

  const json = await res.json().catch(() => null);
  return json as T;
}

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
