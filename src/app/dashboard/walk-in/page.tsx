'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { processWalkInAction, searchPatientsAction } from '@/features/dashboard/actions/walkInActions'
import { PatientProfile } from '@/lib/types/database.types'

export default function WalkInPage() {
  const [tab, setTab] = useState<'search' | 'new'>('search')
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Walk-In Patient</h1>
        <p className="mt-2 text-gray-500">Quickly add a patient to the waiting room.</p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-4 px-4 text-center font-semibold text-sm ${tab === 'search' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Existing Patient
            </div>
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-4 px-4 text-center font-semibold text-sm ${tab === 'new' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" /> New Patient
            </div>
          </button>
        </div>

        <div className="p-6">
          {tab === 'search' ? <SearchExistingTab /> : <NewPatientTab />}
        </div>
      </div>
    </div>
  )
}

function SearchExistingTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const data = await searchPatientsAction(query)
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleContinue = async (formData: FormData) => {
    // Actually, each form is separate so we can just have a handler.
    const result = await processWalkInAction(formData)
    if (result?.error) {
      alert(result.error)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone..."
            className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      <div className="space-y-3">
        {results.map(patient => (
          <form key={patient.id} action={handleContinue} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:border-blue-300 transition-colors">
            <input type="hidden" name="patient_id" value={patient.id} />
            <input type="hidden" name="reason" value="Walk-In Consultation" />
            <div>
              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
              <p className="text-sm text-gray-500">{patient.phone || 'No phone recorded'}</p>
              {patient.appointments && patient.appointments.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Visits: {patient.appointments.length}</p>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-200"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ))}
        {results.length === 0 && query && !isSearching && (
          <p className="text-center text-sm text-gray-500 py-4">No patients found. Try a different search or create a new patient.</p>
        )}
      </div>
    </div>
  )
}

function NewPatientTab() {
  const [isPending, setIsPending] = useState(false)

  const handleAction = async (formData: FormData) => {
    setIsPending(true)
    const result = await processWalkInAction(formData)
    if (result?.error) {
      alert(result.error)
      setIsPending(false)
    }
  }

  return (
    <form action={handleAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Patient Name *</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          autoFocus
          className="mt-1 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">Phone Number</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          className="mt-1 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium leading-6 text-gray-900">Reason for Visit</label>
        <input
          type="text"
          name="reason"
          id="reason"
          defaultValue="Walk-In Consultation"
          className="mt-1 block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isPending ? 'Processing...' : 'Create & Check In'}
        </button>
      </div>
    </form>
  )
}
