import SearchForm from '../components/SearchForm'
import { Bus, QrCode, Shield, Sparkles } from 'lucide-react'
export default function Home() {
  return (
    <div>
      <div className="text-center py-10 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold text-navy mb-3">Book bus tickets<br/><span className="text-teal">across Sri Lanka</span></h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Search routes, pick your seat, pay online. Get a scannable QR e-ticket instantly.</p>
      </div>
      <SearchForm />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
        {[
          { icon: Bus, title: 'Multiple operators', desc: 'CTB, private buses — all in one place' },
          { icon: QrCode, title: 'QR e-tickets', desc: 'Scannable ticket on your phone' },
          { icon: Shield, title: 'Secure payments', desc: 'Stripe-powered checkout' },
          { icon: Sparkles, title: 'AI assistant', desc: 'Chat for help with booking' },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
            <f.icon size={28} className="mx-auto mb-2 text-teal" />
            <p className="font-semibold text-sm text-navy mb-1">{f.title}</p>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
