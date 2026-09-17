import { PatientForm } from '@/features/patients/components/PatientForm'

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">Add New Patient</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new patient record.
        </p>
      </div>
      <PatientForm />
    </div>
  )
}
