'use client'

import { signOut } from 'next-auth/react'
import { User } from 'next-auth'

interface AdminHeaderProps {
  user: User
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            Welcome, {user.name || user.email}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
} 