import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || ''
const api = axios.create({ baseURL: API_URL })
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('busgo_token')
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401) { localStorage.removeItem('busgo_token'); localStorage.removeItem('busgo_user'); window.location.href = '/login' }
  return Promise.reject(e)
})
export const authAPI = {
  register: (d) => api.post('/api/auth/register', d),
  login: (d) => api.post('/api/auth/login', d),
  getMe: () => api.get('/api/auth/me'),
  updateMe: (d) => api.put('/api/auth/me', d),
}
export const routeAPI = {
  getStops: () => api.get('/api/routes/stops'),
  search: (p) => api.get('/api/routes/search', { params: p }),
  getSeats: (tripId) => api.get(`/api/routes/trips/${tripId}/seats`),
}
export const bookingAPI = {
  create: (d) => api.post('/api/bookings', d),
  getAll: () => api.get('/api/bookings'),
  getOne: (id) => api.get(`/api/bookings/${id}`),
  cancel: (id) => api.put(`/api/bookings/${id}/cancel`),
}
export const chatAPI = {
  send: (msg, convId) => api.post('/api/chat', { message: msg, conversation_id: convId }),
}
export const reviewAPI = {
  create: (d) => api.post('/api/reviews', d),
  getByTrip: (id) => api.get(`/api/reviews/trip/${id}`),
  getByCompany: (id) => api.get(`/api/reviews/company/${id}`),
}
export const adminAPI = {
  dashboard: () => api.get('/api/admin/dashboard'),
  getBookings: (p) => api.get('/api/admin/bookings', { params: p }),
  getCompanies: () => api.get('/api/admin/companies'),
  createCompany: (d) => api.post('/api/admin/companies', d),
  getBuses: (p) => api.get('/api/admin/buses', { params: p }),
  createBus: (d) => api.post('/api/admin/buses', d),
  getSchedules: (p) => api.get('/api/admin/schedules', { params: p }),
  createSchedule: (d) => api.post('/api/admin/schedules', d),
  getPassengers: () => api.get('/api/admin/passengers'),
  createStop: (d) => api.post('/api/admin/stops', d),
  createRoute: (d) => api.post('/api/admin/routes', d),
}
export default api
