'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { User } from '@/types'

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [roleStats, setRoleStats] = useState({
    ADMIN: 0,
    USER: 0,
    CUSTOMER: 0,
    TOTAL: 0
  })

  const fetchUsers = useCallback(async (role?: string) => {
    try {
      const roleParam = role && role !== 'ALL' ? `&role=${role}` : ''
      const response = await fetch(`/api/users?page=1&limit=50${roleParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const result = await response.json()
      setUsers(result.data || [])
      setTotalUsers(result.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoleStats = useCallback(async () => {
    try {
      const [adminResponse, userResponse, customerResponse, totalResponse] = await Promise.all([
        fetch('/api/users?role=ADMIN&page=1&limit=1'),
        fetch('/api/users?role=USER&page=1&limit=1'),
        fetch('/api/users?role=CUSTOMER&page=1&limit=1'),
        fetch('/api/users?page=1&limit=1')
      ])

      const [adminData, userData, customerData, totalData] = await Promise.all([
        adminResponse.json(),
        userResponse.json(),
        customerResponse.json(),
        totalResponse.json()
      ])

      setRoleStats({
        ADMIN: adminData.pagination?.total || 0,
        USER: userData.pagination?.total || 0,
        CUSTOMER: customerData.pagination?.total || 0,
        TOTAL: totalData.pagination?.total || 0
      })
    } catch (error) {
      console.error('Error fetching role stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchRoleStats()
  }, [fetchUsers, fetchRoleStats])

  const exportToExcel = async () => {
    setExporting(true)
    try {
      // Use the current filter for export
      const roleParam = selectedRole !== 'ALL' ? `&role=${selectedRole}` : ''
      
      // First, check if we have a large dataset
      const response = await fetch(`/api/users?page=1&limit=1${roleParam}`)
      if (!response.ok) {
        throw new Error('Failed to check user count')
      }
      const result = await response.json()
      const totalUsers = result.pagination?.total || 0

      let allUsers: any[] = []

      if (totalUsers > 1000) {
        // For large datasets, use the optimized endpoint
        const exportResponse = await fetch('/api/users?action=export-large', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole !== 'ALL' ? selectedRole : undefined })
        })
        
        if (!exportResponse.ok) {
          const errorData = await exportResponse.json()
          if (exportResponse.status === 413) {
            alert(`Export failed: ${errorData.message}`)
            return
          }
          throw new Error('Failed to export large dataset')
        }
        
        const exportResult = await exportResponse.json()
        allUsers = exportResult.data
      } else {
        const response = await fetch(`/api/users?page=1&limit=5000${roleParam}`)
        if (!response.ok) {
          throw new Error('Failed to fetch users for export')
        }
        const result = await response.json()
        allUsers = result.data || []
      }

      // Prepare data for Excel
      const excelData = allUsers.map((user: any) => ({
        'User ID': user.id,
        'Name': user.name || 'No Name',
        'Email': user.email,
        'Role': user.role,
        'Orders Count': user._count?.orders || 0,
        'Created At': new Date(user.createdAt).toLocaleDateString(),
        'Updated At': new Date(user.updatedAt).toLocaleDateString()
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 36 }, // User ID
        { wch: 30 }, // Name
        { wch: 35 }, // Email
        { wch: 15 }, // Role
        { wch: 15 }, // Orders Count
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

      // Generate filename with current date and filter
      const date = new Date().toISOString().split('T')[0]
      const filterSuffix = selectedRole !== 'ALL' ? `_${selectedRole.toLowerCase()}` : ''
      const filename = `users_export_${date}${filterSuffix}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, filename)

      // Show success message
      alert(`Successfully exported ${allUsers.length} users to Excel!`)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export users to Excel')
    } finally {
      setExporting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-red-100 text-red-800', label: 'Admin' },
      'USER': { color: 'bg-blue-100 text-blue-800', label: 'User' },
      'CUSTOMER': { color: 'bg-blue-100 text-blue-800', label: 'Customer' },
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
            <p className="text-gray-600">{t('users.subtitle') || 'Manage user accounts'}</p>
          </div>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
          <p className="text-gray-600">{t('users.subtitle') || 'Manage user accounts'}</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('users.exporting') || 'Exporting...'}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('users.exportToExcel') || 'Export to Excel'}</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{t('users.title')}</h2>
              <p className="text-sm text-gray-600">
                {totalUsers} {t('users.title').toLowerCase()} {t('common.total')}
              </p>
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value)
                    fetchUsers(e.target.value)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="ALL">All Users ({roleStats.TOTAL})</option>
                  <option value="ADMIN">Admins ({roleStats.ADMIN})</option>
                  <option value="USER">Users ({roleStats.USER})</option>
                  <option value="CUSTOMER">Customers ({roleStats.CUSTOMER})</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Role Statistics */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">{roleStats.ADMIN}</div>
              <div className="text-sm text-red-700">Admins</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{roleStats.USER}</div>
              <div className="text-sm text-blue-700">Users</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{roleStats.CUSTOMER}</div>
              <div className="text-sm text-green-700">Customers</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-600">{roleStats.TOTAL}</div>
              <div className="text-sm text-gray-700">Total</div>
            </div>
          </div>
        </div>
        
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count?.orders || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('users.noUsers')}</h3>
            <p className="text-gray-500">
              {t('users.noUsersDescription') || 'No users have registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 