'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Todo {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  status: 'UNDONE' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  assignedTo?: string
  position: number
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
  role: string
}

interface ValidationErrors {
  title?: string
  description?: string
  priority?: string
  dueDate?: string
  assignedTo?: string
}

// Sortable Todo Item Component
function SortableTodoItem({ 
  todo, 
  onToggleComplete, 
  onStatusUpdate, 
  onDelete, 
  onStartEdit, 
  editingTodoId, 
  editingTodo, 
  setEditingTodo, 
  handleUpdateTodo, 
  handleCancelEdit, 
  submitting, 
  errors, 
  setErrors, 
  users, 
  getPriorityColor, 
  getStatusColor, 
  getStatusIcon, 
  formatDate, 
  t 
}: {
  todo: Todo
  onToggleComplete: (todoId: string, isCompleted: boolean) => void
  onStatusUpdate: (todoId: string, newStatus: 'UNDONE' | 'IN_PROGRESS' | 'DONE') => void
  onDelete: (todoId: string) => void
  onStartEdit: (todo: Todo) => void
  editingTodoId: string | null
  editingTodo: any
  setEditingTodo: (todo: any) => void
  handleUpdateTodo: (e: React.FormEvent) => void
  handleCancelEdit: () => void
  submitting: boolean
  errors: ValidationErrors
  setErrors: (errors: ValidationErrors) => void
  users: User[]
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => string
  formatDate: (dateString: string) => string
  t: (key: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-6 border rounded-lg transition-all duration-200 cursor-move ${
        todo.isCompleted 
          ? 'bg-gray-50 border-gray-200 opacity-75' 
          : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
      }`}
    >
      {editingTodoId === todo.id ? (
        // Edit Form
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-black">{t('admin.editTodo')}</h3>
          <form onSubmit={handleUpdateTodo} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.todoTitle')} *
              </label>
              <input
                type="text"
                required
                value={editingTodo.title}
                onChange={(e) => {
                  setEditingTodo({ ...editingTodo, title: e.target.value })
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
                value={editingTodo.description}
                onChange={(e) => {
                  setEditingTodo({ ...editingTodo, description: e.target.value })
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.todoPriority')}
                </label>
                <select
                  value={editingTodo.priority}
                  onChange={(e) => setEditingTodo({ ...editingTodo, priority: e.target.value as any })}
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
                  value={editingTodo.dueDate}
                  onChange={(e) => {
                    setEditingTodo({ ...editingTodo, dueDate: e.target.value })
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To (Admin Only) *
                </label>
                <select
                  value={editingTodo.assignedTo}
                  onChange={(e) => {
                    setEditingTodo({ ...editingTodo, assignedTo: e.target.value })
                    if (errors.assignedTo) setErrors({ ...errors, assignedTo: undefined })
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-base ${
                    errors.assignedTo ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an admin</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <p className="text-red-500 text-sm mt-2">{errors.assignedTo}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancelEdit}
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
                {submitting ? 'Updating...' : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Normal Todo Display
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0 mt-1">
              <div 
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-move"
                title={t('admin.dragAndDrop.dragToReorder')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-medium mb-2 ${
                todo.isCompleted ? 'line-through text-gray-500' : 'text-black'
              }`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={`text-base mb-3 ${
                  todo.isCompleted ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {todo.description}
                </p>
              )}
              <div className="flex items-center space-x-6 text-sm">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(todo.status || 'UNDONE')}`}>
                  {getStatusIcon(todo.status || 'UNDONE')} {(todo.status || 'UNDONE').replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  todo.priority === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' :
                  todo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {todo.priority === 'HIGH' ? '🔴 High' :
                   todo.priority === 'MEDIUM' ? '🟡 Medium' :
                   '🟢 Low'}
                </span>
                {todo.dueDate && (
                  <span className="flex items-center text-black">
                    📅 Due: {formatDate(todo.dueDate)}
                  </span>
                )}
                {todo.assignee && (
                  <span className="flex items-center text-black">
                    👤 Assigned to: {todo.assignee.name}
                  </span>
                )}
                <span className="flex items-center text-black">
                  ✨ Created by: {todo.creator.name}
                </span>
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-black">Status:</label>
                  <select
                    value={todo.status || 'UNDONE'}
                    onChange={(e) => onStatusUpdate(todo.id, e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  >
                    <option value="UNDONE">⏳ Undone</option>
                    <option value="IN_PROGRESS">🔄 In Progress</option>
                    <option value="DONE">✅ Done</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onStartEdit(todo)}
              className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
              title="Edit todo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
              title="Delete todo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TodoListPage() {
  const { t } = useLanguage()
  const [todos, setTodos] = useState<Todo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingTodo, setEditingTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: '',
    assignedTo: ''
  })
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignedTo: ''
  })
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dueDate: '',
    assignedTo: '',
    search: ''
  })

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchTodos()
    fetchUsers()
    getCurrentUserRole()
  }, [])

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = todos.findIndex(todo => todo.id === active.id)
      const newIndex = todos.findIndex(todo => todo.id === over?.id)

      const newTodos = arrayMove(todos, oldIndex, newIndex)
      setTodos(newTodos)

      // Send the new order to the server
      try {
        const response = await fetch('/api/todos/reorder', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            todoIds: newTodos.map(todo => todo.id)
          }),
        })

        if (response.ok) {
          setSuccessMessage(t('admin.messages.reorderSuccess'))
        } else {
          console.error('Failed to reorder todos')
          setErrorMessage(t('admin.messages.reorderError'))
          // Revert the order if the server request failed
          fetchTodos()
        }
      } catch (error) {
        console.error('Error reordering todos:', error)
        setErrorMessage(t('admin.messages.reorderError'))
        // Revert the order if the server request failed
        fetchTodos()
      }
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=ADMIN')
      if (response.ok) {
        const data = await response.json()
        const usersData = data.data || data
        console.log('Fetched users:', usersData)
        
        // Double-check: filter to only show admin users on frontend
        const adminUsers = usersData.filter((user: User) => user.role === 'ADMIN')
        console.log('Filtered admin users:', adminUsers)
        
        setUsers(adminUsers)
      } else {
        console.error('Error fetching users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

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

    // Assign to validation
    if (!newTodo.assignedTo.trim()) {
      newErrors.assignedTo = t('admin.validation.assignedToRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearMessages = () => {
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

    // Set due date to today if not chosen
    const todoData = {
      ...newTodo,
      dueDate: newTodo.dueDate || new Date().toISOString().split('T')[0]
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      })

      if (response.ok) {
        const createdTodo = await response.json()
        setNewTodo({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          assignedTo: ''
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
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.updateError'))
      }
    } catch (error) {
      console.error('Error updating todo:', error)
      setErrorMessage(t('admin.messages.updateError'))
    }
  }

  const handleStatusUpdate = async (todoId: string, newStatus: 'UNDONE' | 'IN_PROGRESS' | 'DONE') => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTodos()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.updateError'))
      }
    } catch (error) {
      console.error('Error updating todo status:', error)
      setErrorMessage(t('admin.messages.updateError'))
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm(t('admin.messages.confirmDelete'))) {
      return
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccessMessage(t('admin.messages.todoDeleted'))
        fetchTodos()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.deleteError'))
      }
    } catch (error) {
      console.error('Error deleting todo:', error)
      setErrorMessage(t('admin.messages.deleteError'))
    }
  }

  const handleStartEdit = (todo: Todo) => {
    setEditingTodoId(todo.id)
    setEditingTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      assignedTo: todo.assignedTo || ''
    })
    setErrors({})
  }

  const handleCancelEdit = () => {
    setEditingTodoId(null)
    setEditingTodo({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignedTo: ''
    })
    setErrors({})
  }

  const validateEditForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Title validation
    if (!editingTodo.title.trim()) {
      newErrors.title = t('admin.validation.titleRequired')
    } else if (editingTodo.title.trim().length < 3) {
      newErrors.title = t('admin.validation.titleMinLength')
    } else if (editingTodo.title.trim().length > 100) {
      newErrors.title = t('admin.validation.titleMaxLength')
    }

    // Description validation
    if (editingTodo.description && editingTodo.description.length > 500) {
      newErrors.description = t('admin.validation.descriptionMaxLength')
    }

    // Due date validation
    if (editingTodo.dueDate) {
      const selectedDate = new Date(editingTodo.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.dueDate = t('admin.validation.dueDatePast')
      }
    }

    // Assign to validation
    if (!editingTodo.assignedTo.trim()) {
      newErrors.assignedTo = t('admin.validation.assignedToRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (!validateEditForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/todos/${editingTodoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTodo),
      })

      if (response.ok) {
        setEditingTodoId(null)
        setEditingTodo({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          assignedTo: ''
        })
        setSuccessMessage(t('admin.messages.todoUpdated'))
        fetchTodos()
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.error || t('admin.messages.updateError'))
      }
    } catch (error) {
      console.error('Error updating todo:', error)
      setErrorMessage(t('admin.messages.updateError'))
    } finally {
      setSubmitting(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'UNDONE':
        return 'bg-gray-100 text-gray-800 border border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return '✅'
      case 'IN_PROGRESS':
        return '🔄'
      case 'UNDONE':
        return '⏳'
      default:
        return '⏳'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getFilteredTodos = () => {
    return todos.filter(todo => {
      // Search filter
      if (filters.search && !todo.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !(todo.description && todo.description.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false
      }

      // Status filter
      if (filters.status && todo.status !== filters.status) {
        return false
      }

      // Priority filter
      if (filters.priority && todo.priority !== filters.priority) {
        return false
      }

      // Due date filter
      if (filters.dueDate) {
        const todoDate = todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : null
        if (todoDate !== filters.dueDate) {
          return false
        }
      }

      // Assigned to filter
      if (filters.assignedTo && todo.assignedTo !== filters.assignedTo) {
        return false
      }

      return true
    })
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dueDate: '',
      assignedTo: '',
      search: ''
    })
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
        <h1 className="text-2xl font-bold text-black">{t('admin.todoList')}</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            clearMessages()
          }}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showAddForm ? t('common.cancel') : t('admin.addNew')}
        </button>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Info message for non-admin users */}
      {currentUserRole && currentUserRole !== 'ADMIN' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Note:</p>
          <p>You are logged in as a {currentUserRole.toLowerCase()}. You can create and manage todos.</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-6 text-black">{t('admin.addTodo')}</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-gray-500 text-sm mt-1">Leave empty to set as today</p>
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-2">{errors.dueDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To (Admin Only) *
                </label>
                <select
                  value={newTodo.assignedTo}
                  onChange={(e) => {
                    setNewTodo({ ...newTodo, assignedTo: e.target.value })
                    if (errors.assignedTo) setErrors({ ...errors, assignedTo: undefined })
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-base ${
                    errors.assignedTo ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an admin</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && (
                  <p className="text-red-500 text-sm mt-2">{errors.assignedTo}</p>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6 text-black">{t('admin.allTodos')}</h2>
          
          {/* Filters Section */}
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Clear all filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search todos..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="">All Status</option>
                  <option value="UNDONE">⏳ Undone</option>
                  <option value="IN_PROGRESS">🔄 In Progress</option>
                  <option value="DONE">✅ Done</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              {/* Due Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={filters.dueDate}
                  onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>

              {/* Assigned To Filter */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Assigned To
                </label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {Object.values(filters).some(filter => filter !== '') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-900 border border-blue-200 font-medium">
                      Search: "{filters.search}"
                      <button
                        onClick={() => setFilters({ ...filters, search: '' })}
                        className="ml-2 text-blue-700 hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.status && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-green-100 text-green-900 border border-green-200 font-medium">
                      Status: {filters.status.replace('_', ' ')}
                      <button
                        onClick={() => setFilters({ ...filters, status: '' })}
                        className="ml-2 text-green-700 hover:text-green-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.priority && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-yellow-100 text-yellow-900 border border-yellow-200 font-medium">
                      Priority: {filters.priority}
                      <button
                        onClick={() => setFilters({ ...filters, priority: '' })}
                        className="ml-2 text-yellow-700 hover:text-yellow-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.dueDate && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-purple-100 text-purple-900 border border-purple-200 font-medium">
                      Due: {formatDate(filters.dueDate)}
                      <button
                        onClick={() => setFilters({ ...filters, dueDate: '' })}
                        className="ml-2 text-purple-700 hover:text-purple-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.assignedTo && (
                    <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-orange-100 text-orange-900 border border-orange-200 font-medium">
                      Assigned: {users.find(u => u.id === filters.assignedTo)?.name || 'Unknown'}
                      <button
                        onClick={() => setFilters({ ...filters, assignedTo: '' })}
                        className="ml-2 text-orange-700 hover:text-orange-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {todos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black text-lg mb-2 font-medium">No todos found</p>
              <p className="text-gray-600">Create your first todo to get started!</p>
            </div>
          ) : getFilteredTodos().length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black text-lg mb-2 font-medium">No todos match your filters</p>
              <p className="text-gray-600 mb-4">Try adjusting your filters or clear them to see all todos</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={getFilteredTodos().map(todo => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  <div className="text-sm text-black font-medium mb-4">
                    Showing {getFilteredTodos().length} of {todos.length} todos
                  </div>
                  {getFilteredTodos().map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggleComplete={handleToggleComplete}
                      onStatusUpdate={handleStatusUpdate}
                      onDelete={handleDeleteTodo}
                      onStartEdit={handleStartEdit}
                      editingTodoId={editingTodoId}
                      editingTodo={editingTodo}
                      setEditingTodo={setEditingTodo}
                      handleUpdateTodo={handleUpdateTodo}
                      handleCancelEdit={handleCancelEdit}
                      submitting={submitting}
                      errors={errors}
                      setErrors={setErrors}
                      users={users}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                      formatDate={formatDate}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
} 