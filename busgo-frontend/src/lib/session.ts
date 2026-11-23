import { storage } from './storage';

const TOKEN_KEY = 'busgo.token';

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

/**
 * The signed-in user's access token, shared by the API client and the
 * auth context. Kept in localStorage so a refresh doesn't sign you out.
 */
export const session = {
  getToken(): string | null {
    return storage.get(TOKEN_KEY);
  },
  setToken(token: string | null): void {
    if (token) storage.set(TOKEN_KEY, token);
    else storage.remove(TOKEN_KEY);
    for (const listener of listeners) listener(token);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
