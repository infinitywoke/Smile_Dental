'use client'

import Link from 'next/link'
import { AlertCircle, CreditCard, Stethoscope, Calendar, ArrowRight, Activity, FileText } from 'lucide-react'
import { ClinicAction } from '@/lib/types/actions'

type NextActionCardProps = {
  actions: ClinicAction[]
}

export function NextActionCard({ actions }: NextActionCardProps) {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between" role="region" aria-label="Action Center">
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

  const primaryAction = actions[0]
  const secondaryActions = actions.slice(1)

  const getStyleForAction = (action: ClinicAction) => {
    let style = {
      bg: "bg-gray-50 border-gray-200",
      iconBg: "bg-gray-100",
      icon: "text-gray-600",
      textTitle: "text-gray-900",
      textDesc: "text-gray-700",
      btn: "bg-gray-600 hover:bg-gray-500",
      Icon: Calendar,
      btnLabel: "RESOLVE"
    }

    switch (action.type) {
      case 'START_ENCOUNTER':
      case 'CONTINUE_ENCOUNTER':
        style = { ...style, bg: "bg-emerald-50 border-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-600", textTitle: "text-emerald-900", textDesc: "text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-500", Icon: Activity, btnLabel: "OPEN" }
        break
      case 'COLLECT_PAYMENT':
        style = { ...style, bg: "bg-red-50 border-red-200", iconBg: "bg-red-100", icon: "text-red-600", textTitle: "text-red-900", textDesc: "text-red-700", btn: "bg-red-600 hover:bg-red-500", Icon: CreditCard, btnLabel: "COLLECT" }
        break
      case 'COMPLETE_NOTES':
        style = { ...style, bg: "bg-orange-50 border-orange-200", iconBg: "bg-orange-100", icon: "text-orange-600", textTitle: "text-orange-900", textDesc: "text-orange-700", btn: "bg-orange-600 hover:bg-orange-500", Icon: FileText, btnLabel: "WRITE NOTES" }
        break
      case 'REVIEW_REFERRAL':
        style = { ...style, bg: "bg-purple-50 border-purple-200", iconBg: "bg-purple-100", icon: "text-purple-600", textTitle: "text-purple-900", textDesc: "text-purple-700", btn: "bg-purple-600 hover:bg-purple-500", Icon: AlertCircle, btnLabel: "REVIEW" }
        break
      case 'SCHEDULE_FOLLOWUP':
      case 'SET_RECALL':
        style = { ...style, bg: "bg-amber-50 border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-600", textTitle: "text-amber-900", textDesc: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-500", Icon: Stethoscope, btnLabel: "SCHEDULE" }
        break
      default:
        style = { ...style, bg: "bg-blue-50 border-blue-200", iconBg: "bg-blue-100", icon: "text-blue-600", textTitle: "text-blue-900", textDesc: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-500", Icon: AlertCircle }
    }
    return style
  }

  const primaryStyle = getStyleForAction(primaryAction)

  return (
    <div className="space-y-4" role="region" aria-label="Action Center">
      <div className={`${primaryStyle.bg} border rounded-lg p-4 sm:flex sm:items-center sm:justify-between gap-4`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`${primaryStyle.iconBg} p-2 rounded-full shrink-0`} aria-hidden="true">
            <primaryStyle.Icon className={`h-5 w-5 ${primaryStyle.icon}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm font-bold ${primaryStyle.textTitle}`}>NEXT ACTION: {primaryAction.title}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${primaryStyle.iconBg} ${primaryStyle.icon}`}>
                <span className="sr-only">Priority: </span>{primaryAction.priority}
              </span>
            </div>
            <p className={`text-sm ${primaryStyle.textDesc} mt-1 sm:mt-0`}>{primaryAction.description}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 shrink-0">
          <Link 
            href={primaryAction.actionUrl}
            className={`inline-flex w-full sm:w-auto justify-center items-center gap-1 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${primaryStyle.btn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
            aria-label={`Resolve action: ${primaryAction.title}`}
          >
            {primaryStyle.btnLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {secondaryActions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Also Needs Attention</h4>
          <ul className="space-y-3">
            {secondaryActions.map(action => {
              const style = getStyleForAction(action)
              return (
                <li key={action.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 hover:bg-gray-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <style.Icon className={`h-4 w-4 ${style.icon} mt-0.5 shrink-0`} aria-hidden="true" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${style.textTitle}`}>{action.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.iconBg} ${style.icon}`}>
                          <span className="sr-only">Priority: </span>{action.priority}
                        </span>
                      </div>
                      <span className={`text-xs ${style.textDesc}`}>{action.description}</span>
                    </div>
                  </div>
                  <Link 
                    href={action.actionUrl}
                    className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md text-white shadow-sm ${style.btn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                    aria-label={`Resolve secondary action: ${action.title}`}
                  >
                    {style.btnLabel}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
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
