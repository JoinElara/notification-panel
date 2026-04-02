/**
 * `api` → backend-admin (global prefix `/api`): auth, notifications, templates, etc.
 * `mainApi` → Elara main API (global prefix `/api/v2`): automation rules only (not in admin service).
 *
 * Dev: Vite proxies `/api` → admin and `/api/v2` → main (see vite.config).
 */
const API_BASE = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  '/api'
).replace(/\/$/, '');

const MAIN_API_BASE = (
  import.meta.env.VITE_MAIN_API_URL ?? '/api/v2'
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

function createClient(baseUrl: string) {
  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url =
      path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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

  return {
    get: <T>(path: string) =>
      request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
  };
}

export const api = createClient(API_BASE);

/** Elara-Backend-v1 (automation, etc.) — same JWT as admin login if tokens are compatible */
export const mainApi = createClient(MAIN_API_BASE);
