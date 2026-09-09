import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { routeAPI, bookingAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import SeatMap from '../components/SeatMap'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
export default function Booking() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [seatData, setSeatData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ passenger_name: user?.full_name || '', passenger_email: user?.email || '', passenger_phone: user?.phone || '', passenger_id_number: user?.id_number || '' })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    routeAPI.getSeats(tripId).then(r => setSeatData(r.data)).catch(() => toast.error('Failed to load seats')).finally(() => setLoading(false))
  }, [tripId])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!selected) { toast.error('Please select a seat'); return }
    setSubmitting(true)
    try {
      const { data } = await bookingAPI.create({ trip_id: parseInt(tripId), seat_number: selected, ...form })
      toast.success('Booking confirmed!')
      navigate(`/ticket/${data.ticket_id}`)
    } catch (err) { toast.error(err.response?.data?.detail || 'Booking failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-teal" size={32} /></div>
  if (!seatData) return <div className="text-center py-20 text-gray-500">Trip not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-navy mb-1">Select seat and enter details</h2>
      <p className="text-sm text-gray-500 mb-6">Trip on {seatData.travel_date} · {seatData.available} seats available</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-navy mb-3">Choose your seat</h3>
          <SeatMap seats={seatData.seats} layout="2x2" selected={selected} onSelect={setSelected} />
          {selected && <p className="mt-3 text-sm text-teal font-semibold">Selected: {selected}</p>}
        </div>
        <form onSubmit={handleBook} className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-navy">Passenger details</h3>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full name</label><input type="text" value={form.passenger_name} onChange={e => update('passenger_name', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label><input type="email" value={form.passenger_email} onChange={e => update('passenger_email', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone</label><input type="tel" value={form.passenger_phone} onChange={e => update('passenger_phone', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">NIC/Passport</label><input type="text" value={form.passenger_id_number} onChange={e => update('passenger_id_number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          </div>
          <button type="submit" disabled={submitting || !selected} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            <CreditCard size={18} />{submitting ? 'Processing...' : 'Confirm and pay'}
          </button>
        </form>
      </div>
    </div>
  )
}
