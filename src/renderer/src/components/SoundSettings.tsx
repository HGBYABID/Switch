import { useState } from 'react'
import { audioEngine, EQ_PRESETS, EQ_BAND_LABELS } from '../audioEngine'

interface SoundSettingsProps {
  isOpen: boolean
  onClose: () => void
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  preservesPitch: boolean
  onPreservesPitchChange: (preserve: boolean) => void
}

export function SoundSettings({
  isOpen,
  onClose,
  playbackRate,
  onPlaybackRateChange,
  preservesPitch,
  onPreservesPitchChange
}: SoundSettingsProps) {
  const [bands, setBands] = useState<[number, number, number, number, number]>([
    ...audioEngine.currentBands
  ])
  const [currentPreset, setCurrentPreset] = useState<string>(audioEngine.currentPreset)
  const [bassBoost, setBassBoost] = useState<number>(audioEngine.bassBoostDb)
  const [pan, setPan] = useState<number>(audioEngine.pan)
  const [spatialEnabled, setSpatialEnabled] = useState<boolean>(audioEngine.spatialEnabled)
  const [spatialIntensity, setSpatialIntensity] = useState<number>(audioEngine.spatialIntensity)
  const [activeTab, setActiveTab] = useState<'eq' | 'effects' | 'playback'>('eq')

  if (!isOpen) return null

  const handleBandChange = (index: number, val: number) => {
    const updated = [...bands] as [number, number, number, number, number]
    updated[index] = val
    setBands(updated)
    setCurrentPreset('custom')
    audioEngine.setBandGain(index, val)
  }

  const handlePresetSelect = (presetName: string) => {
    audioEngine.setPreset(presetName)
    setCurrentPreset(presetName)
    setBands([...audioEngine.currentBands])
  }

  const handleResetEq = () => {
    audioEngine.resetEq()
    setCurrentPreset('flat')
    setBands([0, 0, 0, 0, 0])
  }

  const handleBassBoostChange = (val: number) => {
    setBassBoost(val)
    audioEngine.setBassBoost(val)
  }

  const handlePanChange = (val: number) => {
    setPan(val)
    audioEngine.setPan(val)
  }

  const handleSpatialToggle = (checked: boolean) => {
    setSpatialEnabled(checked)
    audioEngine.setSpatial(checked, spatialIntensity)
  }

  const handleSpatialIntensityChange = (val: number) => {
    setSpatialIntensity(val)
    audioEngine.setSpatial(spatialEnabled, val)
  }

  const handleResetAll = () => {
    handleResetEq()
    handleBassBoostChange(0)
    handlePanChange(0)
    handleSpatialToggle(false)
    onPlaybackRateChange(1.0)
    onPreservesPitchChange(true)
  }

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Sound Settings"
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-group">
            <span className="settings-icon">🎛️</span>
            <div>
              <h2 className="settings-title">Sound Settings</h2>
              <p className="settings-subtitle">Equalizer, Spatial Acoustics & Speed</p>
            </div>
          </div>
          <div className="settings-header-actions">
            <button
              type="button"
              className="btn-text-subtle"
              onClick={handleResetAll}
              title="Reset all settings to default"
            >
              Reset All
            </button>
            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'eq' ? 'active' : ''}`}
            onClick={() => setActiveTab('eq')}
          >
            Equalizer
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'effects' ? 'active' : ''}`}
            onClick={() => setActiveTab('effects')}
          >
            Acoustics & Pan
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'playback' ? 'active' : ''}`}
            onClick={() => setActiveTab('playback')}
          >
            Playback Speed
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-body">
          {/* TAB 1: EQUALIZER */}
          {activeTab === 'eq' && (
            <div className="tab-pane">
              {/* Presets Chips */}
              <div className="preset-chips-section">
                <span className="section-label">Presets</span>
                <div className="preset-chips-list">
                  {EQ_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className={`preset-chip ${currentPreset === p.name ? 'active' : ''}`}
                      onClick={() => handlePresetSelect(p.name)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5-Band Vertical Slider Board */}
              <div className="eq-board">
                <div className="eq-db-axis">
                  <span>+12 dB</span>
                  <span>0 dB</span>
                  <span>-12 dB</span>
                </div>

                <div className="eq-sliders-row">
                  {bands.map((gain, idx) => (
                    <div key={EQ_BAND_LABELS[idx]} className="eq-band-col">
                      <span className="eq-band-gain">{gain > 0 ? `+${gain}` : gain}</span>
                      <div className="eq-slider-track-wrap">
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={1}
                          value={gain}
                          onChange={(e) => handleBandChange(idx, Number(e.target.value))}
                          className="eq-slider-vertical"
                          aria-label={`Gain for ${EQ_BAND_LABELS[idx]}`}
                        />
                      </div>
                      <span className="eq-band-label">{EQ_BAND_LABELS[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast Bass Boost slider */}
              <div className="setting-row" style={{ marginTop: '16px' }}>
                <div className="setting-info">
                  <span className="setting-title">Bass Punch Boost</span>
                  <span className="setting-desc">Low-end punch (90 Hz)</span>
                </div>
                <div className="setting-control-slider">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={bassBoost}
                    onChange={(e) => handleBassBoostChange(Number(e.target.value))}
                    className="aesthetic-range"
                  />
                  <span className="slider-val-badge">+{bassBoost} dB</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EFFECTS & ACOUSTICS */}
          {activeTab === 'effects' && (
            <div className="tab-pane">
              {/* Stereo Balance (Pan) */}
              <div className="setting-card">
                <div className="setting-card-header">
                  <div>
                    <span className="setting-title">Stereo Balance</span>
                    <span className="setting-desc">Pan sound between left and right channels</span>
                  </div>
                  <button type="button" className="btn-tiny" onClick={() => handlePanChange(0)}>
                    Center
                  </button>
                </div>
                <div className="pan-slider-wrap">
                  <span className="pan-endpoint">L</span>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={pan}
                    onChange={(e) => handlePanChange(Number(e.target.value))}
                    className="aesthetic-range"
                  />
                  <span className="pan-endpoint">R</span>
                  <span className="slider-val-badge">
                    {pan === 0
                      ? 'Center'
                      : pan < 0
                        ? `L ${Math.round(Math.abs(pan) * 100)}%`
                        : `R ${Math.round(pan * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Spatial Ambience */}
              <div className="setting-card">
                <div className="setting-card-header">
                  <div>
                    <span className="setting-title">Spatial Room Ambience</span>
                    <span className="setting-desc">
                      Warm acoustic reflections for immersive sound
                    </span>
                  </div>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={spatialEnabled}
                      onChange={(e) => handleSpatialToggle(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {spatialEnabled && (
                  <div className="setting-control-slider" style={{ marginTop: '14px' }}>
                    <span className="setting-desc">Atmosphere Depth</span>
                    <input
                      type="range"
                      min={0.1}
                      max={0.8}
                      step={0.05}
                      value={spatialIntensity}
                      onChange={(e) => handleSpatialIntensityChange(Number(e.target.value))}
                      className="aesthetic-range"
                    />
                    <span className="slider-val-badge">{Math.round(spatialIntensity * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYBACK SPEED */}
          {activeTab === 'playback' && (
            <div className="tab-pane">
              <div className="setting-card">
                <div className="setting-card-header">
                  <div>
                    <span className="setting-title">Speed Multiplier</span>
                    <span className="setting-desc">Tempo adjustment</span>
                  </div>
                  <span className="speed-current-badge">{playbackRate.toFixed(2)}x</span>
                </div>

                {/* Quick Speed Pills */}
                <div className="speed-pills-row">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`speed-pill ${playbackRate === rate ? 'active' : ''}`}
                      onClick={() => onPlaybackRateChange(rate)}
                    >
                      {rate === 1.0 ? 'Normal (1.0x)' : `${rate}x`}
                    </button>
                  ))}
                </div>

                {/* Fine Speed Slider */}
                <div className="setting-control-slider" style={{ marginTop: '16px' }}>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={playbackRate}
                    onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
                    className="aesthetic-range"
                  />
                </div>
              </div>

              {/* Pitch Preservation Toggle */}
              <div className="setting-card" style={{ marginTop: '12px' }}>
                <div className="setting-card-header">
                  <div>
                    <span className="setting-title">Preserve Pitch</span>
                    <span className="setting-desc">
                      Keep original pitch when speed changes (disable for vinyl pitch warp)
                    </span>
                  </div>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={preservesPitch}
                      onChange={(e) => onPreservesPitchChange(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
