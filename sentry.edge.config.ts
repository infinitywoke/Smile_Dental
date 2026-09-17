import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  beforeSend(event) {
    // Scrub PII: Remove user IP and email addresses
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Scrub clinical payloads, patient details, and Tally narrations from request data
    if (event.request && event.request.data) {
      try {
        let data = event.request.data;
        if (typeof data === 'string') {
          // If it's a JSON string, try to parse it
          const parsed = JSON.parse(data);
          event.request.data = JSON.stringify(scrubPayload(parsed));
        } else if (typeof data === 'object') {
          event.request.data = scrubPayload(data);
        }
      } catch (e) {
        // If we can't parse or scrub it, strip it entirely to be safe
        delete event.request.data;
      }
    }
    return event;
  }
});

function scrubPayload(data: any): any {
  const scrubKeys = [
    'name', 'phone', 'email', 'address', 'date_of_birth', 'dob',
    'diagnosis', 'notes', 'medications', 'narration', 'raw_narration',
    'raw_patient_identifier', 'candidate_patients'
  ];
  const scrubbed = { ...data };
  for (const key of Object.keys(scrubbed)) {
    if (scrubKeys.includes(key.toLowerCase())) {
      scrubbed[key] = '[SCRUBBED]';
    } else if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
      scrubbed[key] = scrubPayload(scrubbed[key]);
    }
  }
  return scrubbed;
}
