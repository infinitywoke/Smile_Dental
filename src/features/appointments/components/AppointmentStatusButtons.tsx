'use client'

import { useState } from 'react'
import { AppointmentStatus } from '@/lib/types/database.types'
import { updateAppointmentStatus } from '@/features/appointments/actions/appointmentActions'
import { CheckCircle2, Play, UserCheck, XCircle } from 'lucide-react'

export function AppointmentStatusButtons({ id, currentStatus }: { id: string, currentStatus: AppointmentStatus }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleStatusChange(status: AppointmentStatus) {
    if (status === 'CANCELLED' || status === 'NO_SHOW') {
      if (!confirm(`Are you sure you want to mark this appointment as ${status}?`)) return
    }
    
    setIsLoading(true)
    await updateAppointmentStatus(id, status)
    setIsLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(currentStatus === 'SCHEDULED' || currentStatus === 'CONFIRMED') && (
        <button
          onClick={() => handleStatusChange('CHECKED_IN')}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-sm font-semibold text-yellow-800 hover:bg-yellow-200"
        >
          <UserCheck className="h-4 w-4" /> Check In
        </button>
      )}

      {currentStatus === 'CHECKED_IN' && (
        <a
          href={`/dashboard/appointments/${id}/consultation`}
          className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-sm font-semibold text-purple-800 hover:bg-purple-200"
        >
          <Play className="h-4 w-4" /> Start Visit
        </a>
      )}

      {currentStatus === 'IN_PROGRESS' && (
        <a
          href={`/dashboard/appointments/${id}/consultation`}
          className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-sm font-semibold text-purple-800 hover:bg-purple-200"
        >
          <Play className="h-4 w-4" /> Continue Consultation
        </a>
      )}
      {currentStatus === 'COMPLETED' && (
        <a
          href={`/dashboard/appointments/${id}/consultation`}
          className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-sm font-semibold text-green-800 hover:bg-green-200"
        >
          <CheckCircle2 className="h-4 w-4" /> View Consultation
        </a>
      )}

      {(currentStatus === 'SCHEDULED' || currentStatus === 'CONFIRMED' || currentStatus === 'CHECKED_IN') && (
        <>
          <button
            onClick={() => handleStatusChange('CANCELLED')}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-200"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
          <button
            onClick={() => handleStatusChange('NO_SHOW')}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-800 hover:bg-red-200"
          >
            Mark No-Show
          </button>
        </>
      )}
    </div>
  )
}
