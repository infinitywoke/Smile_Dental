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
        [], false, 0, [], [], null
      )
      expect(actions.find(a => a.type === 'START_ENCOUNTER')).toBeDefined()
    })

    it('Negative: Suppressed for IN_PROGRESS or COMPLETED appointments', () => {
      const actionsInProg = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'IN_PROGRESS', updated_at: new Date().toISOString() }],
        [], false, 0, [], [], null
      )
      expect(actionsInProg.find(a => a.type === 'START_ENCOUNTER')).toBeUndefined()

      const actionsComp = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
        [], false, 0, [], [], null
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
        [], false, 0, [], [], null
      )
      expect(actions.find(a => a.type === 'CONTINUE_ENCOUNTER')).toBeDefined()
    })
  })

  // --- 3. COMPLETE_NOTES ---
  describe('COMPLETE_NOTES', () => {
    it('Positive: Generated for past IN_PROGRESS appointments', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'IN_PROGRESS', scheduled_start: pastDate.toISOString(), updated_at: new Date().toISOString() }],
        [], false, 0, [], [], null
      )
      expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeDefined()
    })

    it('Negative: Not generated for today IN_PROGRESS appointments', () => {
      const todayDate = new Date()
      const actions = computePatientActions(
        patientId, patientName,
        [{ id: 'a1', status: 'IN_PROGRESS', scheduled_start: todayDate.toISOString(), updated_at: new Date().toISOString() }],
        [], false, 0, [], [], null
      )
      expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeUndefined()
      expect(actions.find(a => a.type === 'CONTINUE_ENCOUNTER')).toBeDefined()
    })
  })

  // --- 4. COLLECT_PAYMENT ---
  describe('COLLECT_PAYMENT (Financial Resolution Audit)', () => {
    it('1. No treatment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })
    
    it('2. Planned treatment (inflates balance currently)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 200, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('3. One completed treatment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 150, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('4. Partial payment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 50, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('5. Full payment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('6. Multiple payments', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('7. Cancelled treatment item (should not be in items array based on query)', () => {
      // The DB query excludes CANCELLED, so engine receives []
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('8. Multiple treatment plans', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 125, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
    })

    it('9. Overpayment', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, -50, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })

    it('10. Payment unrelated to relevant treatment', () => {
      // Since engine computes total balance, any payment applies to total balance
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
    })
  })

  // --- 5. REVIEW_REFERRAL ---
  describe('REVIEW_REFERRAL', () => {
    it('Positive: PENDING_ADVANCE', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [{ id: 'ref1', status: 'PENDING_ADVANCE', created_at: new Date().toISOString() }], [], null)
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeDefined()
    })
    
    it('Positive: ADVANCE_PAID', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [{ id: 'ref1', status: 'ADVANCE_PAID', created_at: new Date().toISOString() }], [], null)
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeDefined()
    })

    it('Negative: Terminal States (SCHEDULED, COMPLETED, CANCELLED)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0,  
        [
          { id: 'ref1', status: 'SCHEDULED', created_at: new Date().toISOString() },
          { id: 'ref2', status: 'COMPLETED', created_at: new Date().toISOString() },
          { id: 'ref3', status: 'CANCELLED', created_at: new Date().toISOString() },
        ], [], null
      )
      expect(actions.find(a => a.type === 'REVIEW_REFERRAL')).toBeUndefined()
    })
  })

  // --- 5.5 COMPLETE_TREATMENT ---
  describe('COMPLETE_TREATMENT', () => {
    it('Negative: no treatment -> no action', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COMPLETE_TREATMENT')).toBeUndefined()
    })

    it('Positive: incomplete actionable treatment -> action', () => {
      const plans = [{
        id: 'p1', name: 'Plan', status: 'ACTIVE', created_at: new Date().toISOString(),
        treatment_items: [{ id: 'i1', status: 'IN_PROGRESS', procedure: 'Filling', tooth_number: '14' }]
      }]
      const actions = computePatientActions(patientId, patientName, [], plans, false, 0, [], [], null)
      const action = actions.find(a => a.type === 'COMPLETE_TREATMENT')
      expect(action).toBeDefined()
      expect(action?.priority).toBe('HIGH')
      expect(action?.patientId).toBe(patientId)
      expect(action?.patientName).toBe(patientName)
      expect(action?.treatmentPlanId).toBe('p1')
      expect(action?.treatmentItemId).toBe('i1')
      expect(action?.tooth).toBe('14')
      expect(action?.reason).toBe('Filling')
      expect(action?.description).toBe('Filling (Tooth #14) is currently in progress.')
      expect(action?.actionUrl).toBe(`/dashboard/patients/${patientId}#treatments`)
    })

    it('Negative: completed or cancelled treatment -> no action', () => {
      const plans = [{
        id: 'p1', name: 'Plan', status: 'ACTIVE',
        treatment_items: [
          { id: 'i1', status: 'COMPLETED', procedure: 'Filling' },
          { id: 'i2', status: 'CANCELLED', procedure: 'Extraction' },
          { id: 'i3', status: 'PLANNED', procedure: 'Crown' }
        ]
      }]
      const actions = computePatientActions(patientId, patientName, [], plans, false, 0, [], [], null)
      expect(actions.find(a => a.type === 'COMPLETE_TREATMENT')).toBeUndefined()
    })

    it('Multiple items: one completed + one incomplete', () => {
      const plans = [{
        id: 'p1', name: 'Plan', status: 'ACTIVE',
        treatment_items: [
          { id: 'i1', status: 'COMPLETED', procedure: 'Filling' },
          { id: 'i2', status: 'IN_PROGRESS', procedure: 'Extraction', tooth_number: '8' }
        ]
      }]
      const actions = computePatientActions(patientId, patientName, [], plans, false, 0, [], [], null)
      const treatActions = actions.filter(a => a.type === 'COMPLETE_TREATMENT')
      expect(treatActions.length).toBe(1)
      expect(treatActions[0].treatmentItemId).toBe('i2')
    })

    it('Multiple items: multiple incomplete items', () => {
      const plans = [{
        id: 'p1', name: 'Plan', status: 'ACTIVE',
        treatment_items: [
          { id: 'i1', status: 'IN_PROGRESS', procedure: 'Filling', tooth_number: '14' },
          { id: 'i2', status: 'IN_PROGRESS', procedure: 'Extraction', tooth_number: '8' }
        ]
      }]
      const actions = computePatientActions(patientId, patientName, [], plans, false, 0, [], [], null)
      const treatActions = actions.filter(a => a.type === 'COMPLETE_TREATMENT')
      expect(treatActions.length).toBe(2)
      expect(treatActions[0].treatmentItemId).toBe('i1')
      expect(treatActions[1].treatmentItemId).toBe('i2')
    })

    it('Multiple plans: one active, one completed', () => {
      const plans = [
        {
          id: 'p1', name: 'Completed Plan', status: 'COMPLETED',
          treatment_items: [{ id: 'i1', status: 'IN_PROGRESS', procedure: 'Filling' }] // Should not happen IRL but testing filter
        },
        {
          id: 'p2', name: 'Active Plan', status: 'ACTIVE',
          treatment_items: [{ id: 'i2', status: 'IN_PROGRESS', procedure: 'Crown' }]
        }
      ]
      const actions = computePatientActions(patientId, patientName, [], plans, false, 0, [], [], null)
      const treatActions = actions.filter(a => a.type === 'COMPLETE_TREATMENT')
      expect(treatActions.length).toBe(1)
      expect(treatActions[0].treatmentPlanId).toBe('p2')
      expect(treatActions[0].treatmentItemId).toBe('i2')
    })
  })

  // --- 6. SCHEDULE_FOLLOWUP ---
  describe('SCHEDULE_FOLLOWUP', () => {
    it('Positive: Active plan, no future appointment', () => {
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', status: 'ACTIVE', created_at: new Date().toISOString() }], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeDefined()
    })

    it('Negative: Future appointment exists', () => {
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', status: 'ACTIVE', created_at: new Date().toISOString() }], true, 0, [], [], null)
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeUndefined()
    })
  })

  // --- 8. SET_RECALL (Recall Boundary Tests) ---
  describe('SET_RECALL', () => {
    it('Boundary: Recent visit (< 6 months)', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 5);
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Exactly 6 months', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 6);
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: 6 months + 1 day', () => {
      const d = new Date(); d.setMonth(d.getMonth() - 6); d.setDate(d.getDate() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeDefined()
    })
    
    it('Boundary: Old visit (1 year ago)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeDefined()
    })
    
    it('Boundary: Cancelled visits only (No completed visit)', () => {
      const actions = computePatientActions(patientId, patientName, [], [], false, 0, [], [], null)
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Future appointment exists (Suppresses recall)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [], true, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
    })
    
    it('Boundary: Active treatment exists (Suppresses recall, defaults to SCHEDULE_FOLLOWUP)', () => {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      const actions = computePatientActions(patientId, patientName, [], [{ id: 'p1', name: 'Plan', status: 'ACTIVE', created_at: new Date().toISOString() }], false, 0, [], [], d.toISOString())
      expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
      expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeDefined()
    })
  })
})

