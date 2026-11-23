import { createContext, useContext } from 'react';
import type { AuthResponse, User } from '../lib/types';

export interface AuthState {
  user: User | null;
  /** True while checking a saved login on page load. */
  isLoading: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

/** The signed-in user and sign in/out actions. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
