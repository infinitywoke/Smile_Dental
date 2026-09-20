import { getConsultationContext, getClinicalRecordForAppointment } from '@/features/clinical/services/clinicalService'
import { getPatientTreatmentPlans } from '@/features/treatments/services/treatmentService'
import PatientContextPanel from '@/features/clinical/components/PatientContextPanel'
import ConsultationForm from '@/features/clinical/components/ConsultationForm'
import MiniTreatmentPlanner from '@/features/treatments/components/MiniTreatmentPlanner'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Consultation | Smile Dental',
}

export default async function ConsultationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const appointmentId = params.id

  let context
  try {
    context = await getConsultationContext(appointmentId)
  } catch (error) {
    notFound()
  }

  // Guard against invalid statuses
  const status = context.appointment.status
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    return (
      <div className="p-8 text-center text-gray-500">
        This appointment is {status}. A consultation cannot be started.
      </div>
    )
  }

  const existingRecord = await getClinicalRecordForAppointment(appointmentId)
  const patientId = context.appointment.patient_id
  const initialPlans = await getPatientTreatmentPlans(patientId)

  return (
    <div className="mx-auto max-w-[1600px] h-[calc(100vh-8rem)]">
      <div className="h-full flex flex-col lg:flex-row gap-6">
        {/* Left Column: Context */}
        <div className="w-full lg:w-3/12 h-full overflow-y-auto">
          <PatientContextPanel context={context} />
        </div>
        
        {/* Middle Column: Clinical Notes & Smart Checkout */}
        <div className="w-full lg:w-5/12 h-full overflow-y-auto border-x border-gray-200 px-2 lg:px-6">
          <ConsultationForm 
            appointment={context.appointment} 
            existingRecord={existingRecord} 
            activePlans={initialPlans.filter(p => p.status === 'ACTIVE')}
          />
        </div>
        
        {/* Right Column: Treatment Planning & Billing */}
        <div className="w-full lg:w-4/12 h-full overflow-y-auto">
          <MiniTreatmentPlanner patientId={patientId} initialPlans={initialPlans} />
        </div>
      </div>
    </div>
  )
}
