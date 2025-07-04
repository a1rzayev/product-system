'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CustomerHeader() {
  const { data: session } = useSession()
  const { t } = useLanguage()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/customer" className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Customer Panel
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              View Store
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-700">
                Welcome, {session?.user?.name || session?.user?.email}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 