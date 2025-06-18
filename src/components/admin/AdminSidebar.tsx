'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { addLanguageToPathname } from '@/lib/i18n'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { t, language } = useLanguage()

  const navigation = [
    { name: t('admin.dashboard'), href: addLanguageToPathname('/admin', language), icon: '📊' },
    { name: t('admin.products'), href: addLanguageToPathname('/admin/products', language), icon: '📦' },
    { name: t('admin.categories'), href: addLanguageToPathname('/admin/categories', language), icon: '🏷️' },
    { name: t('admin.orders'), href: addLanguageToPathname('/admin/orders', language), icon: '📋' },
    { name: t('admin.users'), href: addLanguageToPathname('/admin/users', language), icon: '👥' },
  ]

  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 