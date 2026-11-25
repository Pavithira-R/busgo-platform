import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router';
import { GuestOnly } from './auth/GuestOnly';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { BookingPage } from './pages/BookingPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { RouteDetailsPage } from './pages/RouteDetailsPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TicketPage } from './pages/TicketPage';

// Admin pages (and their chart library) download only when an admin opens them.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'));

/** All pages. Each feature adds its routes here. */
export default function App() {
  const { t } = useTranslation();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="routes/:id" element={<RouteDetailsPage />} />
        <Route
          path="book/:id"
          element={
            <RequireAuth>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="tickets/:ticketId"
          element={
            <RequireAuth>
              <TicketPage />
            </RequireAuth>
          }
        />
        <Route
          path="login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="admin/*"
          element={
            <RequireAuth roles={['admin']}>
              <Suspense fallback={<Spinner label={t('common.loading')} />}>
                <AdminRoutes />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
