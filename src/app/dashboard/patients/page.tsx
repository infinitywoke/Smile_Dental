import { getPatients } from '@/features/patients/services/patientService'
import Link from 'next/link'
import { Plus, Search, User } from 'lucide-react'

export default async function PatientsDirectoryPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  const patients = await getPatients(query).catch(() => [])

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Patients</h1>
          <p className="mt-2 text-sm text-gray-700">
            Search and manage your clinic&apos;s patient records.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-2">
          <div className="hidden sm:flex gap-2 mr-2">
            <a
              href="/api/export/patients?format=csv"
              title="Export as CSV"
              className="inline-flex items-center rounded-md bg-white px-2.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              CSV
            </a>
            <a
              href="/api/export/patients?format=json"
              title="Export as JSON"
              className="inline-flex items-center rounded-md bg-white px-2.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              JSON
            </a>
            <a
              href="/api/export/patients?format=xml"
              title="Export as XML"
              className="inline-flex items-center rounded-md bg-white px-2.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              XML
            </a>
          </div>
          <Link
            href="/dashboard/patients/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" /> Add patient
          </Link>
        </div>
      </div>

      <div className="flex items-center px-4 py-3 bg-white shadow sm:rounded-lg border border-gray-200">
        <form method="GET" action="/dashboard/patients" className="relative flex flex-1 items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search patients by name or phone..."
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
          <button type="submit" className="ml-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No patients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {query ? 'No patients match your search criteria.' : 'Get started by creating a new patient record.'}
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <li key={patient.id}>
                <Link href={`/dashboard/patients/${patient.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-medium text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-blue-600">{patient.name}</span>
                        <span className="text-sm text-gray-500">{patient.phone || 'No phone'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-sm text-gray-900">
                        {patient.appointments?.length ? `Visits: ${patient.appointments.length}` : 'No visits'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
