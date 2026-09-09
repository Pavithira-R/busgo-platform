import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import Booking from './pages/Booking'
import Payment from './pages/Payment'
import Ticket from './pages/Ticket'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking/:tripId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/payment/:ticketId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/ticket/:ticketId" element={<ProtectedRoute><Ticket /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}
