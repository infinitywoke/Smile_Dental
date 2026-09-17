'use client'

'use client'

import { useState } from 'react'
import { BookingRequest, BookingRequestStatus } from '../services/bookingService'
import { changeRequestStatus, convertToPatient, checkPatientMatch } from '../actions/bookingActions'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Phone, Mail, UserPlus, Clock, XCircle, AlertCircle, Calendar, MapPin } from 'lucide-react'

function computeAge(dob: string | null) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return new Date(diff).getUTCFullYear() - 1970
}

export function BookingRequestsDashboard({ initialRequests }: { initialRequests: BookingRequest[] }) {
  const router = useRouter()
  const [requests, setRequests] = useState<BookingRequest[]>(initialRequests)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const handleStatusChange = async (id: string, status: BookingRequestStatus) => {
    setProcessing(id)
    const res = await changeRequestStatus(id, status)
    if (res.success) {
      setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r))
    } else {
      alert(res.error)
    }
    setProcessing(null)
  }

  const [convertModal, setConvertModal] = useState<{ req: BookingRequest, matches: any[] } | null>(null)

  const handleConvert = async (req: BookingRequest) => {
    setProcessing(req.id)
    
    // Check for matches first using a new server action that wraps findPotentialPatientMatch
    const res = await checkPatientMatch(req.phone)
    if (res.matches && res.matches.length > 0) {
      setConvertModal({ req, matches: res.matches })
      setProcessing(null)
      return
    }

    await executeConvert(req.id)
  }

  const executeConvert = async (reqId: string, patientId?: string) => {
    setProcessing(reqId)
    const res = await convertToPatient(reqId, patientId)
    if (res.success) {
      setRequests(reqs => reqs.map(r => r.id === reqId ? { ...r, status: 'CONVERTED' } : r))
      setConvertModal(null)
      router.push(`/dashboard/patients/${res.patientId}`)
    } else {
      alert(res.error)
    }
    setProcessing(null)
  }

  const newRequests = requests.filter(r => r.status === 'NEW')
  const otherRequests = requests.filter(r => r.status !== 'NEW')

  const renderCard = (req: BookingRequest) => {
    const age = computeAge((req as any).dob)
    
    return (
      <div key={req.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">{req.name}</h3>
            {age !== null && (
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {age} yrs
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${req.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 
                req.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                req.status === 'CONVERTED' ? 'bg-green-100 text-green-800' : 
                'bg-gray-100 text-gray-800'}`}>
              {req.status}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Source: {req.source}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1"><Phone className="w-4 h-4" /> {req.phone}</div>
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(req.preferred_date), 'd MMM yyyy')} {req.preferred_time && `at ${req.preferred_time}`}</div>
            {((req as any).location || (req as any).city) && (
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {[(req as any).location, (req as any).city].filter(Boolean).join(', ')}</div>
            )}
          </div>
        
        <div className="text-sm">
          <span className="font-medium text-gray-700">Reason:</span> {req.reason}
        </div>
        
        {req.notes && (
          <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 italic border border-gray-100">
            "{req.notes}"
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          Requested: {format(new Date(req.created_at), 'd MMM yyyy, h:mm a')}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {req.status === 'NEW' && (
          <button 
            onClick={() => handleStatusChange(req.id, 'CONTACTED')}
            disabled={processing === req.id}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded font-medium text-sm transition-colors"
          >
            <Phone className="w-4 h-4" /> Mark Contacted
          </button>
        )}
        
        {(req.status === 'NEW' || req.status === 'CONTACTED') && (
          <button 
            onClick={() => handleConvert(req)}
            disabled={processing === req.id}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded font-medium text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Convert to Patient
          </button>
        )}

        {(req.status === 'NEW' || req.status === 'CONTACTED') && (
          <button 
            onClick={() => handleStatusChange(req.id, 'DECLINED')}
            disabled={processing === req.id}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-medium text-sm transition-colors"
          >
            <XCircle className="w-4 h-4" /> Decline
          </button>
        )}

        {req.status === 'CONVERTED' && req.patient_id && (
          <button 
            onClick={() => router.push(`/dashboard/appointments/new?patientId=${req.patient_id}&source=${req.source}&requestId=${req.id}`)}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" /> Create Appointment
          </button>
        )}
      </div>
    </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* NEW REQUESTS */}
      <section>
        <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="text-blue-500 w-5 h-5" /> New Requests ({newRequests.length})
        </h2>
        
        {newRequests.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            No new booking requests at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {newRequests.map(renderCard)}
          </div>
        )}
      </section>

      {/* OTHER REQUESTS */}
      <section>
        <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-gray-500 w-5 h-5" /> Processed Requests
        </h2>
        
        {otherRequests.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            No processed requests yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 opacity-80">
            {otherRequests.map(renderCard)}
          </div>
        )}
      </section>

      {/* CONVERT MODAL */}
      {convertModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Convert to Patient</h3>
            <p className="text-sm text-gray-600 mb-4">
              We found existing patients with the phone number <strong>{convertModal.req.phone}</strong>.
            </p>
            
            <div className="space-y-3 mb-6">
              {convertModal.matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => executeConvert(convertModal.req.id, m.id)}
                  disabled={processing === convertModal.req.id}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-gray-900">{m.name}</div>
                    <div className="text-sm text-gray-500">Use this existing patient record</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() => executeConvert(convertModal.req.id)}
                disabled={processing === convertModal.req.id}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center mb-3"
              >
                <div>
                  <div className="font-medium text-gray-900">Create New Patient</div>
                  <div className="text-sm text-gray-500">Create a brand new record for {convertModal.req.name}</div>
                </div>
              </button>
              
              <button
                onClick={() => setConvertModal(null)}
                className="w-full py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
