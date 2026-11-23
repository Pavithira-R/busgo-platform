import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../components/ui';
import type { Role } from '../lib/types';
import { useAuth } from './useAuth';

/**
 * Shows its children only to signed-in users (optionally with one of
 * `roles`). Guests are sent to the login page and brought back afterwards.
 */
export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) return <Spinner label={t('common.loading')} />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <p
        role="alert"
        className="py-16 text-center text-slate-600 dark:text-slate-400"
      >
        {t('common.noAccess')}
      </p>
    );
  }
  return children;
}
