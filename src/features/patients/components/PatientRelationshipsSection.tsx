'use client'

import { useState } from 'react'
import { searchPatientsAction, addPatientRelationship, deletePatientRelationship } from '../actions/relationshipActions'
import { Users, Trash2, Plus, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

type Relationship = {
  id: string
  relationship_type: string
  related_patient: {
    id: string
    name: string
    phone: string | null
    date_of_birth: string | null
  }
}

export function PatientRelationshipsSection({ patientId, initialRelationships }: { patientId: string, initialRelationships: Relationship[] }) {
  const [relationships, setRelationships] = useState(initialRelationships)
  const [isAdding, setIsAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [relationType, setRelationType] = useState('PARENT')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const results = await searchPatientsAction(query, patientId)
    setSearchResults(results)
    setSearching(false)
  }

  const handleAdd = async () => {
    if (!selectedPatient) return
    setSaving(true)
    setError(null)
    const res = await addPatientRelationship(patientId, selectedPatient.id, relationType)
    if (res.error) {
      setError(res.error)
      setSaving(false)
    } else {
      // Reload page to get fresh data
      window.location.reload()
    }
  }

  const handleDelete = async (relId: string) => {
    if (!confirm('Are you sure you want to remove this relationship?')) return
    const res = await deletePatientRelationship(relId, patientId)
    if (res.error) {
      alert(res.error)
    } else {
      setRelationships(relationships.filter(r => r.id !== relId))
    }
  }

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" /> Family / Relationships
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            <Plus className="w-4 h-4" /> Add Relation
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-3 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Add New Relationship</h3>
            <button onClick={() => { setIsAdding(false); setSelectedPatient(null); setSearchResults([]); setQuery('') }} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>
          
          {!selectedPatient ? (
            <div>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search patient by name or phone..."
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
                <button type="submit" disabled={searching} className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-500 flex items-center gap-2 text-sm font-medium">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y bg-white max-h-60 overflow-y-auto">
                  {searchResults.map(p => (
                    <div key={p.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.phone}</div>
                      </div>
                      <button onClick={() => setSelectedPatient(p)} className="text-blue-600 text-sm font-medium hover:text-blue-800">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 border rounded-md">
                <div>
                  <div className="font-medium text-sm text-gray-900">{selectedPatient.name}</div>
                  <div className="text-xs text-gray-500">{selectedPatient.phone}</div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
              </div>

              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Relationship Type</label>
                <div className="flex gap-3">
                  <select 
                    value={relationType} 
                    onChange={e => setRelationType(e.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="PARENT">Parent</option>
                    <option value="CHILD">Child</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="GUARDIAN">Guardian</option>
                    <option value="DEPENDENT">Dependent</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <button 
                    onClick={handleAdd} 
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-500 text-sm font-medium whitespace-nowrap"
                  >
                    {saving ? 'Saving...' : 'Save Relation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {relationships.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
          No family relationships documented.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md">
          {relationships.map((rel) => (
            <li key={rel.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {rel.relationship_type}
                </span>
                <div>
                  <Link href={`/dashboard/patients/${rel.related_patient.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                    {rel.related_patient.name}
                  </Link>
                  <div className="text-xs text-gray-500 flex gap-2">
                    <span>{rel.related_patient.phone}</span>
                    {rel.related_patient.date_of_birth && (
                      <span>• {format(parseISO(rel.related_patient.date_of_birth), 'dd MMM yyyy')}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(rel.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove relationship"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
