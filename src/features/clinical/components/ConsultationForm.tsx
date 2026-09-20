'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveConsultationAction } from '../actions/clinicalActions'
import { ClinicalRecord, ToothInput } from '../services/clinicalService'
import { TreatmentPlanWithItems } from '@/features/treatments/services/treatmentService'
import ToothSelector from './ToothSelector'
import { Appointment } from '@/features/appointments/types'
import SmartCheckoutModal from './SmartCheckoutModal'
import { Zap, Check } from 'lucide-react'

type Props = {
  appointment: Appointment
  existingRecord: any
  activePlans?: TreatmentPlanWithItems[]
}

const CLINICAL_TEMPLATES = [
  { label: 'Routine Checkup', cc: 'Routine dental checkup', dx: 'Healthy periodontium, no active caries', proc: 'Full mouth examination, scaling and polishing', rx: 'Maintain oral hygiene, brush twice daily' },
  { label: 'Caries / Filling', cc: 'Food lodgment and mild sensitivity', dx: 'Dental caries', proc: 'Caries excavation and composite restoration', rx: 'Avoid sticky foods, brush twice daily' },
  { label: 'Toothache (RCT)', cc: 'Severe spontaneous pain, aggravates at night', dx: 'Irreversible Pulpitis', proc: 'Access opening, extirpation of pulp, working length determination, biomechanical preparation, calcium hydroxide dressing, temporary seal', rx: 'Amoxicillin 500mg TDS x 5 days, Ibuprofen 400mg BD x 3 days' },
  { label: 'Extraction', cc: 'Grossly decayed tooth, pain', dx: 'Grossly decayed tooth / Unrestorable', proc: 'Extraction under LA, hemostasis achieved', rx: 'Bite on gauze for 1 hr. Cold soft diet. No spitting. Amoxicillin 500mg TDS, Ibuprofen 400mg BD.' },
]

export default function ConsultationForm({ appointment, existingRecord, activePlans }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  
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
        router.refresh()
      }
    })
  }

  const handleCheckoutClick = async () => {
    // Attempt to save the form first if it's dirty, or just save it anyway before checkout
    const form = document.getElementById('consultation-form') as HTMLFormElement
    const formData = new FormData(form)
    formData.append('teeth', JSON.stringify(teeth))
    
    startTransition(async () => {
      const saveResult = await saveConsultationAction(formData)
      if (saveResult.error) {
        setError(saveResult.error)
        return
      }
      setShowCheckout(true)
    })
  }

  const applyTemplate = (t: typeof CLINICAL_TEMPLATES[0]) => {
    const cc = document.getElementById('chief_complaint') as HTMLInputElement
    const dx = document.getElementById('diagnosis') as HTMLTextAreaElement
    const proc = document.getElementById('procedure_summary') as HTMLTextAreaElement
    const rx = document.getElementById('advice') as HTMLTextAreaElement
    
    if (cc) cc.value = t.cc
    if (dx) dx.value = t.dx
    if (proc) proc.value = t.proc
    if (rx) rx.value = t.rx
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-4 lg:p-6 h-full flex flex-col border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Today's Consultation</h2>
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

      {!isCompleted && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3" /> One-Click Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {CLINICAL_TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form id="consultation-form" onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5 overflow-y-auto pr-2">
        <input type="hidden" name="appointment_id" value={appointment.id} />

        <div className="space-y-4 flex-1">
          <div>
            <label htmlFor="chief_complaint" className="block text-sm font-medium leading-6 text-gray-900">
              Chief Complaint
            </label>
            <div className="mt-1">
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
            <div className="mt-1">
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
             <div className="space-y-2 border p-3 rounded-md bg-gray-50">
               <h3 className="text-sm font-medium text-gray-700">Teeth</h3>
               {teeth.map((t, idx) => (
                 <div key={idx} className="text-sm"><span className="font-bold">{t.tooth_number}</span> - {t.notes}</div>
               ))}
             </div>
          )}

          <div>
            <label htmlFor="procedure_summary" className="block text-sm font-medium leading-6 text-gray-900">
              Procedure Summary
            </label>
            <div className="mt-1">
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
                Advice & Rx
              </label>
              <div className="mt-1">
                <textarea
                  name="advice"
                  id="advice"
                  rows={3}
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
              <div className="mt-1">
                <textarea
                  name="medications"
                  id="medications"
                  rows={3}
                  defaultValue={existingRecord?.medications || ''}
                  readOnly={isCompleted}
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 border-t mt-4 pb-2">
          {!isCompleted && (
            <>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-1/3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleCheckoutClick}
                disabled={isPending}
                className="w-full sm:w-2/3 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> Complete & Checkout
              </button>
            </>
          )}
          {isCompleted && (
            <div className="w-full text-center text-sm text-gray-500 py-2 bg-gray-50 rounded-md border">
              This appointment is completed and the clinical record is locked.
            </div>
          )}
        </div>
      </form>

      {showCheckout && (
        <SmartCheckoutModal 
          appointmentId={appointment.id}
          patientId={appointment.patient_id}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
