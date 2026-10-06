import { useState, useEffect, useRef } from 'react'
import { Subject } from '../types'
import { PlayIcon, PauseIcon, RefreshIcon, BookOpenIcon } from './Icons'
import { playStudyChime } from '../utils/chimes'

interface CountdownTimerProps {
  selectedSubject: Subject | null
  onOpenSubjectManager: () => void
  onSessionComplete: (durationMinutes: number, mode: 'timer') => void
}

const PRESET_MINUTES = [15, 30, 45, 60, 90, 120]

export function CountdownTimer({
  selectedSubject,
  onOpenSubjectManager,
  onSessionComplete
}: CountdownTimerProps) {
  const [initialMinutes, setInitialMinutes] = useState<number>(30)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, initialMinutes])

  const handleComplete = () => {
    setIsRunning(false)
    playStudyChime('focusComplete')
    onSessionComplete(initialMinutes, 'timer')
    setSecondsRemaining(initialMinutes * 60)
  }

  const handleReset = () => {
    setIsRunning(false)
    setSecondsRemaining(initialMinutes * 60)
  }

  const handleSelectPreset = (mins: number) => {
    setIsRunning(false)
    setInitialMinutes(mins)
    setSecondsRemaining(mins * 60)
  }

  // Format mm:ss or hh:mm:ss
  const hours = Math.floor(secondsRemaining / 3600)
  const mins = Math.floor((secondsRemaining % 3600) / 60)
  const secs = secondsRemaining % 60

  const timeFormatted =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Progress ring
  const totalSeconds = initialMinutes * 60
  const progress = 1 - secondsRemaining / totalSeconds
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className="study-tab-pane countdown-container">
      {/* Subject Strip */}
      <div className="active-subject-strip" onClick={onOpenSubjectManager} title="Change active subject">
        <BookOpenIcon size={14} color={selectedSubject ? selectedSubject.color : 'var(--text-muted)'} />
        <span className="subject-label">Studying:</span>
        <span
          className="subject-pill"
          style={{
            borderColor: selectedSubject ? selectedSubject.color : 'var(--border-subtle)',
            backgroundColor: selectedSubject ? `${selectedSubject.color}22` : 'transparent',
            color: selectedSubject ? selectedSubject.color : 'var(--text-main)'
          }}
        >
          {selectedSubject ? selectedSubject.name : 'General Study'}
        </span>
        <span className="change-hint">Change</span>
      </div>

      {/* Preset Pills */}
      <div className="timer-presets-row">
        {PRESET_MINUTES.map((minsVal) => (
          <button
            key={minsVal}
            type="button"
            className={`preset-time-chip ${initialMinutes === minsVal ? 'active' : ''}`}
            onClick={() => handleSelectPreset(minsVal)}
          >
            {minsVal >= 60 ? `${minsVal / 60}h` : `${minsVal}m`}
          </button>
        ))}
      </div>

      {/* Circular Clock Display */}
      <div className="pomo-clock-stage">
        <svg className="pomo-progress-ring" width="280" height="280" viewBox="0 0 280 280">
          <circle
            className="ring-bg"
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="8"
          />
          <circle
            className="ring-progress"
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={selectedSubject ? selectedSubject.color : 'var(--accent-primary)'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 140 140)"
          />
        </svg>

        <div className="pomo-clock-center">
          <span className="pomo-time-digits">{timeFormatted}</span>
          <span className="pomo-status-tag">
            {isRunning ? 'COUNTDOWN IN PROGRESS' : 'COUNTDOWN TIMER'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="pomo-controls-row">
        <button
          type="button"
          className="ctrl-action-btn secondary"
          onClick={handleReset}
          title="Reset timer"
        >
          <RefreshIcon size={18} />
        </button>

        <button
          type="button"
          className={`ctrl-action-btn primary ${isRunning ? 'running' : ''}`}
          onClick={() => {
            playStudyChime('tap')
            setIsRunning(!isRunning)
          }}
        >
          {isRunning ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          <span>{isRunning ? 'Pause' : 'Start Timer'}</span>
        </button>
      </div>
    </div>
  )
}
