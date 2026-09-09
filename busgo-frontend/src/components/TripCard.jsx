import { useNavigate } from 'react-router-dom'
import { Clock, Users, Star, Wifi, Zap, Wind } from 'lucide-react'
export default function TripCard({ trip }) {
  const navigate = useNavigate()
  const badgeColor = trip.service_type === 'Luxury' ? 'bg-amber-100 text-amber-800' : trip.service_type === 'Semi-Luxury' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
  return (
    <div onClick={() => navigate(`/booking/${trip.trip_id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal hover:shadow-md transition cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-lg text-navy">{trip.from_stop.name}</p>
          <p className="text-sm text-gray-500">{trip.departure_time?.slice(0,5)}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-xs text-gray-400">{trip.duration}</p>
          <div className="flex items-center gap-1"><div className="h-px w-8 bg-gray-300" /><span className="text-teal">→</span><div className="h-px w-8 bg-gray-300" /></div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-navy">{trip.to_stop.name}</p>
          <p className="text-sm text-gray-500">{trip.arrival_time?.slice(0,5)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{trip.service_type}</span>
          <span className="text-xs text-gray-500">{trip.company?.name}</span>
          {trip.company?.rating > 0 && <span className="text-xs text-gray-500 flex items-center gap-0.5"><Star size={12} className="text-amber-400 fill-amber-400" />{trip.company.rating}</span>}
          <span className="text-xs text-gray-500 flex items-center gap-0.5"><Users size={12} />{trip.available_seats} seats</span>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-navy">LKR {trip.price?.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{trip.bus_number}</p>
        </div>
      </div>
    </div>
  )
}
