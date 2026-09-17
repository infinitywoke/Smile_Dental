export type { Appointment } from '@/lib/types/database.types'
export type AppointmentWithPatient = import('@/lib/types/database.types').Appointment & { patients?: any }
