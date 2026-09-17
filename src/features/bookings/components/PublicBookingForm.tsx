'use client'

import { useState } from 'react'
import { submitBookingForm } from '@/features/bookings/actions/bookingActions'
import { Calendar, Clock, User, Phone, CheckCircle2, MessageSquare, ArrowLeft, ArrowRight, ClipboardList, MapPin } from 'lucide-react'

type BookingData = {
  name: string
  phone: string
  dob: string
  location: string
  city: string
  reason: string
  notes: string
  preferred_date: string
  preferred_time: string
  preferred_time_ampm: 'AM' | 'PM'
}

export function PublicBookingForm() {
  const [step, setStep] = useState<number>(1)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [data, setData] = useState<BookingData>({
    name: '',
    phone: '',
    dob: '',
    location: '',
    city: '',
    reason: '',
    notes: '',
    preferred_date: '',
    preferred_time: '10:00',
    preferred_time_ampm: 'AM'
  })

  // Prefill reason if it exists in URL
  if (typeof window !== 'undefined' && !data.reason) {
    const urlParams = new URLSearchParams(window.location.search)
    const reasonParam = urlParams.get('reason')
    if (reasonParam) {
      setData(prev => ({ ...prev, reason: reasonParam }))
    }
  }

  const updateData = (fields: Partial<BookingData>) => {
    setData(prev => ({ ...prev, ...fields }))
  }

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => Math.max(1, s - 1))

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('phone', data.phone)
    if (data.dob) formData.append('dob', data.dob)
    if (data.location) formData.append('location', data.location)
    if (data.city) formData.append('city', data.city)
    formData.append('reason', data.reason)
    if (data.notes) formData.append('notes', data.notes)
    formData.append('preferred_date', data.preferred_date)
    
    if (data.preferred_time) {
      // Convert to 24h for backend if needed, or just send the AM/PM string.
      // Easiest is just to append the AM/PM string so it's readable.
      formData.append('preferred_time', `${data.preferred_time} ${data.preferred_time_ampm}`)
    }
    
    // Add source param if it exists in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const source = urlParams.get('source')
      if (source) {
        formData.append('source', source.toUpperCase())
      }
    }

    const result = await submitBookingForm(formData)
    
    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 rounded-xl p-8 text-center shadow-sm border border-green-100 max-w-md mx-auto mt-12">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Request Received</h2>
        <p className="text-lg text-gray-700">
          Thank you for reaching out. The clinic will contact you shortly to confirm your appointment.
        </p>
      </div>
    )
  }

  // Pre-generate time slots in 12h format
  const generateTimeSlots = () => {
    const slots = []
    for (let h = 1; h <= 12; h++) {
      const hour = h.toString().padStart(2, '0')
      slots.push(`${hour}:00`)
      slots.push(`${hour}:30`)
    }
    return slots
  }
  const timeSlots = generateTimeSlots()

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-100 h-1.5 w-full">
        <div 
          className="bg-blue-600 h-1.5 transition-all duration-300 ease-in-out" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
              <p className="text-gray-500 mt-2">Let's start with your contact info.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="John Doe"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateData({ phone: e.target.value })}
                  className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={data.dob}
                    onChange={(e) => updateData({ dob: e.target.value })}
                    className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City/Town/Village</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => updateData({ city: e.target.value })}
                    className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="New York"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Locality/ Neighborhood/ Area</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => updateData({ location: e.target.value })}
                  className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Yenna Gudde"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!data.name.trim() || !data.phone.trim() || !data.city.trim() || !data.location.trim()}
              className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Reason */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Why are you visiting?</h2>
              <p className="text-gray-500 mt-2">Help us prepare for your visit.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Visit</label>
              {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reason') ? (
                <input 
                  type="text"
                  readOnly
                  value={data.reason}
                  className="block w-full bg-gray-50 rounded-lg border-gray-200 py-3 px-4 text-gray-500 shadow-sm sm:text-sm cursor-not-allowed"
                />
              ) : (
                <select
                  value={data.reason}
                  onChange={(e) => updateData({ reason: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                  autoFocus
                >
                  <option value="">Select a reason...</option>
                  <option value="General Checkup">General Checkup / Cleaning</option>
                  <option value="Tooth Pain">Tooth Pain</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={data.notes}
                  onChange={(e) => updateData({ notes: e.target.value })}
                  rows={3}
                  className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Any details you'd like us to know?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={!data.reason}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">When works best?</h2>
              <p className="text-gray-500 mt-2">Choose your preferred date & time.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={data.preferred_date}
                  onChange={(e) => updateData({ preferred_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Time (Optional)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={data.preferred_time}
                    onChange={(e) => updateData({ preferred_time: e.target.value })}
                    className="pl-11 block w-full rounded-lg border-gray-300 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={data.preferred_time_ampm}
                  onChange={(e) => updateData({ preferred_time_ampm: e.target.value as 'AM' | 'PM' })}
                  className="w-24 block rounded-lg border-gray-300 py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={!data.preferred_date}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <ClipboardList className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Review Request</h2>
              <p className="text-gray-500 mt-2">Almost done! Please review your details.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{data.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{data.phone}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Area</span>
                <span className="font-medium text-gray-900">{data.location}, {data.city}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Reason</span>
                <span className="font-medium text-gray-900">{data.reason}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{new Date(data.preferred_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">{data.preferred_time ? `${data.preferred_time} ${data.preferred_time_ampm}` : 'Any time'}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" /> Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-lg shadow-blue-500/30 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-4">
              This is a booking request. The clinic will contact you to confirm the exact time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

