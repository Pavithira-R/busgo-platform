import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await login(email, password); toast.success('Welcome back!'); navigate('/') }
    catch (err) { toast.error(err.response?.data?.detail || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-navy mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">Login to your BusGo account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" placeholder="you@email.com" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" placeholder="Enter password" /></div>
          <button type="submit" disabled={loading} className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"><LogIn size={18} />{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Don't have an account? <Link to="/register" className="text-teal font-semibold">Register</Link></p>
      </div>
    </div>
  )
}
