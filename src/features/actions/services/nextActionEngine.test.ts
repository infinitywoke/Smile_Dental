import { describe, it, expect } from 'vitest'
import { computePatientActions } from './nextActionEngine'

describe('NextActionEngine - Deterministic Rules Audit', () => {
  const patientId = 'p1'
  const patientName = 'John Doe'

  // --- 1. START_ENCOUNTER ---
  describe('START_ENCOUNTER', () => {
    it('Positive: Generated for CHECKED_IN appointments', () => {
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'CHECKED_IN', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [], null
      )
      expect(actions.find(a => a.type === 'START_ENCOUNTER')).toBeDefined()
    })

    it('Negative: Suppressed for IN_PROGRESS or COMPLETED appointments', () => {
      const actionsInProg = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'IN_PROGRESS', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [], null
      )
      expect(actionsInProg.find(a => a.type === 'START_ENCOUNTER')).toBeUndefined()

      const actionsComp = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [], null
      )
      expect(actionsComp.find(a => a.type === 'START_ENCOUNTER')).toBeUndefined()
    })
  })

  // --- 2. CONTINUE_ENCOUNTER ---
  describe('CONTINUE_ENCOUNTER', () => {
    it('Positive: Generated for IN_PROGRESS appointments', () => {
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'IN_PROGRESS', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [], null
      )
      expect(actions.find(a => a.type === 'CONTINUE_ENCOUNTER')).toBeDefined()
    })
  })

  // --- 3. COMPLETE_NOTES ---
  describe('COMPLETE_NOTES', () => {
    it('Positive: Generated for COMPLETED appointments missing notes', () => {
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [], null
      )
      expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeDefined()
    })

    it('Negative: Suppressed once clinical record exists', () => {
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
        [], false, [], [], [], [{ appointment_id: 'a1' }], null
      )
      expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeUndefined()
    })
  })

  // --- 4. COLLECT_PAYMENT ---
  describe('COLLECT_PAYMENT (Financial Resolution Audit)', () => {
    it('1. No treatment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })
    
    it('2. Planned treatment (inflates balance currently)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [{ estimated_cost: 200, status: 'PLANNED' }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('3. One completed treatment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [{ estimated_cost: 150, status: 'COMPLETED' }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('4. Partial payment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [{ amount_paid: 50 }], [{ estimated_cost: 100 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('5. Full payment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [{ amount_paid: 100 }], [{ estimated_cost: 100 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('6. Multiple payments', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [{ amount_paid: 50 }, { amount_paid: 50 }], [{ estimated_cost: 100 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('7. Cancelled treatment item (should not be in items array based on query)', () => {
      // The DB query excludes CANCELLED, so engine receives []
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('8. Multiple treatment plans', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [{ estimated_cost: 50 }, { estimated_cost: 75 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('9. Overpayment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [{ amount_paid: 150 }], [{ estimated_cost: 100 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('10. Payment unrelated to relevant treatment', () => {
      // Since engine computes total balance, any payment applies to total balance
      const actions = computePatientActions(patientId, patientName, [], [], false, [{ amount_paid: 100 }], [{ estimated_cost: 50 }, { estimated_cost: 50 }], [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })
  })

  // --- 5. REVIEW_REFERRAL ---
  describe('REVIEW_REFERRAL', () => {
    it('Positive: PENDING_ADVANCE', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [{ id: 'ref1', status: 'PENDING_ADVANCE', created_at: new Date().toISOString() }], [], null)
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeDefined()
    })
    
    it('Positive: ADVANCE_PAID', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [{ id: 'ref1', status: 'ADVANCE_PAID', created_at: new Date().toISOString() }], [], null)
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeDefined()
    })

    it('Negative: Terminal States (SCHEDULED, COMPLETED, CANCELLED)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], 
        [
          { id: 'ref1', status: 'SCHEDULED', created_at: new Date().toISOString() },
          { id: 'ref2', status: 'COMPLETED', created_at: new Date().toISOString() },
          { id: 'ref3', status: 'CANCELLED', created_at: new Date().toISOString() },
        ], 
        [], null
      )
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeUndefined()
    })
  })

  // --- 6. SCHEDULE_FOLLOWUP ---
  describe('SCHEDULE_FOLLOWUP', () => {
    it('Positive: Active plan, no future appointment', () => {
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', created_at: new Date().toISOString() }], false, [], [], [], [], null)
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeDefined()
    })

    it('Negative: Future appointment exists', () => {
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', created_at: new Date().toISOString() }], true, [], [], [], [], null)
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeUndefined()
    })
  })

  // --- 8. SET_RECALL (Recall Boundary Tests) ---
  describe('SET_RECALL', () => {
    it('Boundary: Recent visit (< 6 months)', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 5);
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Exactly 6 months', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 6);
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: 6 months + 1 day', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 6); d.setDate(d.getDate() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeDefined()
    })
    
    it('Boundary: Old visit (1 year ago)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeDefined()
    })
    
    it('Boundary: Cancelled visits only (No completed visit)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, [], [], [], [], null)
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Future appointment exists (Suppresses recall)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], true, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Active treatment exists (Suppresses recall, defaults to SCHEDULE_FOLLOWUP)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', created_at: new Date().toISOString() }], false, [], [], [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeDefined()
    })
  })
})
