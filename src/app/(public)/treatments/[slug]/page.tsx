import { notFound } from 'next/navigation'
import { treatments } from '@/config/site'
import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params
  const treatment = treatments.find(t => t.slug === p.slug)
  if (!treatment) return {}

  return {
    title: `${treatment.name} - Smile Dental Clinic`,
    description: treatment.description,
  }
}

export function generateStaticParams() {
  return treatments.map(t => ({
    slug: t.slug,
  }))
}

export default async function TreatmentDetailPage({ params }: Props) {
  const p = await params
  const treatment = treatments.find(t => t.slug === p.slug)
  
  if (!treatment) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/treatments" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline mb-8">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to all treatments
      </Link>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
        {treatment.name}
      </h1>
      
      <div className="prose prose-lg prose-blue max-w-none text-gray-700 mb-12">
        <p className="text-xl leading-relaxed text-gray-600 mb-8 font-medium">
          {treatment.shortDescription}
        </p>
        <p className="leading-relaxed">
          {treatment.description}
        </p>
        {/* Placeholder for rich structured content if it existed */}
        <p className="mt-8 p-6 bg-blue-50 rounded-xl text-blue-900">
          <strong>Note:</strong> Treatment details and timelines vary per patient. A comprehensive consultation is required before beginning any restorative or cosmetic procedure.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm ring-1 ring-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book your {treatment.name.toLowerCase()} consultation</h2>
        <p className="text-gray-600 mb-8">Our specialists are ready to help you achieve your best smile.</p>
        <Link 
          href={`/book?reason=${encodeURIComponent(treatment.name)}`}
          className="inline-flex justify-center items-center rounded-full bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Calendar className="w-6 h-6 mr-2" />
          Book Appointment
        </Link>
      </div>
    </div>
  )
}
