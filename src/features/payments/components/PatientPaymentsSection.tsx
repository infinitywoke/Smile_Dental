'use client'

import { useState } from 'react'
import { Plus, CreditCard, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { Payment, PaymentMethod, PatientFinancialSummary } from '../services/paymentService'
import { recordPayment } from '../actions/paymentActions'
import { TreatmentPlanWithItems } from '@/features/treatments/services/treatmentService'

export function PatientPaymentsSection({ 
  patientId, 
  initialPayments, 
  financialSummary,
  activePlans
}: { 
  patientId: string, 
  initialPayments: Payment[],
  financialSummary: PatientFinancialSummary,
  activePlans: TreatmentPlanWithItems[]
}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [summary, setSummary] = useState<PatientFinancialSummary>(financialSummary)
  
  const [isRecording, setIsRecording] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRecord = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return

    setLoading(true)
    const res = await recordPayment(
      patientId,
      numAmount,
      paymentDate,
      paymentMode,
      selectedPlanId || null,
      selectedItemId || null,
      reference || null
    )

    if (!res.error) {
      // Find item details for optimistic UI
      let itemDetails = null
      if (selectedItemId) {
        for (const p of activePlans) {
          const item = p.treatment_items.find(i => i.id === selectedItemId)
          if (item) {
            itemDetails = { procedure: item.procedure, tooth_number: item.tooth_number }
            break
          }
        }
      }

      const newPayment = {
        id: res.data!.id,
        tenant_id: '',
        patient_id: patientId,
        amount: numAmount,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        treatment_plan_id: selectedPlanId || null,
        treatment_item_id: selectedItemId || null,
        specialist_referral_id: null,
        appointment_id: null,
        reference: reference || null,
        created_at: new Date().toISOString(),
        treatment_items: itemDetails
      }

      setPayments([newPayment, ...payments])
      setSummary({
        totalEstimated: summary.totalEstimated,
        totalPaid: summary.totalPaid + numAmount,
        totalRemaining: Math.max(0, summary.totalEstimated - (summary.totalPaid + numAmount))
      })
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setIsRecording(false)
        setAmount('')
        setReference('')
      }, 2000)
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  const selectedPlan = activePlans.find(p => p.id === selectedPlanId)
  
  return (
    <div className="space-y-4">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Estimated Treatment Value</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">₹{summary.totalEstimated.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Total Recorded Payments</p>
          <p className="text-xl font-semibold text-green-600 mt-1">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Estimated Remaining</p>
          <p className="text-xl font-semibold text-orange-600 mt-1">₹{summary.totalRemaining.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" /> Payment History
          </h2>
          {!isRecording && (
            <button
              onClick={() => setIsRecording(true)}
              className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500"
            >
              <Plus className="h-4 w-4" /> Record Payment
            </button>
          )}
        </div>

        {isRecording && (
          <div className="p-4 sm:px-6 bg-green-50/50 border-b border-gray-200">
            {success ? (
              <div className="flex items-center justify-center py-4 text-green-700 gap-2">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium text-lg">Payment recorded successfully!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                    placeholder="e.g. 5000"
                    min="1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as PaymentMethod)}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan (Optional)</label>
                  <select
                    value={selectedPlanId}
                    onChange={e => {
                      setSelectedPlanId(e.target.value)
                      setSelectedItemId('')
                    }}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">-- General Payment --</option>
                    {activePlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Item (Optional)</label>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    disabled={!selectedPlanId}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 disabled:bg-gray-100"
                  >
                    <option value="">-- Entire Plan --</option>
                    {selectedPlan?.treatment_items.map(i => (
                      <option key={i.id} value={i.id}>{i.procedure} {i.tooth_number ? `(${i.tooth_number})` : ''} - ₹{i.estimated_cost}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6 flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    disabled={loading}
                    className="inline-flex items-center rounded bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecord}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                    className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Record Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No payment history.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {payments.map(payment => (
              <li key={payment.id} className="p-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{format(new Date(payment.payment_date), 'd MMM yyyy')}</span>
                    <span className="text-xs text-gray-500 mt-1">Recorded: {format(new Date(payment.created_at), 'd MMM yyyy, h:mm a')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-green-700">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
                    <span className="block text-xs font-medium text-gray-500 mt-1">{payment.payment_mode}</span>
                  </div>
                </div>
                {(payment.treatment_items || payment.treatment_plan_id) && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded inline-block">
                    Allocated to: 
                    <span className="font-medium ml-1">
                      {payment.treatment_items ? `${payment.treatment_items.procedure} ${payment.treatment_items.tooth_number ? `(${payment.treatment_items.tooth_number})` : ''}` : 'Treatment Plan (General)'}
                    </span>
                  </div>
                )}
                {payment.reference && (
                  <div className="mt-1 text-xs text-gray-500">Ref: {payment.reference}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
