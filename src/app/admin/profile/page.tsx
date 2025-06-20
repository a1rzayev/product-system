'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else {
        // Fallback to session data if API fails
        if (session.user) {
          setProfile({
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: session.user.role || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Fallback to session data if API fails
      if (session.user) {
        setProfile({
          id: session.user.id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || ''
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchProfileData()
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchProfileData()
  }, [session, status, router, fetchProfileData])

  // Listen for profile updates from edit page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile-updated') {
        console.log('Profile update detected, refreshing data...')
        fetchProfileData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [fetchProfileData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="text-gray-600">{t('profile.subtitle')}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="text-gray-600">{t('profile.subtitle')}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600">Profile not found</p>
          </div>
        </div>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-red-100 text-red-800', label: 'Admin' },
      'CUSTOMER': { color: 'bg-blue-100 text-blue-800', label: 'Customer' },
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.CUSTOMER
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="text-gray-600">{t('profile.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/profile/edit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('profile.editProfile')}
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('profile.personalInfo')}</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-2xl font-medium text-white">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                {profile.name || 'No Name Set'}
              </h3>
              <p className="text-gray-600">{profile.email}</p>
              <div className="mt-2">
                {getRoleBadge(profile.role)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.name')}</label>
              <div className="bg-gray-50 px-3 py-2 rounded-md text-gray-900">
                {profile.name || 'Not provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.email')}</label>
              <div className="bg-gray-50 px-3 py-2 rounded-md text-gray-900">
                {profile.email}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
} 