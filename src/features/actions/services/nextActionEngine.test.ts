import { describe, it, expect } from 'vitest'
import { computePatientActions } from './nextActionEngine'

describe('Clinic Action Engine Rules', () => {
  const patientId = 'p1'
  const patientName = 'John Doe'

  it('generates START_ENCOUNTER for CHECKED_IN appointments', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [{ id: 'a1', status: 'CHECKED_IN', updated_at: new Date().toISOString() }],
      [], false, [], [], [], [], null
    )
    
    const action = actions.find(a => a.type === 'START_ENCOUNTER')
    expect(action).toBeDefined()
    expect(action?.priority).toBe('NOW')
  })

  it('generates CONTINUE_ENCOUNTER for IN_PROGRESS appointments', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [{ id: 'a1', status: 'IN_PROGRESS', updated_at: new Date().toISOString() }],
      [], false, [], [], [], [], null
    )
    
    expect(actions.find(a => a.type === 'CONTINUE_ENCOUNTER')).toBeDefined()
  })

  it('generates COMPLETE_NOTES for COMPLETED appointments missing notes', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
      [], false, [], [], [], [], null // No clinical records
    )
    
    expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeDefined()
  })

  it('suppresses COMPLETE_NOTES if clinical record exists', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [{ id: 'a1', status: 'COMPLETED', updated_at: new Date().toISOString() }],
      [], false, [], [], [],
      [{ appointment_id: 'a1' }], // Record exists
      null
    )
    
    // Note: since it's suppressed, it should fall back to SET_RECALL
    expect(actions.find(a => a.type === 'COMPLETE_NOTES')).toBeUndefined()
  })

  it('generates COLLECT_PAYMENT if balance > 0', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [], [], true, 
      [{ amount_paid: 50 }], // Paid 50
      [{ estimated_cost: 200 }], // Cost 200 (Balance = 150)
      [], [], null
    )
    
    expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeDefined()
  })

  it('suppresses COLLECT_PAYMENT if balance <= 0', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [], [], true, 
      [{ amount_paid: 200 }], // Paid 200
      [{ estimated_cost: 200 }], // Cost 200
      [], [], null
    )
    
    expect(actions.find(a => a.type === 'COLLECT_PAYMENT')).toBeUndefined()
  })

  it('generates SCHEDULE_FOLLOWUP if active plan exists and no future appointment', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [], 
      [{ id: 'plan1', name: 'Root Canal', created_at: new Date().toISOString() }], // Active plan
      false, // No future appt
      [], [], [], [], null
    )
    
    expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeDefined()
  })

  it('suppresses SCHEDULE_FOLLOWUP if future appointment exists', () => {
    const actions = computePatientActions(
      patientId, patientName,
      [], 
      [{ id: 'plan1', name: 'Root Canal', created_at: new Date().toISOString() }], // Active plan
      true, // HAS future appt
      [], [], [], [], null
    )
    
    expect(actions.find(a => a.type === 'SCHEDULE_FOLLOWUP')).toBeUndefined()
  })

  it('generates SET_RECALL if no active plans, no future appointments, and last visit > 6m ago', () => {
    const sevenMonthsAgo = new Date()
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7)

    const actions = computePatientActions(
      patientId, patientName,
      [], [], false, [], [], [], [],
      sevenMonthsAgo.toISOString()
    )
    
    expect(actions.find(a => a.type === 'SET_RECALL')).toBeDefined()
  })

  it('suppresses SET_RECALL if last visit < 6m ago', () => {
    const fiveMonthsAgo = new Date()
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)

    const actions = computePatientActions(
      patientId, patientName,
      [], [], false, [], [], [], [],
      fiveMonthsAgo.toISOString()
    )
    
    expect(actions.find(a => a.type === 'SET_RECALL')).toBeUndefined()
  })
})
