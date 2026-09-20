'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment } from '@/features/payments/actions/paymentActions'
import { completeVisitAction } from '@/features/clinical/actions/clinicalActions'
import { X } from 'lucide-react'
import { PaymentMethod } from '@/features/payments/services/paymentService'

type Props = {
  appointmentId: string
  patientId: string
  onClose: () => void
  onSuccess: () => void
}

export default function SmartCheckoutModal({ appointmentId, patientId, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI')
  const [reference, setReference] = useState('')

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      // 1. Record Payment if amount > 0
      const paymentAmount = parseFloat(amount)
      if (paymentAmount > 0) {
        const today = new Date().toISOString().split('T')[0]
        const pRes = await recordPayment(
          patientId,
          paymentAmount,
          today,
          paymentMode,
          null,
          null,
          reference || `Appt ${appointmentId}`
        )
        if (pRes.error) {
          setError(pRes.error)
          return
        }
      }

      // 2. Complete the appointment
      const cRes = await completeVisitAction(appointmentId)
      if (cRes?.error) {
        setError(cRes.error)
        return
      }

      onSuccess()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Complete & Checkout</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleCheckout} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount Collected Today (₹)</label>
            <input 
              type="number" 
              required
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">Leave as 0 if no payment is collected.</p>
          </div>

          {parseFloat(amount) > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                <select 
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as PaymentMethod)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reference / Notes (Optional)</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  placeholder="Transaction ID or notes"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || amount === ''}
              className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
            >
              {isPending ? 'Processing...' : 'Complete Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
