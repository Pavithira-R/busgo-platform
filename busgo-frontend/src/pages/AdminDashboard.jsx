import { useState, useEffect } from 'react'
import { adminAPI } from '../api/client'
import { Loader2, BarChart3, Users, Bus, Route, DollarSign, CalendarCheck } from 'lucide-react'
export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.dashboard().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-teal" size={32} /></div>
  if (!stats) return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>
  const cards = [
    { icon: CalendarCheck, label: 'Total bookings', value: stats.total_bookings, sub: `${stats.today_bookings} today` },
    { icon: DollarSign, label: 'Total revenue', value: `LKR ${stats.total_revenue?.toLocaleString()}`, sub: `LKR ${stats.today_revenue?.toLocaleString()} today` },
    { icon: Users, label: 'Passengers', value: stats.total_passengers },
    { icon: Route, label: 'Active routes', value: stats.active_routes },
    { icon: Bus, label: 'Active buses', value: stats.active_buses },
    { icon: BarChart3, label: 'Companies', value: stats.active_companies },
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-4">Admin dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2"><c.icon size={18} className="text-teal" /><span className="text-xs text-gray-500 uppercase font-semibold">{c.label}</span></div>
            <p className="text-2xl font-bold text-navy">{c.value}</p>
            {c.sub && <p className="text-xs text-gray-400 mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-6">Full admin panel with route CRUD, booking management, and more coming in Phase 2. Use <a href="/docs" className="text-teal underline">/docs</a> (FastAPI Swagger) for now.</p>
    </div>
  )
}
