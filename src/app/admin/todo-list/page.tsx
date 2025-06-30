'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Todo {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  assignedTo?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
}

interface ValidationErrors {
  title?: string
  description?: string
  priority?: string
  dueDate?: string
}

export default function TodoListPage() {
  const { t } = useLanguage()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: ''
  })

  useEffect(() => {
    fetchTodos()
    getCurrentUserRole()
  }, [])

  const getCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/debug-session')
      if (response.ok) {
        const data = await response.json()
        if (data.session?.user?.role) {
          setCurrentUserRole(data.session.user.role)
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Title validation
    if (!newTodo.title.trim()) {
      newErrors.title = t('admin.validation.titleRequired')
    } else if (newTodo.title.trim().length < 3) {
      newErrors.title = t('admin.validation.titleMinLength')
    } else if (newTodo.title.trim().length > 100) {
      newErrors.title = t('admin.validation.titleMaxLength')
    }

    // Description validation
    if (newTodo.description && newTodo.description.length > 500) {
      newErrors.description = t('admin.validation.descriptionMaxLength')
    }

    // Due date validation
    if (newTodo.dueDate) {
      const selectedDate = new Date(newTodo.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.dueDate = t('admin.validation.dueDatePast')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearMessages = () => {
    setSuccessMessage('')
    setErrorMessage('')
    setErrors({})
  }

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.fetchError'))
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
      setErrorMessage(t('admin.messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      })

      if (response.ok) {
        const createdTodo = await response.json()
        setNewTodo({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: ''
        })
        setShowAddForm(false)
        setSuccessMessage(t('admin.messages.todoCreated'))
        fetchTodos()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.createError'))
      }
    } catch (error) {
      console.error('Error adding todo:', error)
      setErrorMessage(t('admin.messages.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleComplete = async (todoId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })

      if (response.ok) {
        fetchTodos()
        setSuccessMessage(t('admin.messages.todoUpdated'))
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.updateError'))
      }
    } catch (error) {
      console.error('Error updating todo:', error)
      setErrorMessage(t('admin.messages.updateError'))
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm(t('admin.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTodos()
        setSuccessMessage(t('admin.messages.todoDeleted'))
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.deleteError'))
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
      setErrorMessage(t('admin.messages.deleteError'))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.todoList')}</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            clearMessages()
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? t('common.cancel') : t('admin.addNew')}
        </button>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* Info message for non-admin users */}
      {currentUserRole && currentUserRole !== 'ADMIN' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">Note:</p>
          <p>You are logged in as a {currentUserRole.toLowerCase()}. You can create and manage todos.</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-6 text-gray-900">{t('admin.addTodo')}</h2>
          <form onSubmit={handleAddTodo} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.todoTitle')} *
              </label>
              <input
                type="text"
                required
                value={newTodo.title}
                onChange={(e) => {
                  setNewTodo({ ...newTodo, title: e.target.value })
                  if (errors.title) setErrors({ ...errors, title: undefined })
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base ${
                  errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter todo title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-2">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.todoDescription')}
              </label>
              <textarea
                value={newTodo.description}
                onChange={(e) => {
                  setNewTodo({ ...newTodo, description: e.target.value })
                  if (errors.description) setErrors({ ...errors, description: undefined })
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-base ${
                  errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                rows={4}
                placeholder="Enter todo description (optional)"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-2">{errors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.todoPriority')}
                </label>
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-base"
                >
                  <option value="LOW">{t('admin.priorityLow')}</option>
                  <option value="MEDIUM">{t('admin.priorityMedium')}</option>
                  <option value="HIGH">{t('admin.priorityHigh')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.todoDueDate')}
                </label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => {
                    setNewTodo({ ...newTodo, dueDate: e.target.value })
                    if (errors.dueDate) setErrors({ ...errors, dueDate: undefined })
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-base ${
                    errors.dueDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-2">{errors.dueDate}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  clearMessages()
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={submitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('admin.allTodos')}</h2>
          {todos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('admin.noTodos')}</p>
          ) : (
            <div className="space-y-4">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 border rounded-lg ${
                    todo.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() => handleToggleComplete(todo.id, todo.isCompleted)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mt-1 ${todo.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            todo.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            todo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {todo.priority === 'HIGH' ? '🔴 High' :
                             todo.priority === 'MEDIUM' ? '🟡 Medium' :
                             '🟢 Low'}
                          </span>
                          {todo.dueDate && (
                            <span className="flex items-center">
                              📅 Due: {formatDate(todo.dueDate)}
                            </span>
                          )}
                          {todo.assignee && (
                            <span className="flex items-center">
                              👤 Assigned to: {todo.assignee.name}
                            </span>
                          )}
                          <span className="flex items-center">
                            ✨ Created by: {todo.creator.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 