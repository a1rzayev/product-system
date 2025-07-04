'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [detectedRole, setDetectedRole] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { t } = useLanguage()

  // Get redirect URL from query parameters
  const redirectUrl = searchParams.get('redirect') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Already authenticated, redirecting...')
      if (session.user.role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (session.user.role === 'CUSTOMER') {
        window.location.href = '/customer'
      } else {
        window.location.href = redirectUrl
      }
    }
  }, [session, status, redirectUrl])

  // Check for error parameter from URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'unauthorized') {
      setError(t('errors.unauthorized'))
    }
  }, [searchParams, t])

  // Don't render the form if already authenticated
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const detectUserRole = (email: string) => {
    // Simple role detection based on email patterns
    // You can customize this logic based on your needs
    if (email.includes('admin') || email.includes('system')) {
      return 'ADMIN'
    } else if (email.includes('customer') || email.includes('seller') || email.includes('vendor')) {
      return 'CUSTOMER'
    }
    return null
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setEmail(email)
    
    // Detect role based on email
    if (email) {
      const role = detectUserRole(email.toLowerCase())
      setDetectedRole(role)
    } else {
      setDetectedRole(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return
    
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.invalidCredentials'))
      } else {
        const session = await getSession()
        if (session?.user) {
          setIsRedirecting(true)
          // Redirect based on user role or redirect URL
          if (session.user.role === 'ADMIN') {
            window.location.href = '/admin'
          } else if (session.user.role === 'CUSTOMER') {
            window.location.href = '/customer'
          } else {
            window.location.href = redirectUrl
          }
        } else {
          setError(t('errors.somethingWentWrong'))
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(t('errors.somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-black">
            {t('auth.signInToAccount')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
              />
            </div>
            
            {/* Role Detection Display */}
            {detectedRole && (
              <div className={`p-3 rounded-md border ${
                detectedRole === 'ADMIN' 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : detectedRole === 'CUSTOMER'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-2 ${
                    detectedRole === 'ADMIN' 
                      ? 'bg-red-500' 
                      : detectedRole === 'CUSTOMER'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {detectedRole === 'ADMIN' 
                      ? '🔧 Admin Panel Access' 
                      : detectedRole === 'CUSTOMER'
                      ? '🛍️ Customer Panel Access'
                      : '👤 Regular User Access'
                    }
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-75">
                  {detectedRole === 'ADMIN' 
                    ? 'You will be redirected to the admin dashboard after login.'
                    : detectedRole === 'CUSTOMER'
                    ? 'You will be redirected to the customer panel after login.'
                    : 'You will be redirected to the main site after login.'
                  }
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || isRedirecting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? t('common.loading') : isRedirecting ? t('common.loading') : t('auth.signIn')}
            </button>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('register.createAccount')}
              </Link>
            </p>
            
            {/* Role-specific links */}
            {detectedRole && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Quick Access:</p>
                <div className="flex justify-center space-x-4">
                  {detectedRole === 'CUSTOMER' && (
                    <Link
                      href="/customer"
                      className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                    >
                      🛍️ Customer Panel
                    </Link>
                  )}
                  {detectedRole === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-xs text-red-600 hover:text-red-500 font-medium"
                    >
                      🔧 Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="text-xs text-gray-600 hover:text-gray-500 font-medium"
                  >
                    🏠 Main Site
                  </Link>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
} 