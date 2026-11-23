import { Route, Routes } from 'react-router';
import { GuestOnly } from './auth/GuestOnly';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
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

/** All pages. Each feature adds its routes here. */
export default function App() {
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
