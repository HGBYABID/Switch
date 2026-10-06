import { useState, useMemo } from 'react'
import { Subject, StudySession } from '../types'
import {
  ChartPieIcon,
  TrashIcon,
  SparklesIcon,
  FlameIcon,
  TargetIcon,
  TrendingUpIcon,
  PomodoroIcon,
  StopwatchIcon,
  TimerIcon
} from './Icons'

interface AnalyticsProps {
  subjects: Subject[]
  sessions: StudySession[]
  onDeleteSession: (sessionId: string) => void
}

export function Analytics({ subjects, sessions, onDeleteSession }: AnalyticsProps) {
  const [activeSubjectHover, setActiveSubjectHover] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'all' | '7days'>('all')
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('all')
  const [historyModeFilter, setHistoryModeFilter] = useState<'all' | 'pomodoro' | 'stopwatch' | 'timer'>('all')

  // Filtered sessions based on top timeRange selector
  const displayedSessions = useMemo(() => {
    if (timeRange === '7days') {
      const sevenDaysAgo = Date.now() - 7 * 86400000
      return sessions.filter((s) => s.timestamp >= sevenDaysAgo)
    }
    return sessions
  }, [sessions, timeRange])

  // Total study minutes (REAL, strictly starts at 0)
  const totalMinutes = useMemo(() => {
    return displayedSessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [displayedSessions])

  const totalHours = (totalMinutes / 60).toFixed(1)

  // Average session length
  const avgSessionMinutes = useMemo(() => {
    if (displayedSessions.length === 0) return 0
    return Math.round(totalMinutes / displayedSessions.length)
  }, [displayedSessions, totalMinutes])

  // Study Streak (Strictly calculated from real session timestamps)
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
      // Check yesterday
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

  // Subject breakdown for Pie / Donut Chart
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { subject: Subject; minutes: number }>()

    subjects.forEach((sub) => {
      map.set(sub.id, { subject: sub, minutes: 0 })
    })

    displayedSessions.forEach((sess) => {
      const entry = map.get(sess.subjectId)
      if (entry) {
        entry.minutes += sess.durationMinutes
      } else {
        map.set(sess.subjectId, {
          subject: {
            id: sess.subjectId,
            name: sess.subjectName || 'Other',
            color: sess.subjectColor || '#64748b',
            createdAt: sess.timestamp
          },
          minutes: sess.durationMinutes
        })
      }
    })

    const list = Array.from(map.values()).filter((e) => e.minutes > 0)
    list.sort((a, b) => b.minutes - a.minutes)
    return list
  }, [subjects, displayedSessions])

  const leadingSubject = subjectBreakdown.length > 0 ? subjectBreakdown[0] : null

  // Weekly study breakdown for Bar Graph (Past 7 Days)
  const weeklyData = useMemo(() => {
    const days: Array<{ dayName: string; dateStr: string; minutes: number }> = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000

      const dayMinutes = sessions
        .filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd)
        .reduce((acc, s) => acc + s.durationMinutes, 0)

      days.push({
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutes: dayMinutes
      })
    }
    return days
  }, [sessions])

  // Mode breakdown (Pomodoro vs Stopwatch vs Countdown)
  const modeBreakdown = useMemo(() => {
    let pomoMins = 0
    let pomoCount = 0
    let stopMins = 0
    let stopCount = 0
    let timerMins = 0
    let timerCount = 0

    displayedSessions.forEach((s) => {
      if (s.mode === 'pomodoro') {
        pomoMins += s.durationMinutes
        pomoCount++
      } else if (s.mode === 'stopwatch') {
        stopMins += s.durationMinutes
        stopCount++
      } else if (s.mode === 'timer') {
        timerMins += s.durationMinutes
        timerCount++
      }
    })

    const total = totalMinutes || 1

    return [
      {
        mode: 'Pomodoro Focus',
        id: 'pomodoro',
        minutes: pomoMins,
        count: pomoCount,
        percentage: Math.round((pomoMins / total) * 100),
        color: '#c6ff00'
      },
      {
        mode: 'Precision Stopwatch',
        id: 'stopwatch',
        minutes: stopMins,
        count: stopCount,
        percentage: Math.round((stopMins / total) * 100),
        color: '#38bdf8'
      },
      {
        mode: 'Countdown Dial',
        id: 'timer',
        minutes: timerMins,
        count: timerCount,
        percentage: Math.round((timerMins / total) * 100),
        color: '#ff782d'
      }
    ]
  }, [displayedSessions, totalMinutes])

  // Chronotype / Time-of-day study rhythm
  const rhythmBreakdown = useMemo(() => {
    let morning = 0 // 06 - 12
    let afternoon = 0 // 12 - 18
    let evening = 0 // 18 - 24
    let night = 0 // 00 - 06

    displayedSessions.forEach((s) => {
      const hour = new Date(s.timestamp).getHours()
      if (hour >= 6 && hour < 12) morning += s.durationMinutes
      else if (hour >= 12 && hour < 18) afternoon += s.durationMinutes
      else if (hour >= 18 && hour < 24) evening += s.durationMinutes
      else night += s.durationMinutes
    })

    const total = totalMinutes || 1

    return [
      { name: 'Morning', hours: '06:00 - 12:00', minutes: morning, pct: Math.round((morning / total) * 100) },
      { name: 'Afternoon', hours: '12:00 - 18:00', minutes: afternoon, pct: Math.round((afternoon / total) * 100) },
      { name: 'Evening', hours: '18:00 - 24:00', minutes: evening, pct: Math.round((evening / total) * 100) },
      { name: 'Night Owl', hours: '00:00 - 06:00', minutes: night, pct: Math.round((night / total) * 100) }
    ]
  }, [displayedSessions, totalMinutes])

  // Donut chart path calculations
  const donutPaths = useMemo(() => {
    if (totalMinutes === 0 || subjectBreakdown.length === 0) return []

    let cumulativeAngle = 0
    const cx = 110
    const cy = 110
    const outerR = 90
    const innerR = 58

    return subjectBreakdown.map((item) => {
      const sliceAngle = (item.minutes / totalMinutes) * 2 * Math.PI
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + sliceAngle
      cumulativeAngle = endAngle

      const x1 = cx + outerR * Math.cos(startAngle)
      const y1 = cy + outerR * Math.sin(startAngle)
      const x2 = cx + outerR * Math.cos(endAngle)
      const y2 = cy + outerR * Math.sin(endAngle)

      const x3 = cx + innerR * Math.cos(endAngle)
      const y3 = cy + innerR * Math.sin(endAngle)
      const x4 = cx + innerR * Math.cos(startAngle)
      const y4 = cy + innerR * Math.sin(startAngle)

      const largeArc = sliceAngle > Math.PI ? 1 : 0

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ')

      const percentage = Math.round((item.minutes / totalMinutes) * 100)

      return {
        id: item.subject.id,
        name: item.subject.name,
        color: item.subject.color,
        minutes: item.minutes,
        percentage,
        pathData
      }
    })
  }, [subjectBreakdown, totalMinutes])

  const maxWeeklyMinutes = Math.max(...weeklyData.map((d) => d.minutes), 60)

  // Filtered session logs for History Audit
  const historyFilteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (historySubjectFilter !== 'all' && s.subjectId !== historySubjectFilter) return false
      if (historyModeFilter !== 'all' && s.mode !== historyModeFilter) return false
      return true
    })
  }, [sessions, historySubjectFilter, historyModeFilter])

  return (
    <div className="study-tab-pane analytics-container">
      {/* Executive Header Bar */}
      <div className="analytics-header-banner">
        <div className="analytics-header-left">
          <div className="analytics-pill-badge">
            <span className="live-pulse-dot" />
            <span>STUDY INTELLIGENCE STUDIO</span>
          </div>
          <h2 className="analytics-main-title">Performance & Deep Focus Analytics</h2>
          <p className="analytics-main-desc">
            Granular study breakdown, subject distribution, velocity curves, and circadian rhythms.
          </p>
        </div>

        <div className="analytics-header-right">
          <div className="time-range-segmented-btn">
            <button
              type="button"
              className={`segmented-pill ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`segmented-pill ${timeRange === '7days' ? 'active' : ''}`}
              onClick={() => setTimeRange('7days')}
            >
              Past 7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Top Executive KPI Cards (Strictly starts at 0, no mock numbers) */}
      <div className="analytics-metrics-grid">
        {/* Metric 1 */}
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Total Focus Time</span>
            <ChartPieIcon size={16} color="var(--accent-primary)" />
          </div>
          <span className="metric-big-num">{totalHours} hrs</span>
          <span className="metric-subtext">{totalMinutes} focused minutes logged</span>
        </div>

        {/* Metric 2 */}
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Completed Sessions</span>
            <SparklesIcon size={16} color="var(--accent-primary)" />
          </div>
          <span className="metric-big-num">{displayedSessions.length}</span>
          <span className="metric-subtext">{avgSessionMinutes}m average duration</span>
        </div>

        {/* Metric 3 */}
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Study Streak</span>
            <FlameIcon size={16} color="#ff782d" />
          </div>
          <span className="metric-big-num">{streakDays} Days</span>
          <span className="metric-subtext">
            {streakDays > 0 ? 'Consistent momentum' : 'Start your first session today!'}
          </span>
        </div>

        {/* Metric 4 */}
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-title">Leading Subject</span>
            <TargetIcon size={16} color="var(--accent-primary)" />
          </div>
          <span className="metric-big-num" style={{ fontSize: '18px' }}>
            {leadingSubject ? leadingSubject.subject.name : 'None yet'}
          </span>
          <span className="metric-subtext">
            {leadingSubject
              ? `${(leadingSubject.minutes / 60).toFixed(1)} hrs recorded`
              : 'Zero sessions logged'}
          </span>
        </div>
      </div>

      {/* Dual Graphs: Donut Pie on Left + Weekly Velocity on Right */}
      <div className="analytics-charts-grid">
        {/* DONUT PIE CHART CARD */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="card-pill-tag">ALLOCATION</span>
              <h3 className="chart-title">Subject Distribution (Pie Chart)</h3>
            </div>
            <span className="chart-subtitle">Focus share per subject</span>
          </div>

          {totalMinutes === 0 ? (
            <div className="empty-chart-state">
              <div className="blueprint-donut-hollow">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r="68"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="16"
                    strokeDasharray="6 6"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="48"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="2"
                  />
                </svg>
                <span className="blueprint-label">0%</span>
              </div>
              <p className="empty-hint-headline">No study sessions recorded yet</p>
              <span className="empty-hint-detail">
                Complete a Pomodoro, Stopwatch, or Countdown session to illuminate your subject pie chart!
              </span>
            </div>
          ) : (
            <div className="donut-chart-layout">
              <div className="donut-svg-wrap">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  <g transform="rotate(-90 110 110)">
                    {donutPaths.map((slice) => {
                      const isHovered = activeSubjectHover === slice.id
                      return (
                        <path
                          key={slice.id}
                          d={slice.pathData}
                          fill={slice.color}
                          stroke="var(--bg-card)"
                          strokeWidth="2.5"
                          opacity={activeSubjectHover && !isHovered ? 0.45 : 1}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            transformOrigin: '110px 110px',
                            transform: isHovered ? 'scale(1.03)' : 'scale(1)'
                          }}
                          onMouseEnter={() => setActiveSubjectHover(slice.id)}
                          onMouseLeave={() => setActiveSubjectHover(null)}
                        />
                      )
                    })}
                  </g>
                </svg>
                <div className="donut-center-readout">
                  <span className="donut-center-number">{totalHours}h</span>
                  <span className="donut-center-sub">Total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="donut-legend">
                {donutPaths.map((slice) => {
                  const isHovered = activeSubjectHover === slice.id
                  return (
                    <div
                      key={slice.id}
                      className={`legend-row ${isHovered ? 'hovered' : ''}`}
                      onMouseEnter={() => setActiveSubjectHover(slice.id)}
                      onMouseLeave={() => setActiveSubjectHover(null)}
                    >
                      <div className="legend-left">
                        <span className="legend-color-dot" style={{ backgroundColor: slice.color }} />
                        <span className="legend-name">{slice.name}</span>
                      </div>
                      <div className="legend-right">
                        <span className="legend-percentage">{slice.percentage}%</span>
                        <span className="legend-time">
                          {slice.minutes >= 60
                            ? `${(slice.minutes / 60).toFixed(1)}h`
                            : `${slice.minutes}m`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* WEEKLY FOCUS VELOCITY BAR CHART */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="card-pill-tag">VELOCITY</span>
              <h3 className="chart-title">Weekly Focus Hours</h3>
            </div>
            <span className="chart-subtitle">Past 7 days activity</span>
          </div>

          <div className="bar-graph-wrap">
            <div className="bars-flex-container">
              {weeklyData.map((day, idx) => {
                const heightPercent =
                  day.minutes > 0 ? Math.max(8, (day.minutes / maxWeeklyMinutes) * 100) : 4
                const hoursVal = (day.minutes / 60).toFixed(1)

                return (
                  <div key={idx} className="bar-column">
                    <span className="bar-val-label">{day.minutes > 0 ? `${hoursVal}h` : ''}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor:
                            day.minutes > 0 ? 'var(--accent-primary)' : 'var(--border-subtle)'
                        }}
                      />
                    </div>
                    <span className="bar-day-name">{day.dayName}</span>
                    <span className="bar-date-sub">{day.dateStr}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Productivity Insights Grid: Mode Distribution + Chronotype Rhythm */}
      <div className="analytics-charts-grid">
        {/* Method Distribution Card */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="card-pill-tag">METHODOLOGY</span>
              <h3 className="chart-title">Focus Mode Breakdown</h3>
            </div>
            <span className="chart-subtitle">Time distribution by technique</span>
          </div>

          <div className="mode-breakdown-list">
            {modeBreakdown.map((m) => (
              <div key={m.id} className="mode-item-block">
                <div className="mode-item-header">
                  <div className="mode-label-cluster">
                    {m.id === 'pomodoro' && <PomodoroIcon size={15} color={m.color} />}
                    {m.id === 'stopwatch' && <StopwatchIcon size={15} color={m.color} />}
                    {m.id === 'timer' && <TimerIcon size={15} color={m.color} />}
                    <span className="mode-name-title">{m.mode}</span>
                  </div>
                  <div className="mode-stat-cluster">
                    <span className="mode-count-sub">{m.count} sessions</span>
                    <span className="mode-time-main">{m.minutes}m ({m.percentage}%)</span>
                  </div>
                </div>

                <div className="mode-track-bar">
                  <div
                    className="mode-fill-bar"
                    style={{
                      width: `${totalMinutes > 0 ? m.percentage : 0}%`,
                      backgroundColor: m.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Rhythm (Time of Day) */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="card-pill-tag">CIRCADIAN</span>
              <h3 className="chart-title">Productivity Rhythm</h3>
            </div>
            <span className="chart-subtitle">Focus output by time of day</span>
          </div>

          <div className="rhythm-quad-grid">
            {rhythmBreakdown.map((r, i) => (
              <div key={i} className="rhythm-quad-cell">
                <div className="rhythm-cell-top">
                  <span className="rhythm-period-title">{r.name}</span>
                  <span className="rhythm-pct-pill">{r.pct}%</span>
                </div>
                <span className="rhythm-hours-tag">{r.hours}</span>
                <div className="rhythm-mini-track">
                  <div
                    className="rhythm-mini-fill"
                    style={{ width: `${totalMinutes > 0 ? r.pct : 0}%` }}
                  />
                </div>
                <span className="rhythm-mins-label">{r.minutes}m logged</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session History Log Table */}
      <div className="chart-card session-history-card">
        <div className="chart-card-header session-audit-header">
          <div>
            <span className="card-pill-tag">HISTORY LOG</span>
            <h3 className="chart-title">Verified Study Sessions</h3>
            <span className="chart-subtitle">{sessions.length} total logged sessions</span>
          </div>

          {/* Table Filters */}
          <div className="history-filters-cluster">
            <select
              value={historySubjectFilter}
              onChange={(e) => setHistorySubjectFilter(e.target.value)}
              className="history-select-dropdown"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            <div className="history-mode-chips">
              {(['all', 'pomodoro', 'stopwatch', 'timer'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`history-mode-btn ${historyModeFilter === mode ? 'active' : ''}`}
                  onClick={() => setHistoryModeFilter(mode)}
                >
                  {mode === 'all' ? 'All' : mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {historyFilteredSessions.length === 0 ? (
          <div className="empty-history-state">
            <TrendingUpIcon size={28} color="var(--text-dim)" />
            <p>No study logs recorded yet.</p>
            <span>Finish a study session in Pomodoro, Stopwatch, or Timer to see your full logs here.</span>
          </div>
        ) : (
          <div className="session-history-table">
            <div className="table-header-row">
              <span>Date & Time</span>
              <span>Mode</span>
              <span>Subject</span>
              <span>Duration</span>
              <span>Action</span>
            </div>
            <div className="table-body-scroll">
              {historyFilteredSessions.map((sess) => (
                <div key={sess.id} className="session-log-row">
                  <span className="col-date">
                    {new Date(sess.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="col-mode">
                    <span className="mode-pill-tag">{sess.mode}</span>
                  </span>
                  <span className="col-subject">
                    <span
                      className="subject-pip"
                      style={{ backgroundColor: sess.subjectColor || 'var(--accent-primary)' }}
                    />
                    <span>{sess.subjectName || 'General'}</span>
                  </span>
                  <span className="col-duration font-mono">{sess.durationMinutes} mins</span>
                  <span className="col-action">
                    <button
                      type="button"
                      className="delete-log-btn"
                      onClick={() => onDeleteSession(sess.id)}
                      title="Delete session"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
