'use client'

import { signOut } from 'next-auth/react'
import { User } from 'next-auth'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AdminHeaderProps {
  user: User
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { t } = useLanguage()

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      console.log('Logging out, redirecting to login page')
      
      await signOut({ 
        redirect: false 
      })
      
      // Manually redirect to ensure correct port
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('admin.dashboard')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            {t('auth.welcome')}, {user.name || user.email}
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? t('common.loading') : t('auth.logout')}
          </button>
        </div>
      </div>
    </header>
  )
} 