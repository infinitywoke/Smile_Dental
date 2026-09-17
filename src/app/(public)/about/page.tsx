import { siteConfig } from '@/config/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `About Us - ${siteConfig.name}`,
  description: `Learn more about ${siteConfig.name} and our expert team.`,
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-8">About {siteConfig.name}</h1>
      
      <div className="prose prose-lg prose-blue max-w-none text-gray-700">
        <p className="lead text-xl text-gray-600 mb-8">
          {siteConfig.description}
        </p>
        
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Our Philosophy</h2>
        <p>
          At {siteConfig.name}, we believe that visiting the dentist shouldn't be stressful. We've built our practice around patient comfort, transparent communication, and advanced, pain-free dental techniques.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Meet {siteConfig.dentist.name}</h2>
        <p className="font-medium text-gray-900">{siteConfig.dentist.qualifications}</p>
        <p className="mb-4 text-blue-600">{siteConfig.dentist.experience}</p>
        <p>
          {siteConfig.dentist.bio}
        </p>
        <p>
          Committed to continuous education, {siteConfig.dentist.name} regularly updates their skills with the latest advancements in dental science to bring you the best care possible.
        </p>
      </div>
    </div>
  )
}
