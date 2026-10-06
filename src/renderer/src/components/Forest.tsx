import { useState } from 'react'
import { PlantedTree } from '../types'
import { TreeIcon, SparklesIcon, TimerIcon } from './Icons'

interface ForestProps {
  trees: PlantedTree[]
  totalStudyMinutes: number
}

// Tree SVG Renderers for the 5 Species
function TreeGraphic({ species, size = 64 }: { species: PlantedTree['species']; size?: number }) {
  switch (species) {
    case 'sakura':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M48 95 L48 65 Q50 55 42 45 M52 65 Q50 55 60 48" stroke="#5c4033" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="40" r="22" fill="#fbcfe8" opacity="0.9" />
          <circle cx="36" cy="45" r="16" fill="#f472b6" opacity="0.8" />
          <circle cx="64" cy="45" r="16" fill="#f472b6" opacity="0.8" />
          <circle cx="50" cy="26" r="15" fill="#f9a8d4" opacity="0.95" />
          <circle cx="34" cy="72" r="2.5" fill="#fbcfe8" />
          <circle cx="68" cy="78" r="2" fill="#f472b6" />
        </svg>
      )
    case 'pine':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect x="47" y="75" width="6" height="20" rx="2" fill="#4a3525" />
          <polygon points="50 15 25 50 75 50" fill="#2d6a4f" />
          <polygon points="50 35 20 70 80 70" fill="#1b4332" />
          <polygon points="50 55 16 85 84 85" fill="#081c15" />
        </svg>
      )
    case 'oak':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M47 95 L47 55 Q40 45 35 40 M53 55 Q60 45 65 38" stroke="#6f4e37" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="45" r="24" fill="#588157" />
          <circle cx="35" cy="40" r="18" fill="#a3b18a" opacity="0.9" />
          <circle cx="65" cy="40" r="18" fill="#3a5a40" />
          <circle cx="50" cy="28" r="17" fill="#dad7cd" opacity="0.85" />
        </svg>
      )
    case 'bonsai':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M25 88 L75 88 L70 95 L30 95 Z" fill="#3e2723" />
          <path d="M50 88 Q45 70 38 60 Q30 50 38 38 Q48 42 60 45" stroke="#5d4037" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="36" r="14" fill="#2e7d32" />
          <circle cx="56" cy="40" r="12" fill="#43a047" />
          <circle cx="48" cy="26" r="11" fill="#1b5e20" />
        </svg>
      )
    case 'willow':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <path d="M48 95 L48 50 Q48 40 40 32 M52 50 Q56 38 65 30" stroke="#4e342e" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="38" r="20" fill="#a7f3d0" opacity="0.85" />
          <path d="M36 45 Q32 65 30 80 M44 48 Q42 68 40 85 M56 48 Q58 68 60 85 M64 45 Q68 65 70 80" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="45" r="25" fill="var(--accent-primary)" />
          <rect x="47" y="70" width="6" height="25" fill="#4a3525" />
        </svg>
      )
  }
}

export function Forest({ trees, totalStudyMinutes }: ForestProps) {
  const [filter, setFilter] = useState<'all' | 'today'>('all')

  const todayStart = new Date().setHours(0, 0, 0, 0)

  const displayedTrees = filter === 'today'
    ? trees.filter((t) => t.plantedAt >= todayStart)
    : trees

  const treesTodayCount = trees.filter((t) => t.plantedAt >= todayStart).length
  const totalHours = (totalStudyMinutes / 60).toFixed(1)

  return (
    <div className="study-tab-pane forest-container">
      {/* Top Forest Stats Bar */}
      <div className="forest-stats-banner">
        <div className="stat-metric-card">
          <div className="stat-icon-wrap">
            <TreeIcon size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-text-col">
            <span className="stat-value">{trees.length}</span>
            <span className="stat-label">Trees in Grove</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-wrap">
            <SparklesIcon size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-text-col">
            <span className="stat-value">{treesTodayCount}</span>
            <span className="stat-label">Planted Today</span>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-wrap">
            <TimerIcon size={20} color="var(--accent-primary)" />
          </div>
          <div className="stat-text-col">
            <span className="stat-value">{totalHours} hrs</span>
            <span className="stat-label">Forest Growth Time</span>
          </div>
        </div>
      </div>

      {/* Filter Chips & Explanation */}
      <div className="forest-toolbar">
        <div className="forest-guide">
          <span className="guide-title">How Your Forest Grows:</span>
          <span className="guide-desc">
            Complete a Pomodoro session or study 20+ minutes to plant a living tree in your personal meadow.
          </span>
        </div>

        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time ({trees.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today ({treesTodayCount})
          </button>
        </div>
      </div>

      {/* The Meadow Grove Canvas */}
      <div className="forest-meadow-card">
        {displayedTrees.length === 0 ? (
          <div className="empty-meadow-state">
            <div className="seedling-icon-box">
              <TreeIcon size={36} color="var(--accent-primary)" />
            </div>
            <h3 className="empty-title">Your meadow is waiting for its first tree</h3>
            <p className="empty-subtext">
              Start a Focus Pomodoro or run your Stopwatch to grow your first Sakura, Pine, or Bonsai tree!
            </p>
          </div>
        ) : (
          <div className="meadow-trees-grid">
            {displayedTrees.map((tree) => {
              const dateStr = new Date(tree.plantedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })

              return (
                <div key={tree.id} className="planted-tree-slot">
                  <div className="tree-graphic-wrap">
                    <TreeGraphic species={tree.species} size={76} />
                  </div>
                  <div className="tree-meta-pill" style={{ borderColor: `${tree.subjectColor}55` }}>
                    <span
                      className="subject-dot"
                      style={{ backgroundColor: tree.subjectColor }}
                    />
                    <span className="tree-subject-name">{tree.subjectName}</span>
                    <span className="tree-time-tag">{tree.durationMinutes}m</span>
                  </div>
                  <span className="tree-planted-date">{dateStr}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
