import { session } from './session';

/** An error response from the BusGo API, with a readable message. */
export class ApiError extends Error {
  readonly status: number;
  /** Individual validation messages, e.g. "email: Invalid email address". */
  readonly details: string[];

  constructor(status: number, details: string[]) {
    super(details.join('\n') || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Calls the BusGo API (proxied to the backend at /api) and returns the JSON. */
export async function api<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const token = session.getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, ['Cannot reach BusGo. Check your connection.']);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // An expired or revoked login: sign out so the user can sign in again.
    if (response.status === 401 && token) session.setToken(null);
    const message = (data as { message?: unknown } | null)?.message;
    const details = Array.isArray(message)
      ? message.map(String)
      : typeof message === 'string'
        ? [message]
        : [];
    throw new ApiError(response.status, details);
  }
  return data as T;
}
