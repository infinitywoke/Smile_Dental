'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { confirmPatientMatch, keepUnmatched, rejectRecord } from '../actions/migrationActions'

export function LegacyRecordReviewList({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [filter, setFilter] = useState('ALL') // ALL, MANUAL_REVIEW, UNMATCHED, CONFIRMED, AUTO_MATCHED

  const filtered = records.filter(r => filter === 'ALL' || r.match_status === filter)

  const handleAction = async (id: string, action: 'CONFIRM' | 'UNMATCH' | 'REJECT', patientId?: string) => {
    let res: any
    if (action === 'CONFIRM' && patientId) res = await confirmPatientMatch(id, patientId)
    else if (action === 'UNMATCH') res = await keepUnmatched(id)
    else if (action === 'REJECT') res = await rejectRecord(id)

    if (res?.success) {
      setRecords(records.map(r => r.id === id ? { 
        ...r, 
        match_status: action === 'CONFIRM' ? 'CONFIRMED' : action === 'UNMATCH' ? 'UNMATCHED' : 'REJECTED',
        patient_id: action === 'CONFIRM' ? patientId : null
      } : r))
    } else {
      alert(res?.error || 'Failed to perform action')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-6 border-b pb-4">
        {['ALL', 'MANUAL_REVIEW', 'UNMATCHED', 'AUTO_MATCHED', 'CONFIRMED', 'REJECTED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-md font-medium ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">No records match this filter.</div>
      ) : (
        <div className="grid gap-6">
          {filtered.map(record => {
            const candidates = (typeof record.candidate_patients === 'string' ? JSON.parse(record.candidate_patients) : record.candidate_patients) || []
            return (
              <div key={record.id} className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row">
                {/* Source Data Panel */}
                <div className="bg-gray-50 p-5 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">Source Record</h3>
                    <span className="text-xs text-gray-500 font-mono">{record.source_record_id}</span>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500 text-xs font-medium uppercase tracking-wider">Date</dt>
                      <dd className="font-medium">{format(parseISO(record.transaction_date), 'MMM d, yyyy')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 text-xs font-medium uppercase tracking-wider">Raw Identifier / Ledger</dt>
                      <dd className="font-medium text-gray-900 bg-white px-2 py-1 border rounded mt-1">{record.raw_patient_identifier}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 text-xs font-medium uppercase tracking-wider">Narration / Particulars</dt>
                      <dd className="font-medium text-gray-700 bg-white px-2 py-1 border rounded mt-1 italic">{record.raw_narration}</dd>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <div>
                        <dt className="text-gray-500 text-xs font-medium uppercase tracking-wider">Amount</dt>
                        <dd className="font-medium">₹{record.raw_amount}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 text-xs font-medium uppercase tracking-wider">Mode</dt>
                        <dd className="font-medium">{record.raw_payment_mode}</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Parsing & Matching Panel */}
                <div className="p-5 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Matching Resolution</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Parsed Name: <span className="font-medium text-gray-900">{record.parsed_name || '-'}</span> | 
                          Phone: <span className="font-medium text-gray-900">{record.parsed_phone || '-'}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                        record.match_status === 'CONFIRMED' || record.match_status === 'AUTO_MATCHED' ? 'bg-green-100 text-green-800' :
                        record.match_status === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                        record.match_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.match_status}
                      </span>
                    </div>

                    {record.patient ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-green-800">Currently linked to:</p>
                        <p className="text-lg font-bold text-green-900 mt-1">{record.patient.name}</p>
                        {record.patient.phone && <p className="text-sm text-green-700">{record.patient.phone}</p>}
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {candidates.length > 0 ? (
                          <>
                            <p className="text-sm font-medium text-gray-700">Candidate Patients:</p>
                            {candidates.map((c: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">Patient ID: {c.patient_id.substring(0, 8)}...</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.confidence >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {c.confidence}% Match
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{c.reasons.join(', ')}</p>
                                </div>
                                <button
                                  onClick={() => handleAction(record.id, 'CONFIRM', c.patient_id)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                                >
                                  Confirm Match
                                </button>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No strong candidate patients found.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                    {record.match_status !== 'UNMATCHED' && (
                      <button onClick={() => handleAction(record.id, 'UNMATCH')} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium">
                        Keep Unmatched
                      </button>
                    )}
                    {record.match_status !== 'REJECTED' && (
                      <button onClick={() => handleAction(record.id, 'REJECT')} className="px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm font-medium ml-auto">
                        Reject Record
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
