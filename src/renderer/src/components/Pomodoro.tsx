import { useState, useEffect, useRef } from 'react'
import { Subject, PlantedTree } from '../types'
import {
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  SkipForwardIcon,
  BookOpenIcon,
  SparklesIcon
} from './Icons'
import { playStudyChime } from '../utils/chimes'

interface PomodoroProps {
  selectedSubject: Subject | null
  onOpenSubjectManager: () => void
  onSessionComplete: (
    durationMinutes: number,
    mode: 'pomodoro',
    treeSpecies: PlantedTree['species']
  ) => void
  focusDurationMinutes?: number
  shortBreakMinutes?: number
  longBreakMinutes?: number
}

type PomoMode = 'focus' | 'shortBreak' | 'longBreak'

const TREE_OPTIONS: Array<{ species: PlantedTree['species']; name: string }> = [
  { species: 'sakura', name: 'Sakura' },
  { species: 'pine', name: 'Evergreen Pine' },
  { species: 'oak', name: 'Golden Oak' },
  { species: 'bonsai', name: 'Zen Bonsai' },
  { species: 'willow', name: 'Glowing Willow' }
]

export function Pomodoro({
  selectedSubject,
  onOpenSubjectManager,
  onSessionComplete,
  focusDurationMinutes = 25,
  shortBreakMinutes = 5,
  longBreakMinutes = 15
}: PomodoroProps) {
  const [mode, setMode] = useState<PomoMode>('focus')
  const [timeLeft, setTimeLeft] = useState<number>(focusDurationMinutes * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [cycleCount, setCycleCount] = useState<number>(0)
  const [selectedTree, setSelectedTree] = useState<PlantedTree['species']>('sakura')

  const totalTimeForMode =
    mode === 'focus'
      ? focusDurationMinutes * 60
      : mode === 'shortBreak'
      ? shortBreakMinutes * 60
      : longBreakMinutes * 60

  const timerRef = useRef<number | null>(null)

  // Switch mode
  const switchMode = (newMode: PomoMode) => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === 'focus') setTimeLeft(focusDurationMinutes * 60)
    else if (newMode === 'shortBreak') setTimeLeft(shortBreakMinutes * 60)
    else setTimeLeft(longBreakMinutes * 60)
  }

  // Update timeLeft if focusDurationMinutes prop changes
  useEffect(() => {
    if (!isRunning && mode === 'focus') {
      setTimeLeft(focusDurationMinutes * 60)
    }
  }, [focusDurationMinutes, mode, isRunning])

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
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
  }, [isRunning, mode])

  const handleComplete = () => {
    setIsRunning(false)
    if (mode === 'focus') {
      playStudyChime('focusComplete')
      onSessionComplete(focusDurationMinutes, 'pomodoro', selectedTree)
      const nextCycle = cycleCount + 1
      setCycleCount(nextCycle)
      if (nextCycle % 4 === 0) {
        switchMode('longBreak')
      } else {
        switchMode('shortBreak')
      }
    } else {
      playStudyChime('breakComplete')
      switchMode('focus')
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(totalTimeForMode)
  }

  const handleSkip = () => {
    if (mode === 'focus') {
      switchMode('shortBreak')
    } else {
      switchMode('focus')
    }
  }

  // Formatting mm:ss
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Progress for circle (0 to 1)
  const progress = 1 - timeLeft / totalTimeForMode
  const circleRadius = 110
  const circumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className="study-tab-pane pomodoro-container">
      {/* Mode Navigation Buttons */}
      <div className="pomo-mode-selector">
        <button
          type="button"
          className={`pomo-mode-btn ${mode === 'focus' ? 'active' : ''}`}
          onClick={() => switchMode('focus')}
        >
          <span>Focus Time</span>
          <span className="pomo-btn-time">{focusDurationMinutes}m</span>
        </button>
        <button
          type="button"
          className={`pomo-mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => switchMode('shortBreak')}
        >
          <span>Short Break</span>
          <span className="pomo-btn-time">{shortBreakMinutes}m</span>
        </button>
        <button
          type="button"
          className={`pomo-mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => switchMode('longBreak')}
        >
          <span>Long Break</span>
          <span className="pomo-btn-time">{longBreakMinutes}m</span>
        </button>
      </div>

      {/* Subject Badge */}
      <div className="active-subject-strip" onClick={onOpenSubjectManager} title="Click to change active subject">
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

      {/* Circular Timer Display */}
      <div className="pomo-clock-stage">
        <svg className="pomo-progress-ring" width="280" height="280" viewBox="0 0 280 280">
          <circle
            className="ring-bg"
            cx="140"
            cy="140"
            r={circleRadius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="8"
          />
          <circle
            className="ring-progress"
            cx="140"
            cy="140"
            r={circleRadius}
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
            {mode === 'focus' ? (isRunning ? 'IN DEEP FOCUS' : 'READY TO FOCUS') : 'RECHARGE BREAK'}
          </span>
          <div className="cycle-indicators">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`cycle-dot ${
                  cycleCount % 4 > idx
                    ? 'completed'
                    : cycleCount % 4 === idx && isRunning
                    ? 'active'
                    : ''
                }`}
              />
            ))}
          </div>
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
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          type="button"
          className="ctrl-action-btn secondary"
          onClick={handleSkip}
          title="Skip to next session"
        >
          <SkipForwardIcon size={18} />
        </button>
      </div>

      {/* Tree Plant Selection Pill (Forest Gamification) */}
      {mode === 'focus' && (
        <div className="tree-plant-selector">
          <div className="tree-plant-header">
            <SparklesIcon size={14} color="var(--accent-primary)" />
            <span>Tree Growing This Session:</span>
          </div>
          <div className="tree-species-pills">
            {TREE_OPTIONS.map((t) => (
              <button
                key={t.species}
                type="button"
                className={`tree-pill ${selectedTree === t.species ? 'active' : ''}`}
                onClick={() => setSelectedTree(t.species)}
              >
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
