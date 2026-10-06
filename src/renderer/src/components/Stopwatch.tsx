import { useState, useEffect, useRef } from 'react'
import { Subject } from '../types'
import { PlayIcon, PauseIcon, RefreshIcon, CheckIcon, BookOpenIcon } from './Icons'
import { playStudyChime } from '../utils/chimes'

interface StopwatchProps {
  selectedSubject: Subject | null
  onOpenSubjectManager: () => void
  onSessionComplete: (durationMinutes: number, mode: 'stopwatch') => void
}

interface Lap {
  index: number
  time: number
  splitTime: number
}

export function Stopwatch({
  selectedSubject,
  onOpenSubjectManager,
  onSessionComplete
}: StopwatchProps) {
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [laps, setLaps] = useState<Lap[]>([])

  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs
      intervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 10)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const toggleStartPause = () => {
    playStudyChime('tap')
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedMs(0)
    setLaps([])
  }

  const handleLap = () => {
    if (!isRunning) return
    const prevTime = laps.length > 0 ? laps[0].time : 0
    const splitTime = elapsedMs - prevTime
    const newLap: Lap = {
      index: laps.length + 1,
      time: elapsedMs,
      splitTime
    }
    setLaps([newLap, ...laps])
  }

  const handleSaveSession = () => {
    const mins = Math.round(elapsedMs / 60000)
    if (mins >= 1) {
      onSessionComplete(mins, 'stopwatch')
      playStudyChime('focusComplete')
      handleReset()
    } else {
      alert('Session was under 1 minute. Keep studying to log session!')
    }
  }

  const formatDigits = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    const centis = Math.floor((ms % 1000) / 10)

    const hrsStr = hrs > 0 ? `${String(hrs).padStart(2, '0')}:` : ''
    const minStr = String(mins).padStart(2, '0')
    const secStr = String(secs).padStart(2, '0')
    const csStr = String(centis).padStart(2, '0')

    return {
      main: `${hrsStr}${minStr}:${secStr}`,
      ms: `.${csStr}`
    }
  }

  const formatted = formatDigits(elapsedMs)

  return (
    <div className="study-tab-pane stopwatch-container">
      {/* Active Subject Bar */}
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

      {/* Main Stopwatch Clock Display */}
      <div className="stopwatch-digits-card">
        <div className="stopwatch-display-large">
          <span className="digits-main">{formatted.main}</span>
          <span className="digits-ms">{formatted.ms}</span>
        </div>
        <span className="stopwatch-status-label">
          {isRunning ? 'RECORDING STUDY TIME' : elapsedMs > 0 ? 'TIMER PAUSED' : 'READY TO RECORD'}
        </span>
      </div>

      {/* Action Controls */}
      <div className="pomo-controls-row">
        <button
          type="button"
          className="ctrl-action-btn secondary"
          onClick={handleReset}
          disabled={elapsedMs === 0}
          title="Reset stopwatch"
        >
          <RefreshIcon size={18} />
        </button>

        <button
          type="button"
          className={`ctrl-action-btn primary ${isRunning ? 'running' : ''}`}
          onClick={toggleStartPause}
        >
          {isRunning ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          type="button"
          className="ctrl-action-btn secondary"
          onClick={handleLap}
          disabled={!isRunning}
          title="Record Lap Split"
        >
          <span style={{ fontSize: '11px', fontWeight: 800 }}>LAP</span>
        </button>
      </div>

      {/* Save Session CTA Button */}
      {elapsedMs >= 60000 && !isRunning && (
        <div className="save-session-cta-wrap">
          <button
            type="button"
            className="save-session-btn"
            onClick={handleSaveSession}
          >
            <CheckIcon size={16} />
            <span>Save & Log to {selectedSubject ? selectedSubject.name : 'Subject'}</span>
          </button>
        </div>
      )}

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="laps-container">
          <div className="laps-header">
            <span>Lap #</span>
            <span>Split Delta</span>
            <span>Overall Time</span>
          </div>
          <div className="laps-list">
            {laps.map((lap) => {
              const splitFmt = formatDigits(lap.splitTime)
              const overallFmt = formatDigits(lap.time)
              return (
                <div key={lap.index} className="lap-entry">
                  <span className="lap-num">Lap {lap.index}</span>
                  <span className="lap-split">
                    +{splitFmt.main}
                    {splitFmt.ms}
                  </span>
                  <span className="lap-total">
                    {overallFmt.main}
                    {overallFmt.ms}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
