import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', id_number: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await register(form); toast.success('Account created!'); navigate('/') }
    catch (err) { toast.error(err.response?.data?.detail || 'Registration failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-navy mb-1">Create account</h2>
        <p className="text-gray-500 text-sm mb-6">Join BusGo to start booking</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full name</label><input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Password</label><input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" placeholder="+94..." /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">NIC/Passport</label><input type="text" value={form.id_number} onChange={e => update('id_number', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"><UserPlus size={18} />{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link to="/login" className="text-teal font-semibold">Login</Link></p>
      </div>
    </div>
  )
}
