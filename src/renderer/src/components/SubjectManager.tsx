import { useState } from 'react'
import { Subject, StudySession } from '../types'
import { PlusIcon, TrashIcon, CloseIcon, CheckIcon, BookOpenIcon } from './Icons'

interface SubjectManagerProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void
  selectedSubjectId: string
  onSelectSubject: (id: string) => void
  sessions: StudySession[]
}

const PRESET_COLORS = [
  '#c6ff00', // Electric Lime
  '#ff782d', // Solar Orange
  '#38bdf8', // Sky Cyan
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#eab308', // Amber Gold
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1'  // Indigo
]

export function SubjectManager({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  onDeleteSubject,
  selectedSubjectId,
  onSelectSubject,
  sessions
}: SubjectManagerProps) {
  const [newSubjectName, setNewSubjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSubjectName.trim()
    if (!trimmed) {
      setError('Please enter a subject name')
      return
    }
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A subject with this name already exists')
      return
    }
    onAddSubject(trimmed, selectedColor)
    setNewSubjectName('')
    setError('')
  }

  const getSubjectMinutes = (subjectId: string) => {
    return sessions
      .filter((s) => s.subjectId === subjectId)
      .reduce((acc, s) => acc + s.durationMinutes, 0)
  }

  const formatHours = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const hrs = (mins / 60).toFixed(1)
    return `${hrs}h`
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card subject-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpenIcon size={20} color="var(--accent-primary)" />
            <div>
              <h2 className="modal-title">Manage Study Subjects</h2>
              <p className="modal-subtitle">Organize your courses and study targets</p>
            </div>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Add Subject Input Form */}
        <form onSubmit={handleCreate} className="add-subject-form">
          <div className="form-input-row">
            <input
              type="text"
              placeholder="e.g. Linear Algebra, Computer Science, Literature..."
              value={newSubjectName}
              onChange={(e) => {
                setNewSubjectName(e.target.value)
                if (error) setError('')
              }}
              className="text-input"
              autoFocus
            />
            <button type="submit" className="add-subject-submit-btn">
              <PlusIcon size={16} />
              <span>Add</span>
            </button>
          </div>

          {/* Color palette selector */}
          <div className="color-palette-row">
            <span className="color-palette-label">Tag Color:</span>
            <div className="color-dots">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-dot-choice ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <CheckIcon size={12} color="#000000" />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="form-error-msg">{error}</p>}
        </form>

        {/* Existing Subjects List */}
        <div className="subjects-list-wrap">
          <h3 className="section-label">Your Subjects ({subjects.length})</h3>
          {subjects.length === 0 ? (
            <div className="empty-sub-state">
              <p>No subjects added yet. Create your first subject above!</p>
            </div>
          ) : (
            <div className="subjects-grid">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId
                const totalMins = getSubjectMinutes(sub.id)

                return (
                  <div
                    key={sub.id}
                    className={`subject-card-item ${isSelected ? 'active-target' : ''}`}
                    onClick={() => onSelectSubject(sub.id)}
                  >
                    <div className="subject-card-left">
                      <span className="subject-color-badge" style={{ backgroundColor: sub.color }} />
                      <div className="subject-info-col">
                        <span className="subject-name">{sub.name}</span>
                        <span className="subject-stats-pill">
                          {isSelected && <span className="active-tag-inline">Active &bull; </span>}
                          {formatHours(totalMins)} studied
                        </span>
                      </div>
                    </div>

                    <div className="subject-card-actions" onClick={(e) => e.stopPropagation()}>
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          className="subject-delete-btn"
                          onClick={() => onDeleteSubject(sub.id)}
                          title={`Delete ${sub.name}`}
                        >
                          <TrashIcon size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
