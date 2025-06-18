'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminUsersPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        <p className="text-gray-600">{t('users.noUsers')}</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('users.title')}</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <p>{t('users.noUsers')}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 