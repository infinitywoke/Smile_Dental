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
  address: "1st Floor, YM, Zohara Building, Shirva Rd, Bank of Baroda, Yenna Gudde, Katapadi - 574105", // [VERIFIED]
  mapEmbedLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3690.9245645463925!2d74.7497085!3d13.2845037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbcbba33e21b099%3A0xcafb512227026d47!2sSmile%20Dental%20Clinic%20-%20Katapady!5e1!3m2!1sen!2sin!4v1789624673623!5m2!1sen!2sin", // [VERIFIED]
  googleReviewsLink: "https://maps.app.goo.gl/b8YHvgUQt4hPuCQL6", // [VERIFIED]
  googlePhotosLink: "https://maps.app.goo.gl/b8YHvgUQt4hPuCQL6", // [VERIFIED]
  
  operatingHours: [
    { day: "Everyday (Fridays Off)", hours: ["8:30 AM - 1:00 PM", "2:30 PM - 7:30 PM"] }, // [VERIFIED]
  ],
  
  socials: {
    instagram: "[LINK PENDING]", // [PLACEHOLDER]
    facebook: "[LINK PENDING]", // [PLACEHOLDER]
  },
  
  // --- Dentist Information ---
  dentist: {
    name: "Dr. Rahil Yusuf", // [VERIFIED]
    qualifications: "BDS, November 2020 - Yenapoya Deemed to be University", // [VERIFIED]
    experience: "5 Years across India & Middle East", // [VERIFIED]
    bio: "Dr Rahil Yusuf is a caring and approachable dental professional who believes that every patient deserves to feel comfortable, heard, and confident about their dental care. He takes the time to understand each patient’s needs and explains treatment options in a simple and reassuring way. At Smile Dental Clinic, Katapady, Udupi, his goal is to make every dental visit a positive experience while helping patients achieve healthy, natural-looking smiles that they can be proud of. Your comfort, trust, and smile are always at the heart of our care.", // [VERIFIED]
    portraitPhoto: "/images/dr-rahil-front.jpg", // [VERIFIED]
    actionPhoto: "/images/clinical-procedure.jpg" // [VERIFIED]
  },
  
  // --- Clinic Media ---
  media: {
    logo: "/images/logo.jpg", // [VERIFIED]
    priceList: "/images/price-list.jpg", // [VERIFIED]
    sideProfile: "/images/dr-rahil-side.jpg" // [VERIFIED]
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
    question: "Where is Smile Dental Clinic located in Udupi?",
    answer: "Smile Dental Clinic is conveniently located on the 1st Floor of YM Zohara Building, on Shirva Road, near Bank of Baroda, Katapadi, in Yenna Gudde. We proudly serve patients from Katapadi, Udupi, and surrounding areas.",
    isVerified: true
  },
  {
    question: "Who is the best dentist in Katapadi, Udupi?",
    answer: "Dr. Rahil Yusuf is a highly rated, 5-star dentist in Katapadi, Udupi, with over 5 years of clinical experience across India and the Middle East. He is known for providing gentle, pain-free, and affordable dental care.",
    isVerified: true
  },
  {
    question: "What dental treatments do you offer at your Katapadi clinic?",
    answer: "We offer a complete range of professional dental treatments including teeth cleaning (scaling), orthodontics (metal/ceramic braces and aligners), root canal treatments (RCT), painless tooth extractions, tooth-colored composite fillings, complete dentures, and premium Zirconia crowns.",
    isVerified: true
  },
  {
    question: "Are you open on Sundays?",
    answer: "Yes, Smile Dental Clinic in Katapadi is open on Sundays! Our everyday timings are 8:30 AM to 1:00 PM and 2:30 PM to 7:30 PM. We are only closed on Fridays.",
    isVerified: true
  }
]
