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

interface FormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function EditUserProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        const userProfile = data.user
        setProfile(userProfile)
        setFormData({
          name: userProfile.name || '',
          email: userProfile.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        // Fallback to session data if API fails
        if (session.user) {
          const userProfile = {
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: session.user.role || ''
          }
          setProfile(userProfile)
          setFormData({
            name: userProfile.name,
            email: userProfile.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Fallback to session data if API fails
      if (session.user) {
        const userProfile = {
          id: session.user.id || '',
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role || ''
        }
        setProfile(userProfile)
        setFormData({
          name: userProfile.name,
          email: userProfile.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    fetchProfileData()
  }, [session, status, router, fetchProfileData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    console.log('Submitting form data:', {
      name: formData.name,
      email: formData.email,
      hasCurrentPassword: !!formData.currentPassword,
      hasNewPassword: !!formData.newPassword
    })

    // Basic validation for name and email
    if (!formData.name.trim()) {
      setError(t('profile.nameRequired') || 'Name is required')
      return
    }

    if (!formData.email.trim()) {
      setError(t('profile.emailRequired') || 'Email is required')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError(t('profile.invalidEmail') || 'Invalid email format')
      return
    }

    // Enhanced password validation
    if (formData.newPassword || formData.confirmPassword) {
      // Current password is required when changing password
      if (!formData.currentPassword) {
        setError(t('profile.currentPasswordRequired'))
        return
      }

      // New password is required when confirm password is provided
      if (!formData.newPassword) {
        setError(t('profile.newPasswordRequired') || 'New password is required')
        return
      }

      // Confirm password is required when new password is provided
      if (!formData.confirmPassword) {
        setError(t('profile.confirmPasswordRequired') || 'Please confirm your new password')
        return
      }

      // Passwords must match
      if (formData.newPassword !== formData.confirmPassword) {
        setError(t('profile.passwordsDoNotMatch'))
        return
      }

      // Password length validation
      if (formData.newPassword.length < 6) {
        setError(t('profile.passwordTooShort'))
        return
      }

      // Additional password strength validation
      if (formData.newPassword.length > 128) {
        setError(t('profile.passwordTooLong') || 'Password must be less than 128 characters')
        return
      }

      // Check if new password is different from current password
      if (formData.newPassword === formData.currentPassword) {
        setError(t('profile.newPasswordSameAsCurrent') || 'New password must be different from current password')
        return
      }
    }

    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      const responseData = await response.json()
      console.log('API response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile')
      }

      setSuccess(t('profile.profileUpdated'))
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      // Update session with new data
      if (session?.user) {
        try {
          await update({
            ...session,
            user: {
              ...session.user,
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase()
            }
          })
          console.log('Session updated successfully')
        } catch (updateError) {
          console.error('Failed to update session:', updateError)
        }
      }

      // Refresh profile data to show updated information
      await fetchProfileData()

      // Trigger profile page refresh by setting localStorage
      localStorage.setItem('profile-updated', Date.now().toString())
      
      // Also trigger the event for the current window
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'profile-updated',
        newValue: Date.now().toString()
      }))

    } catch (error) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.editTitle')}</h1>
            <p className="text-gray-600">{t('profile.editSubtitle')}</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.editTitle')}</h1>
            <p className="text-gray-600">{t('profile.editSubtitle')}</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600">Profile not found</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('profile.editTitle')}</h1>
              <p className="text-gray-600">{t('profile.editSubtitle')}</p>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('profile.backToProfile')}
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('profile.accountInfo')}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.changePassword')}</h3>
                <p className="text-sm text-gray-600 mb-4">{t('profile.passwordChangeNote')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.currentPassword')}
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.newPassword')}
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/profile"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('common.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 