import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { Phone, Calendar } from 'lucide-react'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Banner (Optional for contact info) */}
      <div className="bg-blue-900 text-blue-50 py-2 px-4 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {siteConfig.phone}</span>
          </div>
          <div className="hidden sm:block">
            {siteConfig.address}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-40 sm:w-48">
                <Image 
                  src={siteConfig.media.logo} 
                  alt={siteConfig.name} 
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            <nav className="hidden md:flex gap-6 items-center">
              <Link href="/treatments" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Treatments</Link>
              <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Contact</Link>
              <Link href="/faq" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">FAQ</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link 
                href="/book" 
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
              >
                <Calendar className="w-4 h-4 mr-2 hidden sm:block" />
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="relative h-12 w-48 bg-white rounded p-2 inline-block">
              <Image 
                src={siteConfig.media.logo} 
                alt={siteConfig.name} 
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{siteConfig.description}</p>
            <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors">Clinic Staff Login</Link>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/treatments" className="hover:text-white transition-colors">Treatments</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>{siteConfig.phone}</li>
              <li>{siteConfig.email}</li>
              <li className="pt-2">{siteConfig.address}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Hours</h4>
            <ul className="space-y-2 text-sm">
              {siteConfig.operatingHours.map((h, i) => (
                <li key={i} className="flex justify-between">
                  <span>{h.day}</span>
                  <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-xs text-center text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
