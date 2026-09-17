'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Inbox, ClipboardList, CreditCard, BarChart3, Database, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Booking Requests', href: '/dashboard/requests', icon: Inbox },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Patients', href: '/dashboard/patients', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Treatment Plans', href: '/dashboard/treatments', icon: ClipboardList },
  { name: 'Historical Data', href: '/dashboard/migration', icon: Database },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <span className="text-xl font-semibold text-blue-900">Smile Dental</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
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
