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
  phone: "+91 6361816711", // [VERIFIED]
  whatsapp: "+91 6361816711", // [VERIFIED]
  email: "smiledental8925@gmail.com", // [VERIFIED]
  address: "1st Floor, YM, Zohara Building, Shirva Rd, Vijaya Bank, Yenna Gudde, Katapadi - 574105", // [VERIFIED]
  mapEmbedLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3690.9245645463925!2d74.7497085!3d13.2845037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbcbba33e21b099%3A0xcafb512227026d47!2sSmile%20Dental%20Clinic%20-%20Katapady!5e1!3m2!1sen!2sin!4v1789624673623!5m2!1sen!2sin", // [VERIFIED]
  
  operatingHours: [
    { day: "Saturday - Thursday", hours: "8:30 AM - 1:00 PM, 2:30 PM - 7:30 PM" }, // [VERIFIED]
    { day: "Friday", hours: "Closed" }, // [VERIFIED]
  ],
  
  socials: {
    instagram: "[LINK PENDING]", // [PLACEHOLDER]
    facebook: "[LINK PENDING]", // [PLACEHOLDER]
  },
  
  // --- Dentist Information ---
  dentist: {
    name: "Dr. Rahil", // [VERIFIED]
    qualifications: "BDS, November 2020 - Yenapoya Deemed to be University", // [VERIFIED]
    experience: "5 Years across India & Middle East", // [VERIFIED]
    bio: "Dr Rahil Yusuf is a caring and approachable dental professional who believes that every patient deserves to feel comfortable, heard, and confident about their dental care. He takes the time to understand each patient’s needs and explains treatment options in a simple and reassuring way. At Smile Dental Clinic, Katapady, Udupi, his goal is to make every dental visit a positive experience while helping patients achieve healthy, natural-looking smiles that they can be proud of. Your comfort, trust, and smile are always at the heart of our care.", // [VERIFIED]
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
