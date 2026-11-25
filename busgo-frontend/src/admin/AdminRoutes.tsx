import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, Route, Routes } from 'react-router';
import { BookingsPage } from './BookingsPage';
import { DashboardPage } from './DashboardPage';
import { OperatorsPage } from './OperatorsPage';
import { PassengersPage } from './PassengersPage';
import { RouteManagePage } from './RouteManagePage';
import { NewRoutePage, RoutesPage } from './RoutesPage';

/** /admin/routes, /admin/routes/new and /admin/routes/:id */
function RoutesSection() {
  return (
    <Routes>
      <Route index element={<RoutesPage />} />
      <Route path="new" element={<NewRoutePage />} />
      <Route path=":id" element={<RouteManagePage />} />
    </Routes>
  );
}

/** Admin sections, in menu order. Each admin feature adds its page here. */
const SECTIONS = [
  { path: '', label: 'admin.nav.dashboard', element: <DashboardPage /> },
  {
    path: 'operators',
    label: 'admin.nav.operators',
    element: <OperatorsPage />,
  },
  { path: 'routes', label: 'admin.nav.routes', element: <RoutesSection /> },
  { path: 'bookings', label: 'admin.nav.bookings', element: <BookingsPage /> },
  {
    path: 'passengers',
    label: 'admin.nav.passengers',
    element: <PassengersPage />,
  },
] as const;

/**
 * Everything under /admin. Loaded on demand (see App.tsx), so passengers
 * never download the admin pages or the chart library.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {SECTIONS.map(({ path, element }) =>
          path === '' ? (
            <Route key="index" index element={element} />
          ) : (
            <Route key={path} path={`${path}/*`} element={element} />
          ),
        )}
      </Route>
    </Routes>
  );
}

function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('admin.title')}
        </h1>
        <nav
          aria-label={t('admin.title')}
          className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {SECTIONS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path === '' ? '/admin' : `/admin/${path}`}
              end={path === ''}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                }`
              }
            >
              {t(label)}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
