'use client'

import { useState } from 'react'
import { ToothInput } from '../services/clinicalService'
import { Plus, X } from 'lucide-react'

type Props = {
  teeth: ToothInput[]
  onChange: (teeth: ToothInput[]) => void
}

export default function ToothSelector({ teeth, onChange }: Props) {
  const [toothNumber, setToothNumber] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = () => {
    if (!toothNumber.trim()) return
    onChange([...teeth, { tooth_number: toothNumber.trim(), notes: notes.trim() }])
    setToothNumber('')
    setNotes('')
  }

  const handleRemove = (index: number) => {
    const newTeeth = [...teeth]
    newTeeth.splice(index, 1)
    onChange(newTeeth)
  }

  return (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50">
      <h3 className="font-medium text-gray-900">Associated Teeth</h3>
      
      {teeth.length > 0 && (
        <div className="space-y-2">
          {teeth.map((t, idx) => (
            <div key={idx} className="flex items-start justify-between bg-white p-2 border rounded-md">
              <div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                  {t.tooth_number}
                </span>
                {t.notes && <span className="ml-2 text-sm text-gray-600">— {t.notes}</span>}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="w-20">
          <input
            type="text"
            placeholder="No."
            value={toothNumber}
            onChange={(e) => setToothNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Optional note (e.g. Deep caries)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-500">Fast entry: Type FDI tooth number and note, then hit Enter to add quickly.</p>
    </div>
  )
}
