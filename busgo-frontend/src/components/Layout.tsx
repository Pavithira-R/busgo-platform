import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-800 text-white' : 'text-brand-50 hover:bg-brand-600'
  }`;

/** Teal header, page content and footer shared by every page. */
export function Layout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const logout = () => {
    signOut();
    close();
    void navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>
        {t('nav.search')}
      </NavLink>
      {user && (
        <NavLink to="/bookings" className={linkClass} onClick={close}>
          {t('nav.myBookings')}
        </NavLink>
      )}
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={linkClass} onClick={close}>
          {t('nav.admin')}
        </NavLink>
      )}
      {user ? (
        <>
          <NavLink
            to="/profile"
            className={linkClass}
            onClick={close}
            title={t('nav.profile')}
          >
            {user.fullName.split(' ')[0]}
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className={linkClass({ isActive: false })}
          >
            {t('nav.logout')}
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login" className={linkClass} onClick={close}>
            {t('nav.login')}
          </NavLink>
          <NavLink to="/register" className={linkClass} onClick={close}>
            {t('nav.register')}
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-brand-700 text-white shadow print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold"
            onClick={close}
          >
            <BusIcon />
            {t('common.appName')}
          </Link>
          <nav
            aria-label={t('nav.main')}
            className="ml-auto hidden items-center gap-1 md:flex"
          >
            {links}
          </nav>
          <div className="ml-auto md:ml-2">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-brand-600 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={t('nav.menu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d={
                  menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'
                }
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label={t('nav.main')}
            className="flex flex-col gap-1 border-t border-brand-600 px-4 py-3 md:hidden"
          >
            {links}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t print:hidden border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        <p>
          {t('common.appName')} · {t('footer.tagline')}
        </p>
      </footer>
    </div>
  );
}

function BusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="14" rx="3" />
      <path d="M4 11h16M8 21v-4M16 21v-4" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}
