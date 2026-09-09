import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { routeAPI } from '../api/client'
import TripCard from '../components/TripCard'
import SearchForm from '../components/SearchForm'
import { Loader2 } from 'lucide-react'
export default function SearchResults() {
  const [params] = useSearchParams()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const from = params.get('from'), to = params.get('to'), date = params.get('date')
  useEffect(() => {
    if (from && to && date) {
      setLoading(true)
      routeAPI.search({ from_code: from, to_code: to, travel_date: date })
        .then(r => setTrips(r.data.trips || []))
        .catch(() => setTrips([]))
        .finally(() => setLoading(false))
    }
  }, [from, to, date])
  const filtered = filter === 'all' ? trips : trips.filter(t => t.service_type === filter)
  return (
    <div>
      <SearchForm />
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-navy">{loading ? 'Searching...' : `${filtered.length} buses found`}</h2>
          <div className="flex gap-1">
            {['all', 'Standard', 'Semi-Luxury', 'Luxury'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-full font-medium transition ${filter === f ? 'bg-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-teal" size={32} /><p className="text-gray-500 mt-2 text-sm">Finding available buses...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border"><p className="text-gray-500">No buses found for this route and date.</p></div>
        ) : (
          <div className="space-y-3">{filtered.map(t => <TripCard key={t.trip_id} trip={t} />)}</div>
        )}
      </div>
    </div>
  )
}
