'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface NotesPopupProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  currentNotes: string
  onSave: (notes: string) => Promise<void>
}

export default function NotesPopup({
  isOpen,
  onClose,
  productId,
  productName,
  currentNotes,
  onSave
}: NotesPopupProps) {
  const { t } = useLanguage()
  const [notes, setNotes] = useState(currentNotes)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNotes(currentNotes)
    setError('')
  }, [currentNotes, isOpen])

  const handleSave = async () => {
    if (saving) return
    
    setSaving(true)
    setError('')
    
    try {
      await onSave(notes)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(currentNotes)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">
              Edit Notes
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-black mt-1">
            {productName}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-black mb-2">
              Admin Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this product (only visible to admins)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
              rows={6}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Only visible to administrators
              </p>
              <p className="text-xs text-gray-500">
                {notes.length}/1000
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  )
} 