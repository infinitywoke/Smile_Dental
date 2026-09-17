'use client'

import { useState } from 'react'
import { Plus, UserCog, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createSpecialistReferral, cancelSpecialistReferral } from '../actions/specialistReferralActions'
import { recordPayment } from '@/features/payments/actions/paymentActions'
import { format, parseISO } from 'date-fns'
import { PaymentMethod } from '@/features/payments/services/paymentService'
import Link from 'next/link'

type Referral = {
  id: string
  specialist_name: string
  reason: string
  estimated_cost: number
  advance_percentage: number
  advance_required: number
  status: 'PENDING_ADVANCE' | 'ADVANCE_PAID' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  created_at: string
}

export function SpecialistReferralsSection({ patientId, initialReferrals }: { patientId: string, initialReferrals: Referral[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payingRef, setPayingRef] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('CASH')

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setError(null)
    const res = await createSpecialistReferral(formData)
    if (res.error) {
      setError(res.error)
      setSaving(false)
    } else {
      window.location.reload()
    }
  }

  async function handleCancel(referralId: string) {
    if (!confirm('Are you sure you want to cancel this referral?')) return
    await cancelSpecialistReferral(referralId, patientId)
    window.location.reload()
  }

  async function handlePayAdvance(ref: Referral) {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const res = await recordPayment(
      patientId,
      ref.advance_required,
      today,
      paymentMode,
      null,
      null,
      `Specialist Advance - ${ref.specialist_name}`,
      ref.id
    )
    if (res.error) {
      alert(res.error)
      setSaving(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
          <UserCog className="w-5 h-5 text-purple-500" /> Specialist Referrals
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-500 font-medium"
          >
            <Plus className="w-4 h-4" /> New Referral
          </button>
        )}
      </div>

      {isAdding && (
        <form action={handleSubmit} className="mb-6 bg-purple-50/50 p-4 rounded-lg border border-purple-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Create Referral</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <input type="hidden" name="patient_id" value={patientId} />
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Specialist Name</label>
              <input required type="text" name="specialist_name" className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Estimated Total Cost ($)</label>
              <input required type="number" step="0.01" name="estimated_cost" className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium leading-6 text-gray-900">Reason / Procedure</label>
              <textarea required name="reason" rows={2} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Advance % Required</label>
              <select name="advance_percentage" defaultValue="50" className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6">
                <option value="50">50% (Default)</option>
                <option value="100">100% (Full Advance)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-500 text-sm font-medium">
              {saving ? 'Saving...' : 'Create Referral & Request Advance'}
            </button>
          </div>
        </form>
      )}

      {initialReferrals.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
          No specialist referrals found.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md">
          {initialReferrals.map((ref) => (
            <li key={ref.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{ref.specialist_name}</div>
                <div>
                  {ref.status === 'PENDING_ADVANCE' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      <AlertCircle className="w-3 h-3" /> Pending Advance
                    </span>
                  )}
                  {ref.status === 'ADVANCE_PAID' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <CheckCircle2 className="w-3 h-3" /> Ready to Schedule
                    </span>
                  )}
                  {ref.status === 'SCHEDULED' && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      Scheduled
                    </span>
                  )}
                  {ref.status === 'COMPLETED' && (
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      Completed
                    </span>
                  )}
                  {ref.status === 'CANCELLED' && (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">{ref.reason}</div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  Total: ${ref.estimated_cost} • Advance Req: ${ref.advance_required} ({ref.advance_percentage}%)<br />
                  Created: {format(parseISO(ref.created_at), 'dd MMM yyyy')}
                </div>
                {ref.status === 'PENDING_ADVANCE' && (
                  <div className="flex flex-col items-end gap-2">
                    {payingRef === ref.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs rounded border-gray-300 py-1"
                          value={paymentMode}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMode(e.target.value as PaymentMethod)}
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI</option>
                          <option value="BANK_TRANSFER">Transfer</option>
                        </select>
                        <button disabled={saving} onClick={() => handlePayAdvance(ref)} className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500">
                          Confirm
                        </button>
                        <button onClick={() => setPayingRef(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-center">
                        <button onClick={() => handleCancel(ref.id)} className="text-xs text-red-600 hover:text-red-800">
                          Cancel
                        </button>
                        <button onClick={() => setPayingRef(ref.id)} className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-purple-500 font-medium shadow-sm">
                          Pay Advance (${ref.advance_required})
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {ref.status === 'ADVANCE_PAID' && (
                  <Link 
                    href={`/dashboard/appointments/new?patientId=${patientId}&specialist_referral_id=${ref.id}&specialist_name=${encodeURIComponent(ref.specialist_name)}`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Schedule Appointment
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
