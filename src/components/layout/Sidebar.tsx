'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Inbox, ClipboardList, CreditCard, BarChart3, Database, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/config/site'

const navigation = [
  { name: 'Today', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/dashboard/patients', icon: Users },
  { name: 'Calendar', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Treatment', href: '/dashboard/treatments', icon: ClipboardList },
  { name: 'Money', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Insights', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ onMobileNavigate }: { onMobileNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full md:w-64 flex-col border-r bg-white">
      <div className="flex h-16 shrink-0 items-center gap-2 px-6 border-b">
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image 
            src={siteConfig.media.logo} 
            alt="Logo" 
            fill
            className="object-contain"
          />
        </div>
        <span className="text-lg font-bold text-blue-900 tracking-tight truncate">Clinic OS</span>
      </div>
      
      <div className="p-4 border-b">
        <Link
          href="/dashboard/walk-in"
          onClick={onMobileNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <span className="text-lg font-bold tracking-wider">WALK-IN</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileNavigate}
                className={cn(
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
