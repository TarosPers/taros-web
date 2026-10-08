'use client'
import { useState } from 'react'

export function CollapsibleSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <span>{label}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="space-y-2 mt-2">{children}</div>}
    </div>
  )
}