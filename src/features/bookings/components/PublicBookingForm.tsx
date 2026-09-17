'use client'

import { useState, useEffect } from 'react'
import { submitBookingForm } from '@/features/bookings/actions/bookingActions'
import { Calendar, Clock, User, Phone, CheckCircle2, MessageSquare, ArrowLeft, ArrowRight, ClipboardList, MapPin, AlertCircle, X } from 'lucide-react'
import { siteConfig } from '@/config/site'

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

const MORNING_SLOTS = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"]
const AFTERNOON_SLOTS = ["14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]

function formatTimeDisplay(time24: string) {
  const [h, m] = time24.split(':')
  let hours = parseInt(h, 10)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  return `${hours}:${m} ${ampm}`
}

function parseTimeForData(time24: string): { time: string, ampm: 'AM' | 'PM' } {
  const [h, m] = time24.split(':')
  let hours = parseInt(h, 10)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  const time = `${hours.toString().padStart(2, '0')}:${m}`
  return { time, ampm }
}

export function PublicBookingForm() {
  const [step, setStep] = useState<number>(1)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSOS, setIsSOS] = useState(false)

  const [data, setData] = useState<BookingData>({
    name: '',
    phone: '',
    dob: '',
    location: '',
    city: '',
    reason: '',
    notes: '',
    preferred_date: '',
    preferred_time: '',
    preferred_time_ampm: 'AM'
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && !data.reason) {
      const urlParams = new URLSearchParams(window.location.search)
      const reasonParam = urlParams.get('reason')
      if (reasonParam) {
        setData(prev => ({ ...prev, reason: reasonParam }))
      }
    }
  }, [])

  useEffect(() => {
    async function fetchAvailability() {
      if (!data.preferred_date) {
        setBookedSlots([])
        return
      }
      setLoadingSlots(true)
      try {
        const res = await fetch(`/api/availability?date=${data.preferred_date}`)
        const json = await res.json()
        if (json.bookedSlots) {
          setBookedSlots(json.bookedSlots)
        }
      } catch (err) {
        console.error('Failed to load slots', err)
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchAvailability()
  }, [data.preferred_date])

  const updateData = (updates: Partial<BookingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => setStep(s => Math.min(s + 1, 4))
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  const handleSOS = () => {
    setIsSOS(true)
  }

  const handleCloseSOS = () => {
    setIsSOS(false)
    const d = new Date()
    while (d.getDay() === 5) {
      d.setDate(d.getDate() + 1)
    }
    const ds = d.toISOString().split('T')[0]
    updateData({ preferred_date: ds, preferred_time: '08:30', preferred_time_ampm: 'AM', reason: 'EMERGENCY' })
    setStep(4)
  }

  const handleSlotSelect = (time24: string) => {
    const { time, ampm } = parseTimeForData(time24)
    updateData({ preferred_time: time, preferred_time_ampm: ampm })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    
    try {
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
        let [h, m] = data.preferred_time.split(':')
        let hours = parseInt(h, 10)
        if (data.preferred_time_ampm === 'PM' && hours !== 12) hours += 12
        if (data.preferred_time_ampm === 'AM' && hours === 12) hours = 0
        const time24 = `${hours.toString().padStart(2, '0')}:${m}:00`
        formData.append('preferred_time', time24)
      }
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const source = urlParams.get('source')
        if (source) {
          formData.append('source', source.toUpperCase())
        }
      }

      const result = await submitBookingForm(formData)
      if (result.error) throw new Error(result.error)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request. Please try calling us.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
        <p className="text-gray-600 mb-8">
          Thank you, {data.name}. Our team will review your request and contact you at {data.phone} to confirm your appointment time.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex justify-center w-full rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    )
  }

  const isFriday = data.preferred_date ? new Date(data.preferred_date).getDay() === 5 : false
  const selectedTime24 = (() => {
    if (!data.preferred_time) return null
    let [h, m] = data.preferred_time.split(':')
    let hours = parseInt(h, 10)
    if (data.preferred_time_ampm === 'PM' && hours !== 12) hours += 12
    if (data.preferred_time_ampm === 'AM' && hours === 12) hours = 0
    return `${hours.toString().padStart(2, '0')}:${m}`
  })()

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gray-100 h-1.5 w-full">
        <div 
          className="bg-blue-600 h-1.5 transition-all duration-300 ease-in-out" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
              <p className="text-gray-500 mt-2">Let us know how to reach you.</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Locality/ Neighborhood/ Area</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => updateData({ location: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Yenna Gudde"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => updateData({ city: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Udupi"
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

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Why are you visiting?</h2>
              <p className="text-gray-500 mt-2">Help us prepare for your visit.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Visit</label>
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
              <textarea
                value={data.notes}
                onChange={(e) => updateData({ notes: e.target.value })}
                rows={3}
                className="block w-full rounded-lg border-gray-300 py-3 px-4 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Any details you'd like us to know?"
              />
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

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">When works best?</h2>
              <p className="text-gray-500 mt-2">Choose your preferred date & time.</p>
            </div>

            {/* SOS Button Section */}
            {!isSOS ? (
              <button 
                onClick={handleSOS}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 transition-colors mb-6"
              >
                <AlertCircle className="w-5 h-5" />
                SOS / This is an Emergency
              </button>
            ) : (
              <div className="w-full bg-red-600 text-white rounded-lg p-4 mb-6 relative shadow-lg">
                <button 
                  onClick={handleCloseSOS}
                  className="absolute top-2 right-2 text-red-200 hover:text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center space-y-2 mt-2">
                  <AlertCircle className="w-8 h-8 text-red-200" />
                  <h3 className="font-bold text-lg">Emergency Assistance</h3>
                  <p className="text-red-100 text-sm mb-2">Please call the clinic immediately to confirm an urgent slot:</p>
                  <a href={`tel:${siteConfig.phone.replace(/\D/g,'')}`} className="text-2xl font-black tracking-wider hover:underline">
                    {siteConfig.phone}
                  </a>
                  <p className="text-xs text-red-200 mt-2">Close this banner to proceed with the earliest available appointment request.</p>
                </div>
              </div>
            )}
            
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
                />
              </div>
            </div>

            {data.preferred_date && isFriday && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-center font-medium">
                Our clinic is closed on Fridays. Please select another date.
              </div>
            )}

            {data.preferred_date && !isFriday && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex justify-between items-center">
                  <span>Available Time Slots</span>
                  {loadingSlots && <span className="text-blue-600 text-xs">Loading...</span>}
                </label>
                
                <div className="space-y-6">
                  {/* Morning Slots */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Morning</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {MORNING_SLOTS.map(time24 => {
                        const isBooked = bookedSlots.includes(time24)
                        const isSelected = selectedTime24 === time24
                        return (
                          <button
                            key={time24}
                            disabled={isBooked}
                            onClick={() => handleSlotSelect(time24)}
                            className={`py-2 px-1 text-sm font-medium rounded-md border text-center transition-all ${
                              isBooked 
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                                : isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {formatTimeDisplay(time24)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Lunch Break Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs font-semibold text-gray-400 uppercase">Lunch Break (1:00 PM - 2:30 PM)</span>
                    </div>
                  </div>

                  {/* Afternoon Slots */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Afternoon</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {AFTERNOON_SLOTS.map(time24 => {
                        const isBooked = bookedSlots.includes(time24)
                        const isSelected = selectedTime24 === time24
                        return (
                          <button
                            key={time24}
                            disabled={isBooked}
                            onClick={() => handleSlotSelect(time24)}
                            className={`py-2 px-1 text-sm font-medium rounded-md border text-center transition-all ${
                              isBooked 
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                                : isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {formatTimeDisplay(time24)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={!data.preferred_date || isFriday || (!data.preferred_time && !isSOS)}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

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
                <span className="text-gray-500">Locality/Area</span>
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
