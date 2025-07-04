'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import CartIcon from './CartIcon'
import { useCart } from '@/contexts/CartContext'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { t } = useLanguage()
  const { items } = useCart()

  const navigation = [
    { name: t('navigation.home'), href: '/' },
    { name: t('navigation.products'), href: '/products' },
    { name: t('navigation.categories'), href: '/categories' },
  ]

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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-black">
                Product System
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-black'
                        : 'border-transparent text-black hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {session ? (
              <div className="flex items-center space-x-4">
                {session.user?.role !== 'ADMIN' && <CartIcon />}
                <div className="flex items-center space-x-4">
                  <Link
                    href={session.user?.role === 'ADMIN' ? '/admin/profile' : '/profile'}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {t('auth.welcome')}, {session.user?.name || session.user?.email}
                  </Link>
                  {session.user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      {t('admin.dashboard') || 'Dashboard'}
                    </Link>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-sm text-black hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? t('common.loading') : t('auth.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <CartIcon />
                <Link
                  href="/login"
                  className="text-sm text-black hover:text-gray-700"
                >
                  {t('auth.login')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 