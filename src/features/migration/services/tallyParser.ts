import { Database } from '@/lib/types/database.types'

export type RawTallyRecord = {
  id: string
  date: string
  ledger_name: string
  narration: string
  amount: number
  payment_mode: string
}

export type ParsedTallyData = {
  parsed_name: string | null
  parsed_phone: string | null
  parsed_address: string | null
  historical_age: string | null
}

export function parseTallyRecord(record: RawTallyRecord): ParsedTallyData {
  let name = record.ledger_name.trim()
  let phone: string | null = null
  let age: string | null = null

  // Phone parsing: looks for 10 consecutive digits
  const phoneRegex = /(?:\+91|0)?\s*-?\s*([6-9]\d{9})/
  const phoneMatch = name.match(phoneRegex) || record.narration.match(phoneRegex)
  if (phoneMatch) {
    phone = phoneMatch[1]
    // Remove phone from name if it was in the ledger name
    name = name.replace(phoneRegex, '').replace(/[-:]/g, '').trim()
  }

  // Age parsing: looks for "Age 42" or "42Y" or "42 years"
  const ageRegex = /age\s*:?\s*(\d{1,3})/i
  const ageMatch = record.narration.match(ageRegex) || name.match(ageRegex)
  if (ageMatch) {
    age = ageMatch[1]
    name = name.replace(ageRegex, '').trim()
  }

  // Name normalization
  // Remove trailing dashes or spaces
  name = name.replace(/^-+|-+$/g, '').trim()
  // Replace multiple spaces with single
  name = name.replace(/\s+/g, ' ')

  return {
    parsed_name: name || null,
    parsed_phone: phone || null,
    parsed_address: null, // Basic parser doesn't extract address yet
    historical_age: age || null,
  }
}
