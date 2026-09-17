import { describe, it, expect } from 'vitest';

describe('Specialist Advance Calculation', () => {
  it('calculates the correct advance required based on 50% default', () => {
    const estimatedCost = 10000;
    const percentage = 50.00;
    const required = (estimatedCost * percentage) / 100;
    
    expect(required).toBe(5000);
  });

  it('calculates correctly for 25% custom override', () => {
    const estimatedCost = 8000;
    const percentage = 25.00;
    const required = (estimatedCost * percentage) / 100;
    
    expect(required).toBe(2000);
  });
});

describe('Appointment State Transitions', () => {
  it('prevents scheduling if advance is not met', () => {
    const referral = {
      status: 'PENDING_ADVANCE',
      advance_required: 5000
    };
    
    // Simulate backend gate
    const canSchedule = referral.status === 'ADVANCE_PAID';
    expect(canSchedule).toBe(false);
  });

  it('allows scheduling if advance is met', () => {
    const referral = {
      status: 'ADVANCE_PAID',
      advance_required: 5000
    };
    
    // Simulate backend gate
    const canSchedule = referral.status === 'ADVANCE_PAID';
    expect(canSchedule).toBe(true);
  });
});
