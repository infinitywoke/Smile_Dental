import { PatientForm } from '@/features/patients/components/PatientForm'
import { getPatientProfile } from '@/features/patients/services/patientService'
import { notFound } from 'next/navigation'

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const patient = await getPatientProfile(resolvedParams.id)

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">Edit Patient</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update demographic information for {patient.name}.
        </p>
      </div>
      <PatientForm initialData={patient} patientId={patient.id} />
    </div>
  )
}
