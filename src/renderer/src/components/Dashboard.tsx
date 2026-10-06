import { useMemo } from 'react'
import { Subject, StudySession, PlantedTree, SongItem, AppTab } from '../types'
import {
  SparklesIcon,
  FlameIcon,
  TreeIcon,
  PlayIcon,
  PauseIcon,
  ArrowUpRightIcon,
  MusicIcon
} from './Icons'

interface DashboardProps {
  subjects: Subject[]
  sessions: StudySession[]
  trees: PlantedTree[]
  currentSubject: Subject | null
  dailyGoalHours: number
  currentSong: SongItem | null
  isPlaying: boolean
  onTogglePlayPause: () => void
  onNavigateTab: (tab: AppTab) => void
  onOpenSubjectModal: () => void
  onOpenThemeModal: () => void
}

export function Dashboard({
  subjects,
  sessions,
  trees,
  currentSubject,
  dailyGoalHours,
  currentSong,
  isPlaying,
  onTogglePlayPause,
  onNavigateTab,
  onOpenSubjectModal,
  onOpenThemeModal
}: DashboardProps) {
  // Today's total study minutes
  const todayStart = useMemo(() => new Date().setHours(0, 0, 0, 0), [])

  const todayMinutes = useMemo(() => {
    return sessions
      .filter((s) => s.timestamp >= todayStart)
      .reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [sessions, todayStart])

  const todayHours = (todayMinutes / 60).toFixed(1)
  const goalMinutes = dailyGoalHours * 60
  const goalPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, goalMinutes)) * 100))

  // Total Lifetime Minutes
  const totalLifetimeMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [sessions])

  // Active Streak (Real calculation from session timestamps)
  const streakDays = useMemo(() => {
    if (sessions.length === 0) return 0
    const sessionDays = new Set(
      sessions.map((s) => {
        const d = new Date(s.timestamp)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    )
    let count = 0
    const checkDate = new Date()
    const getFormat = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    let dateStr = getFormat(checkDate)
    if (!sessionDays.has(dateStr)) {
      checkDate.setDate(checkDate.getDate() - 1)
      dateStr = getFormat(checkDate)
      if (!sessionDays.has(dateStr)) {
        return 0
      }
    }

    while (sessionDays.has(dateStr)) {
      count++
      checkDate.setDate(checkDate.getDate() - 1)
      dateStr = getFormat(checkDate)
    }
    return count
  }, [sessions])

  // Weekly study minutes per day (last 7 days: M T W T F S S)
  const weeklyDaysData = useMemo(() => {
    const days: Array<{ label: string; dateStr: string; minutes: number }> = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d).setHours(0, 0, 0, 0)
      const dayEnd = new Date(d).setHours(23, 59, 59, 999)
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }) // M, T, W...

      const dayMins = sessions
        .filter((s) => s.timestamp >= dayStart && s.timestamp <= dayEnd)
        .reduce((acc, s) => acc + s.durationMinutes, 0)

      days.push({
        label: dayLabel,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: dayMins
      })
    }
    return days
  }, [sessions])

  // Subject Breakdown
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; color: string; minutes: number }>()

    subjects.forEach((s) => {
      map.set(s.id, { name: s.name, color: s.color, minutes: 0 })
    })

    sessions.forEach((sess) => {
      const entry = map.get(sess.subjectId)
      if (entry) {
        entry.minutes += sess.durationMinutes
      } else {
        map.set(sess.subjectId, {
          name: sess.subjectName || 'Other',
          color: sess.subjectColor || '#64748b',
          minutes: sess.durationMinutes
        })
      }
    })

    const list = Array.from(map.values()).filter((e) => e.minutes > 0)
    const total = list.reduce((acc, e) => acc + e.minutes, 0)

    return list.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.minutes / total) * 100) : 0
    }))
  }, [subjects, sessions])

  // Spline points calculation for Weekly Progress (Image 3 style)
  const splinePath = useMemo(() => {
    const maxMins = Math.max(60, ...weeklyDaysData.map((d) => d.minutes))
    const width = 360
    const height = 90
    const paddingX = 20
    const step = (width - paddingX * 2) / (weeklyDaysData.length - 1)

    const points = weeklyDaysData.map((d, idx) => {
      const x = paddingX + idx * step
      const normalizedY = 1 - d.minutes / maxMins
      const y = 15 + normalizedY * (height - 30)
      return { x, y }
    })

    if (points.length === 0) return ''

    // Smooth Bezier spline
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const mx = (p0.x + p1.x) / 2
      path += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    return path
  }, [weeklyDaysData])

  return (
    <div className="bento-dashboard-root">
      {/* Top Welcome & Executive Status Bar */}
      <div className="bento-header-banner">
        <div className="banner-left">
          <div className="startup-badge">
            <span className="startup-status-dot" />
            <span>STUDY ECOSYSTEM &bull; LIVE</span>
          </div>
          <h1 className="banner-headline">Focus Workspace</h1>
          <p className="banner-sub">
            Track deep study sprints, bloom trees in your grove, and listen to high-fidelity audio.
          </p>
        </div>

        <div className="banner-actions">
          {currentSubject && (
            <button
              type="button"
              className="bento-subject-pill"
              onClick={onOpenSubjectModal}
              title="Change active subject"
            >
              <span className="dot-indicator" style={{ backgroundColor: currentSubject.color }} />
              <span className="subject-title-text">{currentSubject.name}</span>
            </button>
          )}

          <button
            type="button"
            className="bento-cta-btn primary"
            onClick={() => onNavigateTab('pomodoro')}
          >
            <SparklesIcon size={15} />
            <span>Start Focus Sprint</span>
            <ArrowUpRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* 4-Card Executive Metrics Bento Row (Inspired by Image 1 & Image 2) */}
      <div className="bento-metric-grid">
        {/* Metric 1: Today's Focus */}
        <div className="bento-card metric-card">
          <div className="card-micro-header">
            <span className="metric-tag">Today's Focus</span>
            <span className="metric-trend-pill positive">
              <SparklesIcon size={11} /> {goalPercent}% Goal
            </span>
          </div>
          <div className="metric-number-display">
            <span className="metric-main-value">{todayHours}</span>
            <span className="metric-unit">hrs</span>
          </div>
          <div className="metric-sub-detail">
            <span>{todayMinutes} minutes logged today</span>
          </div>
        </div>

        {/* Metric 2: Goal Progress (Concentric ring style from Image 3) */}
        <div className="bento-card metric-card goal-card">
          <div className="card-micro-header">
            <span className="metric-tag">Daily Goal Target</span>
            <span className="metric-tag-sub">{dailyGoalHours}h Goal</span>
          </div>
          <div className="metric-number-display flex-row-align">
            <div className="concentric-ring-mini">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="4"
                  strokeDasharray="113"
                  strokeDashoffset={113 - (113 * goalPercent) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                />
              </svg>
              <span className="ring-text-inner">{goalPercent}%</span>
            </div>
            <div>
              <span className="metric-main-value">{goalPercent}%</span>
              <span className="metric-unit">complete</span>
            </div>
          </div>
          <div className="metric-sub-detail">
            <span>{Math.max(0, goalMinutes - todayMinutes)} mins remaining</span>
          </div>
        </div>

        {/* Metric 3: Active Streak */}
        <div className="bento-card metric-card">
          <div className="card-micro-header">
            <span className="metric-tag">Active Streak</span>
            <FlameIcon size={14} color="#ff782d" />
          </div>
          <div className="metric-number-display">
            <span className="metric-main-value">{streakDays}</span>
            <span className="metric-unit">days</span>
          </div>
          <div className="metric-sub-detail">
            <span>{streakDays > 0 ? `${streakDays} day streak` : 'Start your streak today'}</span>
          </div>
        </div>

        {/* Metric 4: Forest Grove */}
        <div className="bento-card metric-card forest-metric">
          <div className="card-micro-header">
            <span className="metric-tag">Planted Trees</span>
            <TreeIcon size={14} color="var(--accent-primary)" />
          </div>
          <div className="metric-number-display">
            <span className="metric-main-value">{trees.length}</span>
            <span className="metric-unit">trees</span>
          </div>
          <div className="metric-sub-detail">
            <span>{(totalLifetimeMinutes / 60).toFixed(1)} lifetime focus hours</span>
          </div>
        </div>
      </div>

      {/* Main Dual Hero Grid: Left Hot Sprint Station + Right Weekly Spline (Images 1, 2, 3) */}
      <div className="bento-dual-hero-grid">
        {/* Left Card: Focus Sprint Hub with Asymmetric Startup Accent (Image 2 Style) */}
        <div className="bento-card focus-hero-card">
          <div className="card-notched-header">
            <div className="notch-title-block">
              <span className="card-pill-tag">ACTIVE MODULE</span>
              <h3 className="card-heading-title">Deep Focus Station</h3>
            </div>
            <button
              type="button"
              className="action-diagonal-arrow"
              onClick={() => onNavigateTab('pomodoro')}
              title="Open full Pomodoro workspace"
            >
              <ArrowUpRightIcon size={16} />
            </button>
          </div>

          <div className="focus-hero-body">
            <div className="timer-preview-circle">
              <div className="circle-inner-display">
                <span className="timer-huge-digits">25:00</span>
                <span className="timer-mode-sub">STANDARD SPRINT</span>
              </div>
            </div>

            <div className="focus-quick-actions">
              <div className="sprint-subject-row">
                <span className="label-caption">Target Subject:</span>
                <span className="chip-subject-badge" onClick={onOpenSubjectModal}>
                  <span
                    className="dot-small"
                    style={{ backgroundColor: currentSubject?.color || 'var(--accent-primary)' }}
                  />
                  <span>{currentSubject?.name || 'General Focus'}</span>
                </span>
              </div>

              <div className="hero-buttons-cta-row">
                <button
                  type="button"
                  className="start-sprint-btn primary"
                  onClick={() => onNavigateTab('pomodoro')}
                >
                  <PlayIcon size={16} />
                  <span>Launch Sprint</span>
                </button>

                <button
                  type="button"
                  className="start-sprint-btn secondary"
                  onClick={() => onNavigateTab('stopwatch')}
                >
                  <span>Stopwatch</span>
                </button>

                <button
                  type="button"
                  className="start-sprint-btn secondary"
                  onClick={() => onNavigateTab('timer')}
                >
                  <span>Countdown</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Weekly Progress Spline Graph (Image 3 Style) */}
        <div className="bento-card weekly-spline-card">
          <div className="card-notched-header">
            <div className="notch-title-block">
              <span className="card-pill-tag">VELOCITY</span>
              <h3 className="card-heading-title">Weekly Focus Curve</h3>
            </div>
            <button
              type="button"
              className="action-diagonal-arrow"
              onClick={() => onNavigateTab('analytics')}
              title="Open full analytics"
            >
              <ArrowUpRightIcon size={16} />
            </button>
          </div>

          {/* SVG Smooth Bezier Spline */}
          <div className="spline-chart-wrap">
            <svg width="100%" height="110" viewBox="0 0 360 110" preserveAspectRatio="none">
              <defs>
                <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              {splinePath && (
                <path
                  d={`${splinePath} L 340 110 L 20 110 Z`}
                  fill="url(#splineGradient)"
                />
              )}

              {/* Curve Stroke */}
              {splinePath && (
                <path
                  d={splinePath}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Dots at data points */}
              {weeklyDaysData.map((d, idx) => {
                const maxMins = Math.max(60, ...weeklyDaysData.map((w) => w.minutes))
                const step = (360 - 40) / (weeklyDaysData.length - 1)
                const x = 20 + idx * step
                const y = 15 + (1 - d.minutes / maxMins) * 60
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={d.minutes > 0 ? 4 : 2}
                    fill={d.minutes > 0 ? 'var(--accent-primary)' : 'var(--border-subtle)'}
                    stroke="var(--bg-card)"
                    strokeWidth="2"
                  />
                )
              })}
            </svg>

            {/* Day Labels M T W T F S S */}
            <div className="spline-days-row">
              {weeklyDaysData.map((d, idx) => (
                <div key={idx} className="day-col-label">
                  <span className="day-letter">{d.label}</span>
                  <span className="day-mins">{d.minutes > 0 ? `${d.minutes}m` : '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Column Bottom Bento Grid (Subject Allocation, Forest Grove, Sound Studio) */}
      <div className="bento-tri-grid">
        {/* Tri-Card 1: Subject Allocation (Image 1 & 3 style) */}
        <div className="bento-card tri-card">
          <div className="card-notched-header">
            <div>
              <span className="card-pill-tag">SUBJECTS</span>
              <h4 className="card-subheading">Time Distribution</h4>
            </div>
            <button
              type="button"
              className="action-diagonal-arrow"
              onClick={onOpenSubjectModal}
              title="Manage subjects"
            >
              <ArrowUpRightIcon size={14} />
            </button>
          </div>

          <div className="subject-bars-list">
            {subjectBreakdown.length === 0 ? (
              <p className="empty-hint-text">Log a session to view subject analytics.</p>
            ) : (
              subjectBreakdown.slice(0, 4).map((sub, idx) => (
                <div key={idx} className="subject-bar-row">
                  <div className="subject-bar-label-row">
                    <span className="sub-name-with-dot">
                      <span className="sub-color-pip" style={{ backgroundColor: sub.color }} />
                      <span className="sub-name-text">{sub.name}</span>
                    </span>
                    <span className="sub-pct-text">{sub.percentage}%</span>
                  </div>
                  <div className="subject-bar-track">
                    <div
                      className="subject-bar-fill"
                      style={{
                        width: `${sub.percentage}%`,
                        backgroundColor: sub.color
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tri-Card 2: Forest Meadow Preview */}
        <div className="bento-card tri-card forest-preview-card">
          <div className="card-notched-header">
            <div>
              <span className="card-pill-tag">NATURE GROVE</span>
              <h4 className="card-subheading">Recent Growth</h4>
            </div>
            <button
              type="button"
              className="action-diagonal-arrow"
              onClick={() => onNavigateTab('forest')}
              title="Open Forest"
            >
              <ArrowUpRightIcon size={14} />
            </button>
          </div>

          <div className="forest-preview-row">
            {trees.slice(0, 4).map((tree) => (
              <div key={tree.id} className="mini-grove-tile" title={`${tree.species} - ${tree.durationMinutes}m`}>
                <div className="mini-tree-icon">
                  <TreeIcon size={24} color={tree.subjectColor || 'var(--accent-primary)'} />
                </div>
                <span className="mini-tree-species">{tree.species}</span>
                <span className="mini-tree-time">{tree.durationMinutes}m</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="grove-view-link"
            onClick={() => onNavigateTab('forest')}
          >
            <span>Explore Full Forest</span>
            <ArrowUpRightIcon size={12} />
          </button>
        </div>

        {/* Tri-Card 3: Ambient Music & Studio (Image 2 style) */}
        <div className="bento-card tri-card music-preview-card">
          <div className="card-notched-header">
            <div>
              <span className="card-pill-tag">FOCUS AUDIO</span>
              <h4 className="card-subheading">Soundscape Studio</h4>
            </div>
            <button
              type="button"
              className="action-diagonal-arrow"
              onClick={() => onNavigateTab('music')}
              title="Open Music Library"
            >
              <ArrowUpRightIcon size={14} />
            </button>
          </div>

          <div className="music-now-playing-snippet">
            <div className="snippet-album-artwork">
              <MusicIcon size={22} color="var(--accent-primary)" />
            </div>
            <div className="snippet-track-details">
              <span className="snippet-track-title">
                {currentSong ? currentSong.title : 'Atmospheric Study Audio'}
              </span>
              <span className="snippet-track-artist">
                {currentSong ? currentSong.artist : 'Select a song to study with'}
              </span>
            </div>
            <button
              type="button"
              className="snippet-play-btn"
              onClick={onTogglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>
          </div>

          <div className="music-quick-actions-bar">
            <button
              type="button"
              className="music-quick-btn"
              onClick={() => onNavigateTab('music')}
            >
              <MusicIcon size={13} />
              <span>Browse Library</span>
            </button>
            <button
              type="button"
              className="music-quick-btn"
              onClick={onOpenThemeModal}
            >
              <span>Themes & Goals</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
