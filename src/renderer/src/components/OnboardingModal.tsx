import { useState } from 'react'
import { SparklesIcon, FlameIcon, ArrowUpRightIcon } from './Icons'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: (humanName: string, hollowName: string) => void
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [humanName, setHumanName] = useState('')
  const [hollowName, setHollowName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedHuman = humanName.trim()
    const trimmedHollow = hollowName.trim()

    if (!trimmedHuman) {
      setError('Please enter your human study name')
      return
    }
    if (!trimmedHollow) {
      setError('Please enter your Hollow persona name')
      return
    }

    onComplete(trimmedHuman, trimmedHollow)
  }

  return (
    <div className="modal-backdrop onboarding-backdrop">
      <div className="modal-card onboarding-card">
        <div className="onboarding-brand-badge">
          <SparklesIcon size={18} color="var(--accent-primary)" />
          <span>WELCOME TO SWITCH</span>
        </div>

        <h2 className="onboarding-title">Awaken Your Dual Persona</h2>
        <p className="onboarding-subtitle">
          Switch is built around two identities: your calm, deep-focus <strong>Human self</strong>, and your relentless, unleashed <strong>Hollow persona</strong>.
        </p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-field-group">
            <label className="field-label">
              <span className="label-icon-dot human-dot" />
              <span>Human Name (Study & Focus)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Abid"
              value={humanName}
              onChange={(e) => {
                setHumanName(e.target.value)
                if (error) setError('')
              }}
              className="onboarding-input"
              autoFocus
            />
            <span className="field-hint">Your daylight identity for calm study sessions.</span>
          </div>

          <div className="input-field-group">
            <label className="field-label">
              <FlameIcon size={14} color="#ff1a40" />
              <span>Hollow Persona Name (Unleashed Mode)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Axsenor / Zangetsu"
              value={hollowName}
              onChange={(e) => {
                setHollowName(e.target.value)
                if (error) setError('')
              }}
              className="onboarding-input hollow-input"
            />
            <span className="field-hint">Your nocturnal, hyper-focus Hollow alter ego.</span>
          </div>

          {error && <p className="onboarding-error-msg">{error}</p>}

          <button type="submit" className="onboarding-submit-btn">
            <span>Enter Study Ecosystem</span>
            <ArrowUpRightIcon size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
