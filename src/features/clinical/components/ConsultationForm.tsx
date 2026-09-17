'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveConsultationAction, completeVisitAction } from '../actions/clinicalActions'
import { ClinicalRecord, ToothInput } from '../services/clinicalService'
import ToothSelector from './ToothSelector'
import { Appointment } from '@/features/appointments/types'

type Props = {
  appointment: Appointment
  existingRecord: any // from getClinicalRecordForAppointment
}

export default function ConsultationForm({ appointment, existingRecord }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [teeth, setTeeth] = useState<ToothInput[]>(
    existingRecord?.clinical_record_teeth?.map((t: any) => ({
      tooth_number: t.tooth_number,
      notes: t.notes || ''
    })) || []
  )

  const isCompleted = appointment.status === 'COMPLETED'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('teeth', JSON.stringify(teeth))

    startTransition(async () => {
      const result = await saveConsultationAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        // Just show success or refresh context
        router.refresh()
      }
    })
  }

  const handleComplete = async () => {
    if (!confirm('Are you sure you want to complete this appointment?')) return
    
    startTransition(async () => {
      const result = await completeVisitAction(appointment.id)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const quickProcedures = ['Consultation', 'Scaling', 'Filling', 'Extraction', 'RCT', 'Crown', 'Follow-up']

  const insertQuickProcedure = (proc: string) => {
    const el = document.getElementById('procedure_summary') as HTMLTextAreaElement
    if (!el) return
    const current = el.value
    el.value = current ? `${current}, ${proc}` : proc
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Today's Consultation</h2>
        {appointment.status === 'IN_PROGRESS' && (
          <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
            In Progress
          </span>
        )}
        {appointment.status === 'COMPLETED' && (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
            Completed
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
        <input type="hidden" name="appointment_id" value={appointment.id} />

        <div className="space-y-4 flex-1">
          <div>
            <label htmlFor="chief_complaint" className="block text-sm font-medium leading-6 text-gray-900">
              Chief Complaint
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="chief_complaint"
                id="chief_complaint"
                defaultValue={existingRecord?.chief_complaint || ''}
                readOnly={isCompleted}
                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium leading-6 text-gray-900">
              Diagnosis
            </label>
            <div className="mt-2">
              <textarea
                name="diagnosis"
                id="diagnosis"
                rows={2}
                defaultValue={existingRecord?.diagnosis || ''}
                readOnly={isCompleted}
                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
              />
            </div>
          </div>

          {!isCompleted && (
            <ToothSelector teeth={teeth} onChange={setTeeth} />
          )}
          {isCompleted && teeth.length > 0 && (
             <div className="space-y-2 border p-4 rounded-md bg-gray-50">
               <h3 className="text-sm font-medium text-gray-700">Teeth</h3>
               {teeth.map((t, idx) => (
                 <div key={idx} className="text-sm"><span className="font-bold">{t.tooth_number}</span> - {t.notes}</div>
               ))}
             </div>
          )}

          <div>
            <div className="flex justify-between items-end">
              <label htmlFor="procedure_summary" className="block text-sm font-medium leading-6 text-gray-900">
                Procedure Summary
              </label>
              {!isCompleted && (
                <div className="flex flex-wrap gap-1 mt-1 justify-end">
                  {quickProcedures.map(proc => (
                    <button
                      key={proc}
                      type="button"
                      onClick={() => insertQuickProcedure(proc)}
                      className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-200"
                    >
                      {proc}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              <textarea
                name="procedure_summary"
                id="procedure_summary"
                rows={3}
                defaultValue={existingRecord?.procedure_summary || ''}
                readOnly={isCompleted}
                className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="advice" className="block text-sm font-medium leading-6 text-gray-900">
                Advice
              </label>
              <div className="mt-2">
                <textarea
                  name="advice"
                  id="advice"
                  rows={2}
                  defaultValue={existingRecord?.advice || ''}
                  readOnly={isCompleted}
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="medications" className="block text-sm font-medium leading-6 text-gray-900">
                Medications
              </label>
              <div className="mt-2">
                <textarea
                  name="medications"
                  id="medications"
                  rows={2}
                  defaultValue={existingRecord?.medications || ''}
                  readOnly={isCompleted}
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-4 border-t">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {isCompleted ? 'Go Back' : 'Cancel'}
          </button>
          {!isCompleted && (
            <>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Consultation'}
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={isPending || !existingRecord}
                title={!existingRecord ? "Save consultation first" : "Complete appointment"}
                className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
              >
                Complete Visit
              </button>
            </>
          )}
          {isCompleted && (
            <div className="flex-1 text-center text-sm text-gray-500 py-2">
              This appointment is completed and the clinical record is locked.
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
