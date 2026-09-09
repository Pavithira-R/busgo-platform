import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { chatAPI } from '../api/client'
export default function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hi! I\'m BusGo Assistant. How can I help you with your bus booking?' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState(null)
  const bottom = useRef(null)
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput(''); setMsgs(p => [...p, { role: 'user', text: msg }]); setLoading(true)
    try {
      const { data } = await chatAPI.send(msg, convId)
      setConvId(data.conversation_id); setMsgs(p => [...p, { role: 'bot', text: data.reply }])
    } catch { setMsgs(p => [...p, { role: 'bot', text: 'Sorry, something went wrong. Try again.' }]) }
    finally { setLoading(false) }
  }
  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50" style={{ height: '28rem' }}>
          <div className="bg-navy text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <span className="font-semibold text-sm">BusGo Assistant</span>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-teal text-white' : 'bg-gray-100 text-gray-800'}`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-500">Typing...</div></div>}
            <div ref={bottom} />
          </div>
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about routes, booking..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal focus:border-teal outline-none" />
              <button onClick={send} disabled={loading} className="bg-teal text-white p-2 rounded-lg hover:bg-teal-dark disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 bg-teal text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-dark transition z-50">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  )
}
