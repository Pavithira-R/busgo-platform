import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bus, User, LogOut, History, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/') }
  return (
    <nav className="bg-navy text-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg"><Bus size={22} className="text-teal-light" />Bus<span className="text-teal-light">Go</span></Link>
        <div className="hidden md:flex items-center gap-4">
          {user ? (<>
            <Link to="/my-bookings" className="text-sm hover:text-teal-light flex items-center gap-1"><History size={16} />My bookings</Link>
            {user.role === 'admin' && <Link to="/admin" className="text-sm hover:text-teal-light flex items-center gap-1"><LayoutDashboard size={16} />Admin</Link>}
            <Link to="/profile" className="text-sm hover:text-teal-light flex items-center gap-1"><User size={16} />{user.full_name}</Link>
            <button onClick={handleLogout} className="text-sm hover:text-red-400 flex items-center gap-1"><LogOut size={16} /></button>
          </>) : (<>
            <Link to="/login" className="text-sm hover:text-teal-light">Login</Link>
            <Link to="/register" className="text-sm bg-teal px-4 py-1.5 rounded-lg hover:bg-teal-dark">Register</Link>
          </>)}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {open && (
        <div className="md:hidden bg-navy-light px-4 pb-4 space-y-2">
          {user ? (<>
            <Link to="/my-bookings" className="block py-2 text-sm" onClick={() => setOpen(false)}>My bookings</Link>
            {user.role === 'admin' && <Link to="/admin" className="block py-2 text-sm" onClick={() => setOpen(false)}>Admin</Link>}
            <Link to="/profile" className="block py-2 text-sm" onClick={() => setOpen(false)}>Profile</Link>
            <button onClick={() => { handleLogout(); setOpen(false) }} className="block py-2 text-sm text-red-400">Logout</button>
          </>) : (<>
            <Link to="/login" className="block py-2 text-sm" onClick={() => setOpen(false)}>Login</Link>
            <Link to="/register" className="block py-2 text-sm" onClick={() => setOpen(false)}>Register</Link>
          </>)}
        </div>
      )}
    </nav>
  )
}
