export type ActionPriority = 'NOW' | 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'

export type ActionCategory = 
  | 'CLINICAL'      // In-chair, Waiting Room, Needs Notes
  | 'FINANCIAL'     // Outstanding Balances
  | 'SCHEDULING'    // Active Treatment needs booking, Web Booking Requests
  | 'COORDINATION'  // Specialist Referrals

export type ClinicActionType =
  | 'START_ENCOUNTER'
  | 'CONTINUE_ENCOUNTER'
  | 'COMPLETE_NOTES'
  | 'SCHEDULE_FOLLOWUP'
  | 'COMPLETE_TREATMENT'
  | 'COLLECT_PAYMENT'
  | 'REVIEW_REFERRAL'
  | 'RESPOND_TO_BOOKING'
  | 'SET_RECALL'

export type ClinicActionSource =
  | 'APPOINTMENT'
  | 'CLINICAL_RECORD'
  | 'TREATMENT'
  | 'PAYMENT'
  | 'REFERRAL'
  | 'BOOKING'
  | 'RECALL'

export interface ClinicAction {
  id: string
  patientId: string
  patientName: string
  
  type: ClinicActionType
  source: ClinicActionSource

  category: ActionCategory
  priority: ActionPriority
  
  title: string
  description: string
  actionUrl: string
  timestamp: string
}
