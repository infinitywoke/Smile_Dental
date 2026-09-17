'use client'

import { useState } from 'react'
import { createPatient, updatePatient } from '@/features/patients/actions/patientActions'

import { PatientProfile } from '@/lib/types/database.types'

export function PatientForm({ 
  initialData, 
  patientId 
}: { 
  initialData?: Partial<PatientProfile>, 
  patientId?: string 
}) {
  const [error, setError] = useState<string | null>(null)
  const [requiresForce, setRequiresForce] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)

    // Next.js form data serializer might ignore mutations to the original FormData object,
    // so we create a new one to be absolutely safe.
    const submitData = new FormData()
    Array.from(formData.entries()).forEach(([key, value]) => {
      submitData.append(key, value)
    })

    if (requiresForce) {
      submitData.append('force', 'true')
    }

    // The 'force' hidden input ensures formData already has it.
    console.log(`[PatientForm] handleSubmit called. requiresForce state: ${requiresForce}, formData.force: ${formData.get('force')}`)

    let result: { error?: string, requiresForce?: boolean } | undefined
    if (patientId) {
      result = await updatePatient(patientId, submitData)
    } else {
      result = await createPatient(submitData)
    }

    if (result?.error) {
      setError(result.error)
      if (result.requiresForce) {
        setRequiresForce(true)
      }
      setIsPending(false)
      return
    }

    // Success - redirect handled by server action
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
      
      {/* Hidden input to pass the force flag to the server action cleanly */}
      {requiresForce && <input type="hidden" name="force" value="true" />}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
          {requiresForce && (
            <p className="text-sm text-red-700 mt-2">
              If you are sure this is a different patient, you may submit again to proceed.
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={initialData?.name}
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
          Phone Number
        </label>
        <div className="mt-2">
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={initialData?.phone || ''}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="date_of_birth" className="block text-sm font-medium leading-6 text-gray-900">
          Date of Birth
        </label>
        <div className="mt-2">
          <input
            type="date"
            name="date_of_birth"
            id="date_of_birth"
            defaultValue={initialData?.date_of_birth || ''}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
          Address
        </label>
        <div className="mt-2">
          <textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={initialData?.address || ''}
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
          {isPending ? 'Saving...' : requiresForce ? 'Force Save' : 'Save Patient'}
        </button>
      </div>
    </form>
  )
}
