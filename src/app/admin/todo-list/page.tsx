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

interface User {
  id: string
  name: string
  email: string
}

export default function TodoListPage() {
  const { t } = useLanguage()
  const [todos, setTodos] = useState<Todo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignedTo: ''
  })

  useEffect(() => {
    fetchTodos()
    fetchUsers()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await fetch('/api/users?role=ADMIN')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      } else {
        console.error('Failed to fetch users:', response.status)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      })

      if (response.ok) {
        setNewTodo({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          assignedTo: ''
        })
        setShowAddForm(false)
        fetchTodos()
      }
    } catch (error) {
      console.error('Error adding todo:', error)
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
      }
    } catch (error) {
      console.error('Error updating todo:', error)
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
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
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
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? t('common.cancel') : t('admin.addNew')}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">{t('admin.addTodo')}</h2>
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.todoTitle')} *
              </label>
              <input
                type="text"
                required
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.todoDescription')}
              </label>
              <textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.todoPriority')}
                </label>
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">{t('admin.priorityLow')}</option>
                  <option value="MEDIUM">{t('admin.priorityMedium')}</option>
                  <option value="HIGH">{t('admin.priorityHigh')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.todoDueDate')}
                </label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.todoAssignedTo')}
                </label>
                <select
                  value={newTodo.assignedTo}
                  onChange={(e) => setNewTodo({ ...newTodo, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={usersLoading}
                >
                  <option value="">{usersLoading ? t('common.loading') : t('admin.selectUser')}</option>
                  {Array.isArray(users) && users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('common.save')}
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                            {todo.priority}
                          </span>
                          {todo.dueDate && (
                            <span>Due: {formatDate(todo.dueDate)}</span>
                          )}
                          {todo.assignee && (
                            <span>Assigned to: {todo.assignee.name}</span>
                          )}
                          <span>Created by: {todo.creator.name}</span>
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