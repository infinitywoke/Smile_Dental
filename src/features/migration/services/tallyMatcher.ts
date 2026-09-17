import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database.types'

export type CandidateMatch = {
  patient_id: string
  confidence: number
  reasons: string[]
}

export type MatchResult = {
  status: Database['public']['Enums']['match_status']
  candidates: CandidateMatch[]
  best_confidence: number | null
}

export async function matchPatient(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  parsedName: string | null,
  parsedPhone: string | null
): Promise<MatchResult> {
  const candidates: CandidateMatch[] = []

  if (!parsedName && !parsedPhone) {
    return { status: 'UNMATCHED', candidates: [], best_confidence: null }
  }

  // Find by phone (exact match is high confidence)
  if (parsedPhone) {
    const { data: phoneMatches } = await supabase
      .from('patients')
      .select('id, name, phone')
      .eq('tenant_id', tenantId)
      .eq('phone', parsedPhone)

    if (phoneMatches) {
      for (const match of phoneMatches) {
        candidates.push({
          patient_id: match.id,
          confidence: 90,
          reasons: ['Exact phone match'],
        })
      }
    }
  }

  // Find by name (similarity is lower confidence)
  if (parsedName) {
    // Basic ilike match for this demo
    const { data: nameMatches } = await supabase
      .from('patients')
      .select('id, name, phone')
      .eq('tenant_id', tenantId)
      .ilike('name', `%${parsedName}%`)

    if (nameMatches) {
      for (const match of nameMatches) {
        // Only add if not already added by phone
        if (!candidates.find((c) => c.patient_id === match.id)) {
          // If name is exact (case-insensitive), higher confidence
          const isExactName = match.name.toLowerCase() === parsedName.toLowerCase()
          candidates.push({
            patient_id: match.id,
            confidence: isExactName ? 70 : 40,
            reasons: [isExactName ? 'Exact name match' : 'Partial name match'],
          })
        } else {
          // Boost confidence if both name and phone matched
          const existing = candidates.find((c) => c.patient_id === match.id)!
          existing.confidence = Math.min(100, existing.confidence + 10)
          existing.reasons.push('Name also matched')
        }
      }
    }
  }

  if (candidates.length === 0) {
    return { status: 'UNMATCHED', candidates: [], best_confidence: null }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence)

  const topMatch = candidates[0]
  
  // If we have a single very high confidence match, we can AUTO_MATCH
  // If we have multiple high confidence matches, we need MANUAL_REVIEW
  // If we only have low confidence matches, we need MANUAL_REVIEW
  let status: Database['public']['Enums']['match_status'] = 'CANDIDATE'

  if (topMatch.confidence >= 90) {
    if (candidates.length > 1 && candidates[1].confidence >= 80) {
      status = 'MANUAL_REVIEW' // Ambiguous
    } else {
      status = 'AUTO_MATCHED' // Single strong match
    }
  } else {
    status = 'MANUAL_REVIEW' // Only weak matches
  }

  return {
    status,
    candidates,
    best_confidence: topMatch.confidence,
  }
}
