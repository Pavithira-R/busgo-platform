import { useNavigate } from 'react-router-dom'
import { Ticket, MapPin } from 'lucide-react'
export default function BookingCard({ booking }) {
  const navigate = useNavigate()
  const statusColor = { confirmed: 'bg-green-100 text-green-700', used: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-500' }
  return (
    <div onClick={() => navigate(`/ticket/${booking.ticket_id}`)} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-teal cursor-pointer transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-mono text-teal font-semibold">{booking.ticket_id}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[booking.booking_status] || 'bg-gray-100'}`}>{booking.booking_status}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <MapPin size={14} className="text-gray-400" />
        <span className="font-medium">{booking.route_from}</span>
        <span className="text-gray-400">→</span>
        <span className="font-medium">{booking.route_to}</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{booking.travel_date} · {booking.departure?.slice(0,5)}</span>
        <span>Seat {booking.seat_number}</span>
        <span className="font-semibold text-navy">LKR {booking.total_amount?.toLocaleString()}</span>
      </div>
    </div>
  )
}
