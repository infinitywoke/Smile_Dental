'use client'

import Link from 'next/link'
import { AlertCircle, CreditCard, Stethoscope, Calendar, ArrowRight, Activity, Clock, FileText } from 'lucide-react'
import { ClinicAction } from '@/lib/types/actions'

type NextActionCardProps = {
  action: ClinicAction | null
}

export function NextActionCard({ action }: NextActionCardProps) {
  if (!action) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gray-200 p-2 rounded-full">
            <CheckCircle className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">NEXT ACTION: None Required</h3>
            <p className="text-sm text-gray-600">Patient is fully scheduled and up to date.</p>
          </div>
        </div>
      </div>
    )
  }

  let bgClass = "bg-gray-50 border-gray-200"
  let iconBgClass = "bg-gray-100"
  let iconClass = "text-gray-600"
  let textTitleClass = "text-gray-900"
  let textDescClass = "text-gray-700"
  let btnClass = "bg-gray-600 hover:bg-gray-500"
  let Icon = Calendar
  let btnLabel = "RESOLVE"

  switch (action.type) {
    case 'START_ENCOUNTER':
    case 'CONTINUE_ENCOUNTER':
      bgClass = "bg-emerald-50 border-emerald-200"
      iconBgClass = "bg-emerald-100"
      iconClass = "text-emerald-600"
      textTitleClass = "text-emerald-900"
      textDescClass = "text-emerald-700"
      btnClass = "bg-emerald-600 hover:bg-emerald-500"
      Icon = Activity
      btnLabel = "OPEN"
      break
    case 'COLLECT_PAYMENT':
      bgClass = "bg-red-50 border-red-200"
      iconBgClass = "bg-red-100"
      iconClass = "text-red-600"
      textTitleClass = "text-red-900"
      textDescClass = "text-red-700"
      btnClass = "bg-red-600 hover:bg-red-500"
      Icon = CreditCard
      btnLabel = "COLLECT"
      break
    case 'COMPLETE_NOTES':
      bgClass = "bg-orange-50 border-orange-200"
      iconBgClass = "bg-orange-100"
      iconClass = "text-orange-600"
      textTitleClass = "text-orange-900"
      textDescClass = "text-orange-700"
      btnClass = "bg-orange-600 hover:bg-orange-500"
      Icon = FileText
      btnLabel = "WRITE NOTES"
      break
    case 'REVIEW_REFERRAL':
      bgClass = "bg-purple-50 border-purple-200"
      iconBgClass = "bg-purple-100"
      iconClass = "text-purple-600"
      textTitleClass = "text-purple-900"
      textDescClass = "text-purple-700"
      btnClass = "bg-purple-600 hover:bg-purple-500"
      Icon = AlertCircle
      btnLabel = "REVIEW"
      break
    case 'SCHEDULE_FOLLOWUP':
    case 'SET_RECALL':
      bgClass = "bg-amber-50 border-amber-200"
      iconBgClass = "bg-amber-100"
      iconClass = "text-amber-600"
      textTitleClass = "text-amber-900"
      textDescClass = "text-amber-700"
      btnClass = "bg-amber-600 hover:bg-amber-500"
      Icon = Stethoscope
      btnLabel = "SCHEDULE"
      break
    default:
      bgClass = "bg-blue-50 border-blue-200"
      iconBgClass = "bg-blue-100"
      iconClass = "text-blue-600"
      textTitleClass = "text-blue-900"
      textDescClass = "text-blue-700"
      btnClass = "bg-blue-600 hover:bg-blue-500"
      Icon = AlertCircle
  }

  return (
    <div className={`${bgClass} border rounded-lg p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`${iconBgClass} p-2 rounded-full`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold ${textTitleClass}`}>NEXT ACTION: {action.title}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${iconBgClass} ${iconClass}`}>
              {action.priority}
            </span>
          </div>
          <p className={`text-sm ${textDescClass}`}>{action.description}</p>
        </div>
      </div>
      <Link 
        href={action.actionUrl}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${btnClass}`}
      >
        {btnLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
