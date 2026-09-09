import { useState, useEffect } from 'react'
import { bookingAPI } from '../api/client'
import BookingCard from '../components/BookingCard'
import { Loader2, Ticket } from 'lucide-react'
export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { bookingAPI.getAll().then(r => setBookings(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-teal" size={32} /></div>
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2"><Ticket size={22} />My bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border"><p className="text-gray-500">No bookings yet.</p></div>
      ) : (
        <div className="space-y-3">{bookings.map(b => <BookingCard key={b.ticket_id} booking={b} />)}</div>
      )}
    </div>
  )
}
