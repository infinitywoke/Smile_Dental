'use client'

import { useState } from 'react'
import { createAppointment, updateAppointment } from '@/features/appointments/actions/appointmentActions'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Appointment } from '@/lib/types/database.types'

export function AppointmentForm({ 
  initialData, 
  appointmentId,
  patients
}: { 
  initialData?: Partial<Appointment> & { notes?: string, assigned_specialist?: string }, 
  appointmentId?: string,
  patients: {id: string, name: string}[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Default to today if no initial data
  const defaultDate = initialData?.scheduled_start 
    ? format(parseISO(initialData.scheduled_start), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')
    
  const defaultStartTime = initialData?.scheduled_start 
    ? format(parseISO(initialData.scheduled_start), 'HH:mm')
    : '09:00'
    
  const defaultEndTime = initialData?.scheduled_end 
    ? format(parseISO(initialData.scheduled_end), 'HH:mm')
    : '10:00'

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)

    let result
    if (appointmentId) {
      result = await updateAppointment(appointmentId, formData)
    } else {
      result = await createAppointment(formData)
    }

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      )}

      {/* Hidden Fields */}
      {(initialData as any)?.specialist_referral_id && (
        <input type="hidden" name="specialist_referral_id" value={(initialData as any).specialist_referral_id} />
      )}

      {/* Patient Selection - Only on creation */}
      {!appointmentId && (
        <div>
          <label htmlFor="patient_id" className="block text-sm font-medium leading-6 text-gray-900">
            Patient <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 flex items-center gap-3">
            <select
              id="patient_id"
              name="patient_id"
              required
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="">Select a patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">or</span>
            <Link href="/dashboard/patients/new" className="text-sm font-medium text-blue-600 hover:text-blue-500 whitespace-nowrap">
              + New Patient
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="date"
              name="date"
              id="date"
              defaultValue={defaultDate}
              required
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium leading-6 text-gray-900">
            Start Time <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="time"
              name="start_time"
              id="start_time"
              defaultValue={defaultStartTime}
              required
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium leading-6 text-gray-900">
            End Time <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="time"
              name="end_time"
              id="end_time"
              defaultValue={defaultEndTime}
              required
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium leading-6 text-gray-900">
          Reason for Visit <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="reason"
            id="reason"
            placeholder="e.g. Tooth pain, Checkup"
            defaultValue={initialData?.reason}
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="booking_source" className="block text-sm font-medium leading-6 text-gray-900">
            Booking Source
          </label>
          <div className="mt-2">
            <select
              id="booking_source"
              name="booking_source"
              defaultValue={initialData?.booking_source || 'PHONE'}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="PHONE">Phone</option>
              <option value="WALK_IN">Walk In</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WEBSITE">Website</option>
              <option value="GOOGLE">Google</option>
              <option value="REFERRAL">Referral</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="assigned_specialist" className="block text-sm font-medium leading-6 text-gray-900">
            Assigned Specialist (Optional)
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="assigned_specialist"
              id="assigned_specialist"
              defaultValue={initialData?.assigned_specialist}
              placeholder="e.g. Dr. Rao"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
          Notes
        </label>
        <div className="mt-2">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initialData?.notes}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Appointment'}
        </button>
      </div>
    </form>
  )
}
