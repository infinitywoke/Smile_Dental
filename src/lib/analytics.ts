// src/lib/analytics.ts

type EventName = 
  | 'booking_started'
  | 'booking_submitted'
  | 'booking_failed'
  | 'booking_converted'
  | 'patient_created'
  | 'patient_updated'
  | 'appointment_created'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'appointment_checked_in'
  | 'consultation_started'
  | 'consultation_saved'
  | 'consultation_completed'
  | 'treatment_plan_created'
  | 'payment_recorded'
  | 'specialist_referral_created'
  | 'specialist_advance_recorded'
  | 'specialist_appointment_scheduled'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'navigation_error'
  | 'server_action_error';

export function trackEvent(eventName: EventName, properties?: Record<string, unknown>) {
  // Strip PII from properties
  const safeProperties = { ...properties };
  const piiKeys = ['name', 'phone', 'email', 'address', 'diagnosis', 'notes', 'procedure_summary', 'advice', 'medications', 'narration', 'dob'];
  
  piiKeys.forEach(key => {
    if (key in safeProperties) {
      delete safeProperties[key];
    }
  });

  // In a real application, this would send to PostHog, Mixpanel, Amplitude, etc.
  // For the Clinic OS verification, we log to console (in dev) or a generic endpoint.
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_ANALYTICS) {
    console.log(`[Product Analytics] ${eventName}`, safeProperties);
  }

  // Example integration placeholder
  // fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ event: eventName, properties: safeProperties }) });
}
