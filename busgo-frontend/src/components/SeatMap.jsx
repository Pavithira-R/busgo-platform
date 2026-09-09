import { useState } from 'react'
export default function SeatMap({ seats, layout, selected, onSelect }) {
  const cols = layout === '2x1' ? 3 : 4
  const rows = []
  for (let i = 0; i < seats.length; i += cols) rows.push(seats.slice(i, i + cols))
  const half = layout === '2x1' ? 2 : 2
  return (
    <div>
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-gray-300 bg-white" />Available</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-teal" />Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-200 border border-gray-200" />Taken</span>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 inline-block">
        <div className="text-xs text-gray-400 text-center mb-3 font-semibold">FRONT (Driver)</div>
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1.5 mb-1.5">
            <span className="w-5 text-xs text-gray-400 font-medium text-center">{row[0]?.seat?.[0]}</span>
            {row.map((s, ci) => (
              <div key={s.seat}>
                {ci === half && <div className="w-4" />}
                <button
                  disabled={s.status === 'taken'}
                  onClick={() => s.status !== 'taken' && onSelect(s.seat)}
                  className={`w-9 h-9 rounded-md text-xs font-semibold transition-all
                    ${s.status === 'taken' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                      selected === s.seat ? 'bg-teal text-white shadow-md scale-105' :
                      'bg-white border border-gray-300 text-gray-600 hover:border-teal hover:bg-teal/5 cursor-pointer'}`}
                >{s.seat}</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
