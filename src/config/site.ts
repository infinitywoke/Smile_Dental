/**
 * CLINIC CONTENT CONFIGURATION
 * 
 * IMPORTANT: 
 * - [VERIFIED]: Information explicitly known/provided for Smile Dental Clinic.
 * - [PLACEHOLDER]: Information intentionally awaiting clinic-owner input. Must not be published as fact.
 * - [GENERATED]: Generic copy generated during implementation. Requires owner review.
 */

export const siteConfig = {
  // --- Clinic Identity ---
  name: "Smile Dental Clinic", // [VERIFIED]
  description: "Modern, professional, and pain-free dental care in your locality.", // [GENERATED]
  url: "https://smiledental.test", // [PLACEHOLDER]
  
  // --- Contact Information ---
  phone: "[PENDING VERIFICATION]", // [PLACEHOLDER]
  whatsapp: "[PENDING VERIFICATION]", // [PLACEHOLDER]
  email: "contact@smiledental.placeholder", // [PLACEHOLDER]
  address: "[CLINIC ADDRESS PENDING]", // [PLACEHOLDER]
  
  operatingHours: [
    { day: "Monday - Saturday", hours: "[HOURS PENDING]" }, // [PLACEHOLDER]
    { day: "Sunday", hours: "Closed" }, // [PLACEHOLDER]
  ],
  
  socials: {
    instagram: "[LINK PENDING]", // [PLACEHOLDER]
    facebook: "[LINK PENDING]", // [PLACEHOLDER]
  },
  
  // --- Dentist Information ---
  dentist: {
    name: "Dr. Rahil", // [VERIFIED]
    qualifications: "[QUALIFICATIONS PENDING]", // [PLACEHOLDER]
    experience: "[EXPERIENCE PENDING]", // [PLACEHOLDER]
    bio: "[BIOGRAPHY PENDING VERIFICATION]", // [PLACEHOLDER]
    portraitPhoto: "/images/dr_rahil_portrait.jpg", // [VERIFIED]
    actionPhoto: "/images/dr_rahil_action.jpg" // [VERIFIED]
  },
  
  // --- Clinic Media ---
  media: {
    logo: "/images/logo.jpg" // [VERIFIED]
  }
}

// --- Services ---
// [PLACEHOLDER] Catalog awaiting clinic owner's actual service list.
export const treatments = [
  {
    slug: "placeholder-treatment",
    name: "[TREATMENT NAME PENDING]",
    shortDescription: "[TREATMENT SUMMARY PENDING]",
    description: "[TREATMENT DETAILS PENDING VERIFICATION]",
    isVerified: false
  }
]

// --- FAQs ---
// [PLACEHOLDER] Awaiting verified clinic FAQs.
export const faqs = [
  {
    question: "[FAQ QUESTION PENDING]",
    answer: "[FAQ ANSWER PENDING VERIFICATION]",
    isVerified: false
  }
]
