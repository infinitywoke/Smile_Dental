import { siteConfig } from '@/config/site'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Contact Us - ${siteConfig.name}`,
  description: `Contact ${siteConfig.name} to schedule your dental appointment.`,
}

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-12">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Phone & WhatsApp</h3>
              <p className="mt-1 text-gray-600">{siteConfig.phone}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email</h3>
              <p className="mt-1 text-gray-600">{siteConfig.email}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clinic Address</h3>
              <p className="mt-1 text-gray-600">{siteConfig.address}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <div className="flex-shrink-0 mt-1">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operating Hours</h3>
              <ul className="space-y-2 text-gray-600">
                {siteConfig.operatingHours.map((h, i) => (
                  <li key={i} className="flex justify-between max-w-xs">
                    <span>{h.day}</span>
                    <span className="font-medium">{h.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-500">
            [Map Placeholder] <br/>
            Google Maps iframe can be inserted here when verified address is available.
          </div>
        </div>
      </div>
    </div>
  )
}
