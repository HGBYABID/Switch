import { ThemeId } from '../types'
import { THEMES } from '../themes'
import { PaletteIcon, CloseIcon, CheckIcon } from './Icons'

interface ThemeCustomizerProps {
  isOpen: boolean
  onClose: () => void
  currentTheme: ThemeId
  onSelectTheme: (theme: ThemeId) => void
  focusMinutes: number
  onChangeFocusMinutes: (mins: number) => void
  dailyGoalHours: number
  onChangeDailyGoalHours: (hours: number) => void
}

export function ThemeCustomizer({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  focusMinutes,
  onChangeFocusMinutes,
  dailyGoalHours,
  onChangeDailyGoalHours
}: ThemeCustomizerProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card theme-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <PaletteIcon size={20} color="var(--accent-primary)" />
            <div>
              <h2 className="modal-title">Customize Appearance & Goals</h2>
              <p className="modal-subtitle">Personalize your study space aesthetic</p>
            </div>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Theme Presets Grid */}
        <div className="theme-section">
          <span className="section-label">Aesthetic Color Themes</span>
          <div className="theme-cards-grid">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const theme = THEMES[id]
              const isSelected = currentTheme === id

              return (
                <div
                  key={id}
                  className={`theme-card-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectTheme(id)}
                >
                  <div
                    className="theme-card-preview"
                    style={{
                      background: theme.bgPrimary,
                      borderColor: theme.border
                    }}
                  >
                    <div className="theme-color-swatches">
                      <span className="swatch" style={{ backgroundColor: theme.bgSurface }} />
                      <span className="swatch" style={{ backgroundColor: theme.accent }} />
                      <span className="swatch" style={{ backgroundColor: theme.textPrimary }} />
                    </div>
                    {isSelected && (
                      <div className="theme-check-badge">
                        <CheckIcon size={12} color="#ffffff" />
                      </div>
                    )}
                  </div>
                  <span className="theme-name-label">{theme.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Productivity Preferences */}
        <div className="preferences-section">
          <span className="section-label">Study Preferences</span>

          {/* Pomodoro Focus Duration */}
          <div className="pref-row">
            <div>
              <span className="pref-title">Default Focus Length</span>
              <span className="pref-desc">Minutes per Pomodoro study sprint</span>
            </div>
            <div className="pref-pills">
              {[20, 25, 30, 45, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`pref-pill ${focusMinutes === mins ? 'active' : ''}`}
                  onClick={() => onChangeFocusMinutes(mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Daily Study Target */}
          <div className="pref-row" style={{ marginTop: '14px' }}>
            <div>
              <span className="pref-title">Daily Study Goal</span>
              <span className="pref-desc">Hours target per day</span>
            </div>
            <div className="pref-slider-wrap">
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={dailyGoalHours}
                onChange={(e) => onChangeDailyGoalHours(Number(e.target.value))}
                className="aesthetic-range"
              />
              <span className="pref-val-badge">{dailyGoalHours} hrs / day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
