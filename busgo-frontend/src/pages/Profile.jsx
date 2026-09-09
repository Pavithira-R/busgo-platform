import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/client'
import { Save, User } from 'lucide-react'
import toast from 'react-hot-toast'
export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', id_number: user?.id_number || '', preferred_seat_position: user?.preferred_seat_position || '' })
  const [saving, setSaving] = useState(false)
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await authAPI.updateMe(form); updateUser(data); toast.success('Profile updated!')
    } catch (err) { toast.error('Failed to update') }
    finally { setSaving(false) }
  }
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-navy mb-4 flex items-center gap-2"><User size={22} />My profile</h2>
      <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 space-y-4">
        <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full name</label><input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
        <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label><input type="email" value={user?.email} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">NIC/Passport</label><input type="text" value={form.id_number} onChange={e => update('id_number', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal" /></div>
        </div>
        <div><label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Seat preference</label>
          <select value={form.preferred_seat_position} onChange={e => update('preferred_seat_position', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal">
            <option value="">No preference</option><option value="window">Window</option><option value="aisle">Aisle</option><option value="front">Front rows</option><option value="back">Back rows</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-teal text-white py-3 rounded-lg font-semibold hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"><Save size={18} />{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  )
}
