import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingAPI } from '../api/client'
import { Loader2, Download, ArrowLeft, CheckCircle2, Bus } from 'lucide-react'
export default function Ticket() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    bookingAPI.getOne(ticketId).then(r => setTicket(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [ticketId])
  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-teal" size={32} /></div>
  if (!ticket) return <div className="text-center py-20 text-gray-500">Ticket not found</div>
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <CheckCircle2 size={48} className="mx-auto text-green-500 mb-2" />
        <h2 className="text-xl font-bold text-navy">Booking confirmed!</h2>
        <p className="text-sm text-gray-500">Show the QR code at the boarding gate</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-navy text-white p-5 text-center">
          <p className="text-xs opacity-70">BusGo E-Ticket</p>
          <p className="text-xl font-bold font-mono tracking-wider mt-1">{ticket.ticket_id}</p>
          <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-0.5 rounded-full mt-2 uppercase">{ticket.status}</span>
        </div>
        <div className="relative h-6"><div className="absolute left-0 top-0 w-6 h-6 bg-gray-50 rounded-full -translate-x-3" /><div className="absolute right-0 top-0 w-6 h-6 bg-gray-50 rounded-full translate-x-3" /><div className="absolute top-3 left-6 right-6 border-t-2 border-dashed border-gray-200" /></div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="text-center"><p className="text-2xl font-bold text-navy">{ticket.route_from_code}</p><p className="text-xs text-gray-500">{ticket.route_from}</p></div>
            <div className="flex-1 flex items-center gap-1 px-3"><div className="h-px flex-1 bg-gray-300" /><Bus size={16} className="text-teal" /><div className="h-px flex-1 bg-gray-300" /></div>
            <div className="text-center"><p className="text-2xl font-bold text-navy">{ticket.route_to_code}</p><p className="text-xs text-gray-500">{ticket.route_to}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[['Passenger', ticket.passenger_name], ['Date', ticket.travel_date], ['Departure', ticket.departure?.slice(0,5)], ['Arrival', ticket.arrival?.slice(0,5)], ['Seat', ticket.seat], ['Bus', `${ticket.bus_number} (${ticket.company_name})`]].map(([l, v]) => (
              <div key={l}><p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">{l}</p><p className="text-sm font-semibold text-navy">{v}</p></div>
            ))}
          </div>
          {ticket.qr_code && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <img src={ticket.qr_code} alt="QR Code" className="w-44 h-44 mx-auto rounded-lg" />
              <p className="text-xs text-gray-400 mt-2">Scan at boarding gate</p>
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-navy">Total: LKR {ticket.pricing?.total?.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <Link to="/my-bookings" className="flex-1 text-center py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><ArrowLeft size={16} />My bookings</Link>
        <Link to="/" className="flex-1 text-center py-2.5 bg-teal text-white rounded-lg text-sm font-semibold hover:bg-teal-dark">Book another trip</Link>
      </div>
    </div>
  )
}
