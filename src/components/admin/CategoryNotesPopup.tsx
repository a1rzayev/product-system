'use client'

import { useState } from 'react'
import { X, Save, Edit3 } from 'lucide-react'

interface CategoryNotesPopupProps {
  isOpen: boolean
  onClose: () => void
  categoryId: string
  categoryName: string
  currentNotes?: string
  onSave: (notes: string) => Promise<void>
  onDelete?: (categoryId: string) => Promise<void>
}

export default function CategoryNotesPopup({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  currentNotes = '',
  onSave,
  onDelete
}: CategoryNotesPopupProps) {
  const [notes, setNotes] = useState(currentNotes)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(notes)
      onClose()
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setNotes(currentNotes) // Reset to original value
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-black">
            <Edit3 className="w-5 h-5" />
            Category Notes
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-black mb-2">
            Category: <span className="font-medium">{categoryName}</span>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">
            Notes
          </label>
          <textarea
            value={notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes or comments about this category..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 