import Link from 'next/link'
import { siteConfig, treatments, faqs } from '@/config/site'
import { Calendar, CheckCircle, ArrowRight, Star } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${siteConfig.name} - Trusted Local Dental Care`,
  description: siteConfig.description,
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.split(',')[0],
      addressLocality: siteConfig.address.split(',')[1]?.trim() || '',
      addressRegion: siteConfig.address.split(',')[2]?.trim()?.split(' ')[0] || '',
      postalCode: siteConfig.address.split(' ').pop() || '',
    },
    openingHoursSpecification: siteConfig.operatingHours.map(oh => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: oh.day.includes(' - ') ? oh.day.split(' - ').join(',') : oh.day,
      opens: oh.hours === 'Closed' ? '00:00' : '09:00',
      closes: oh.hours === 'Closed' ? '00:00' : (oh.hours.includes('4:00 PM') ? '16:00' : '19:00'),
    }))
  }

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero Section */}
      <section className="relative bg-blue-50 py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              Modern, Pain-Free <br />
              <span className="text-blue-600">Dental Care</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Experience the highest standard of dental care in a comfortable, relaxing environment. 
              {siteConfig.dentist.name} and our expert team are dedicated to your long-term oral health.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/book" 
                className="inline-flex justify-center items-center rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Link>
              <a 
                href={`tel:${siteConfig.phone}`}
                className="inline-flex justify-center items-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                Call {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-1/3 opacity-20 hidden lg:block">
          <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#2563EB" d="M45.7,-76.4C58.9,-69.1,69.1,-55.5,77,-41.2C84.9,-26.9,90.4,-11.9,89.5,2.7C88.5,17.2,81.1,31.4,72.4,44.2C63.6,57,53.5,68.4,41,75.9C28.4,83.4,14.2,87,1,85.3C-12.2,83.7,-24.4,76.8,-35.8,68.8C-47.3,60.8,-57.9,51.6,-66.2,40.3C-74.6,28.9,-80.7,15.5,-82.7,1.4C-84.7,-12.7,-82.5,-27.5,-75.1,-39.8C-67.6,-52.2,-54.9,-62.1,-41.3,-68.9C-27.7,-75.7,-13.9,-79.4,0.9,-80.8C15.6,-82.1,32.5,-83.7,45.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </section>

      {/* 2. Key Trust / Value Prop */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Expert Care", desc: "Highly qualified specialists using the latest dental technology." },
              { title: "Pain-Free Approach", desc: "Gentle techniques ensuring your comfort throughout the procedure." },
              { title: "Transparent Pricing", desc: "Clear treatment plans with no hidden costs or surprises." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Treatments Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Our Services</h2>
            <p className="mt-4 text-lg text-gray-600">Comprehensive dental care tailored to your specific needs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {treatments.map(t => (
              <Link key={t.slug} href={`/treatments/${t.slug}`} className="group bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-md hover:ring-blue-600 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{t.name}</h3>
                <p className="text-gray-600 mb-4">{t.shortDescription}</p>
                <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/treatments" className="inline-flex justify-center items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">
              View All Treatments
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Dentist Introduction */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row">
            <div className="p-10 md:p-16 md:w-2/3 text-white flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4">Meet {siteConfig.dentist.name}</h2>
              <p className="text-blue-100 font-medium mb-6">
                {siteConfig.dentist.qualifications} &bull; {siteConfig.dentist.experience}
              </p>
              <p className="text-lg leading-relaxed mb-8 opacity-90">
                "{siteConfig.dentist.bio}"
              </p>
              <div>
                <Link href="/about" className="inline-flex justify-center items-center rounded-full bg-white text-blue-600 px-6 py-2.5 text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                  Read Full Profile
                </Link>
              </div>
            </div>
            {/* Placeholder for Dentist Photo */}
            <div className="md:w-1/3 bg-blue-800 min-h-[300px] flex items-center justify-center text-blue-300">
              [Photo Placeholder]
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.slice(0, 3).map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/faq" className="text-blue-600 font-medium hover:underline">View all FAQs &rarr;</Link>
          </div>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to improve your smile?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Book an appointment online in seconds. New patients are always welcome.
          </p>
          <Link 
            href="/book" 
            className="inline-flex justify-center items-center rounded-full bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-6 h-6 mr-2" />
            Book Your Visit Now
          </Link>
        </div>
      </section>
    </div>
  )
}
