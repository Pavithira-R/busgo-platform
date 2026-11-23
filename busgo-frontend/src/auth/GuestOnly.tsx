import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './useAuth';

/** Login and sign-up are for guests: signed-in users go to the home page. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}
