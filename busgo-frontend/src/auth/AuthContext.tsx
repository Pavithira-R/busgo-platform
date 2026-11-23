import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { api } from '../lib/api';
import { session } from '../lib/session';
import type { AuthResponse, User } from '../lib/types';
import { AuthContext, type AuthState } from './useAuth';

/** Keeps track of who is signed in, and reloads them from the API on page load. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const token = useSyncExternalStore(session.subscribe, session.getToken);

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: ({ signal }) => api<User>('/auth/me', { signal }),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const signIn = useCallback(
    (auth: AuthResponse) => {
      queryClient.setQueryData(['me', auth.accessToken], auth.user);
      session.setToken(auth.accessToken);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    session.setToken(null);
    // Forget everything loaded for the previous user.
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      user: token ? (me.data ?? null) : null,
      isLoading: !!token && me.isPending,
      signIn,
      signOut,
    }),
    [token, me.data, me.isPending, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
