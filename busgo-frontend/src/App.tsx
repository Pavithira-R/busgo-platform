import { useEffect, useState } from 'react'

type Health = { status: string; database: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json() as Promise<Health>)
      .then(setHealth)
      .catch(() => setError(true))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-slate-900">BusGo</h1>
        <p className="mt-1 text-slate-500">Bus e-ticket booking</p>

        <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm">
          <p className="font-medium text-slate-700">Backend status</p>
          {error && <p className="mt-1 text-red-600">Backend not reachable</p>}
          {!error && !health && <p className="mt-1 text-slate-400">Checking…</p>}
          {health && (
            <p className="mt-1 text-slate-600">
              API: <span className="font-mono">{health.status}</span> · Database:{' '}
              <span className="font-mono">{health.database}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
