import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { routeAPI } from '../api/client'
import { Search, MapPin, Calendar } from 'lucide-react'
export default function SearchForm() {
  const [stops, setStops] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const navigate = useNavigate()
  useEffect(() => { routeAPI.getStops().then(r => setStops(r.data)).catch(() => {}) }, [])
  const handleSearch = (e) => {
    e.preventDefault()
    if (from && to && date) navigate(`/search?from=${from}&to=${to}&date=${date}`)
  }
  const today = new Date().toISOString().split('T')[0]
  return (
    <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            <select value={from} onChange={e => setFrom(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal">
              <option value="">Select origin</option>
              {stops.map(s => <option key={s.code} value={s.code}>{s.city} ({s.code})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            <select value={to} onChange={e => setTo(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal">
              <option value="">Select destination</option>
              {stops.filter(s => s.code !== from).map(s => <option key={s.code} value={s.code}>{s.city} ({s.code})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
            <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" />
          </div>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full bg-teal text-white py-2.5 rounded-lg font-semibold hover:bg-teal-dark transition flex items-center justify-center gap-2"><Search size={18} />Search buses</button>
        </div>
      </div>
    </form>
  )
}
