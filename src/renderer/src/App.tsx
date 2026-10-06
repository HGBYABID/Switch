import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  SongItem,
  Subject,
  StudySession,
  PlantedTree,
  ThemeId,
  AppTab
} from './types'
import { audioEngine } from './audioEngine'
import { THEMES, applyTheme } from './themes'
import { Visualizer } from './components/Visualizer'
import { SoundSettings } from './components/SoundSettings'
import { Dashboard } from './components/Dashboard'
import { Pomodoro } from './components/Pomodoro'
import { Stopwatch } from './components/Stopwatch'
import { CountdownTimer } from './components/CountdownTimer'
import { Forest } from './components/Forest'
import { Analytics } from './components/Analytics'
import { SubjectManager } from './components/SubjectManager'
import { ThemeCustomizer } from './components/ThemeCustomizer'
import { OnboardingModal } from './components/OnboardingModal'
import switchHumanSound from './assets/switch.mp3'
import switchHollowSound from './assets/switch_zangetsu.mp3'
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  ShuffleIcon,
  LoopIcon,
  VolumeIcon,
  EqualizerIcon,
  FolderIcon,
  RefreshIcon,
  SearchIcon,
  MusicIcon,
  DashboardIcon,
  PomodoroIcon,
  StopwatchIcon,
  TimerIcon,
  TreeIcon,
  ChartPieIcon,
  PaletteIcon,
  BookOpenIcon,
  HeartIcon,
  SparklesIcon,
  ArrowUpRightIcon
} from './components/Icons'
import { getTrackVisualTheme, formatTime } from './utils/artUtils'
import './assets/main.css'

// Default Starter Subjects
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', color: '#c6ff00', createdAt: 1700000000000 },
  { id: 'cs', name: 'Computer Science', color: '#38bdf8', createdAt: 1700000010000 },
  { id: 'lit', name: 'Literature & Writing', color: '#ff782d', createdAt: 1700000020000 },
  { id: 'lang', name: 'Languages', color: '#10b981', createdAt: 1700000030000 },
  { id: 'science', name: 'Natural Sciences', color: '#f43f5e', createdAt: 1700000040000 }
]

// Zero hardcoded sessions or trees - everything starts strictly at zero
const DEFAULT_SESSIONS: StudySession[] = []
const DEFAULT_TREES: PlantedTree[] = []

export default function App() {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      const saved = localStorage.getItem('study_active_tab') as AppTab
      if (['dashboard', 'pomodoro', 'stopwatch', 'timer', 'forest', 'analytics', 'music'].includes(saved)) {
        return saved
      }
    } catch {
      // Ignore
    }
    return 'dashboard'
  })

  // Theme Configuration (Defaults to obsidian - Electric Lime & Obsidian from Image 1)
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('study_theme') as ThemeId
      if (saved && THEMES[saved]) return saved
    } catch {
      // Ignore
    }
    return 'obsidian'
  })

  const [focusMinutes, setFocusMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('study_focus_minutes')
      return saved ? parseInt(saved, 10) : 25
    } catch {
      return 25
    }
  })

  const [dailyGoalHours, setDailyGoalHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('study_daily_goal')
      return saved ? parseFloat(saved) : 3
    } catch {
      return 3
    }
  })

  // Subjects Management
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('study_subjects')
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS
    } catch {
      return DEFAULT_SUBJECTS
    }
  })

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('study_selected_subject_id')
      if (saved && subjects.some((s) => s.id === saved)) return saved
    } catch {
      // Ignore
    }
    return subjects[0]?.id || 'math'
  })

  // Sessions and Forest Tracking (Purge mock data, strictly starts at zero)
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem('study_sessions')
      if (saved) {
        const parsed: StudySession[] = JSON.parse(saved)
        return parsed.filter((s) => !s.id.startsWith('init-'))
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SESSIONS
  })

  const [plantedTrees, setPlantedTrees] = useState<PlantedTree[]>(() => {
    try {
      const saved = localStorage.getItem('study_trees')
      if (saved) {
        const parsed: PlantedTree[] = JSON.parse(saved)
        return parsed.filter((t) => !t.id.startsWith('tree-init-'))
      }
    } catch {
      // Ignore
    }
    return DEFAULT_TREES
  })

  // User Profile (Stored safely in userData outside app code)
  const [userProfile, setUserProfile] = useState<{ humanName: string; hollowName: string } | null>(null)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false)

  // The Switch: Dual Persona State (Human Focus vs Hollow Unleashed Mode)
  const [isHollowMode, setIsHollowMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('study_hollow_mode') === 'true'
    } catch {
      return false
    }
  })
  const [isSwitchFlashing, setIsSwitchFlashing] = useState<boolean>(false)

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false)

  // Music Player State
  const [songs, setSongs] = useState<SongItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string>('/home/abid/Desktop/songs')
  const [isLoadingSongs, setIsLoadingSongs] = useState<boolean>(true)
  const [musicSearchQuery, setMusicSearchQuery] = useState<string>('')
  const [musicFormatFilter, setMusicFormatFilter] = useState<'all' | 'MP3' | 'M4A' | 'favorites'>('all')
  const [musicSortBy, setMusicSortBy] = useState<'title' | 'artist' | 'size'>('title')

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('study_music_favorites')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Audio Playback State
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [volume, setVolume] = useState<number>(0.85)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [loopMode, setLoopMode] = useState<'none' | 'all' | 'one'>('all')
  const [isShuffle, setIsShuffle] = useState<boolean>(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const [preservesPitch, setPreservesPitch] = useState<boolean>(true)
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave'>('bars')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Apply Theme on change
  useEffect(() => {
    applyTheme(currentTheme)
    try {
      localStorage.setItem('study_theme', currentTheme)
    } catch {
      // Ignore
    }
  }, [currentTheme])

  // Save Tab
  useEffect(() => {
    try {
      localStorage.setItem('study_active_tab', activeTab)
    } catch {
      // Ignore
    }
  }, [activeTab])

  // Save Subjects
  useEffect(() => {
    try {
      localStorage.setItem('study_subjects', JSON.stringify(subjects))
    } catch {
      // Ignore
    }
  }, [subjects])

  // Save Selected Subject
  useEffect(() => {
    try {
      localStorage.setItem('study_selected_subject_id', selectedSubjectId)
    } catch {
      // Ignore
    }
  }, [selectedSubjectId])

  // Save Sessions
  useEffect(() => {
    try {
      localStorage.setItem('study_sessions', JSON.stringify(sessions))
    } catch {
      // Ignore
    }
  }, [sessions])

  // Save Planted Trees
  useEffect(() => {
    try {
      localStorage.setItem('study_trees', JSON.stringify(plantedTrees))
    } catch {
      // Ignore
    }
  }, [plantedTrees])

  // Save Music Favorites
  useEffect(() => {
    try {
      localStorage.setItem('study_music_favorites', JSON.stringify(Array.from(favorites)))
    } catch {
      // Ignore
    }
  }, [favorites])

  // Save Focus sprint minutes
  useEffect(() => {
    try {
      localStorage.setItem('study_focus_minutes', String(focusMinutes))
    } catch {
      // Ignore
    }
  }, [focusMinutes])

  // Save Daily Goal
  useEffect(() => {
    try {
      localStorage.setItem('study_daily_goal', String(dailyGoalHours))
    } catch {
      // Ignore
    }
  }, [dailyGoalHours])

  // Load User Profile on startup from persistent user data (outside app code)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (window.api && window.api.getUserProfile) {
          const profile = await window.api.getUserProfile()
          if (profile && profile.humanName && profile.hollowName) {
            setUserProfile(profile)
          } else {
            setIsOnboardingOpen(true)
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
      }
    }
    loadProfile()
  }, [])

  const handleOnboardingComplete = async (humanName: string, hollowName: string) => {
    const profile = { humanName, hollowName }
    setUserProfile(profile)
    setIsOnboardingOpen(false)
    try {
      if (window.api && window.api.saveUserProfile) {
        await window.api.saveUserProfile(profile)
      }
    } catch (err) {
      console.error('Failed to save user profile:', err)
    }
  }

  // Toggle THE SWITCH between Human Focus and Hollow Mode
  const handleToggleSwitch = () => {
    const nextMode = !isHollowMode
    setIsHollowMode(nextMode)
    try {
      localStorage.setItem('study_hollow_mode', String(nextMode))
    } catch {
      // Ignore
    }

    // High voltage screen flash
    setIsSwitchFlashing(true)
    setTimeout(() => setIsSwitchFlashing(false), 350)

    // Voice lines / sound effect
    try {
      const soundToPlay = nextMode ? switchHollowSound : switchHumanSound
      const audio = new Audio(soundToPlay)
      audio.volume = 0.95
      audio.play().catch((err) => console.warn('Could not play switch voice line:', err))
    } catch (err) {
      console.warn('Switch audio error:', err)
    }
  }

  // Selected Subject object
  const currentSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null
  }, [subjects, selectedSubjectId])

  // Total Study Minutes
  const totalStudyMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [sessions])

  // Load songs from active directory
  const loadSongs = async (folder?: string) => {
    setIsLoadingSongs(true)
    try {
      const target = folder || currentFolder
      if (window.api && window.api.getSongs) {
        const list = await window.api.getSongs(target)
        setSongs(list)
      } else {
        // Fallback demo songs if viewed outside electron
        setSongs([
          {
            id: 'demo-1',
            title: 'Lofi Study Beats',
            artist: 'Chillhop Music',
            filename: 'Lofi Study Beats.mp3',
            path: '/home/abid/Desktop/songs/Lofi Study Beats.mp3',
            url: '',
            size: 8502526,
            sizeFormatted: '8.1 MB',
            extension: 'MP3',
            mtime: Date.now()
          },
          {
            id: 'demo-2',
            title: 'Deep Focus Ambient',
            artist: 'Zenith Sound',
            filename: 'Deep Focus Ambient.mp3',
            path: '/home/abid/Desktop/songs/Deep Focus Ambient.mp3',
            url: '',
            size: 6899335,
            sizeFormatted: '6.5 MB',
            extension: 'MP3',
            mtime: Date.now()
          }
        ])
      }
    } catch (e) {
      console.error('Failed to load songs:', e)
    } finally {
      setIsLoadingSongs(false)
    }
  }

  useEffect(() => {
    loadSongs()
  }, [currentFolder])

  // Current active song object
  const currentSong = currentSongIndex >= 0 && currentSongIndex < songs.length ? songs[currentSongIndex] : null

  // Ensure Audio Engine initialization
  const ensureAudioEngineInit = async () => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current)
      await audioEngine.resume()
    }
  }

  // Play Song by index
  const playSongAtIndex = async (index: number) => {
    if (index < 0 || index >= songs.length) return
    const song = songs[index]
    setCurrentSongIndex(index)
    setIsPlaying(true)

    await ensureAudioEngineInit()

    if (audioRef.current) {
      if (audioRef.current.src !== song.url) {
        audioRef.current.src = song.url
      }
      audioRef.current.playbackRate = playbackRate
      // @ts-ignore
      audioRef.current.preservesPitch = preservesPitch
      try {
        await audioRef.current.play()
      } catch (err) {
        console.warn('Playback error:', err)
      }
    }
  }

  // Toggle Play / Pause
  const togglePlayPause = async () => {
    if (!currentSong) {
      if (songs.length > 0) {
        playSongAtIndex(0)
      }
      return
    }

    await ensureAudioEngineInit()

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (e) {
          console.warn('Play error:', e)
        }
      }
    }
  }

  // Next Track
  const playNextTrack = () => {
    if (songs.length === 0) return

    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * songs.length)
      playSongAtIndex(nextIdx)
      return
    }

    if (currentSongIndex < songs.length - 1) {
      playSongAtIndex(currentSongIndex + 1)
    } else if (loopMode === 'all') {
      playSongAtIndex(0)
    } else {
      setIsPlaying(false)
    }
  }

  // Previous Track
  const playPrevTrack = () => {
    if (songs.length === 0) return

    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      return
    }

    if (currentSongIndex > 0) {
      playSongAtIndex(currentSongIndex - 1)
    } else if (loopMode === 'all') {
      playSongAtIndex(songs.length - 1)
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    }
  }

  // Handle Track Completion
  const handleAudioEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else {
      playNextTrack()
    }
  }

  // Volume & Mute
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    setIsMuted(newVol === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      if (audioRef.current) {
        audioRef.current.volume = volume || 0.5
      }
    } else {
      setIsMuted(true)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
    }
  }

  const cycleLoopMode = () => {
    if (loopMode === 'none') setLoopMode('all')
    else if (loopMode === 'all') setLoopMode('one')
    else setLoopMode('none')
  }

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleSelectFolder = async () => {
    if (window.api && window.api.selectFolder) {
      const selected = await window.api.selectFolder()
      if (selected) {
        setCurrentFolder(selected)
      }
    }
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Add / Delete Subject Handlers
  const handleAddSubject = (name: string, color: string) => {
    const newSub: Subject = {
      id: 'sub_' + Date.now(),
      name,
      color,
      createdAt: Date.now()
    }
    setSubjects((prev) => [...prev, newSub])
    setSelectedSubjectId(newSub.id)
  }

  const handleDeleteSubject = (id: string) => {
    if (subjects.length <= 1) return
    setSubjects((prev) => prev.filter((s) => s.id !== id))
    if (selectedSubjectId === id) {
      const remaining = subjects.filter((s) => s.id !== id)
      if (remaining[0]) setSelectedSubjectId(remaining[0].id)
    }
  }

  // Session Completed Handlers
  const handlePomodoroComplete = (
    durationMins: number,
    _mode: 'pomodoro',
    treeSpecies: PlantedTree['species']
  ) => {
    const sub = currentSubject || {
      id: 'general',
      name: 'General Focus',
      color: '#c6ff00'
    }

    const newSess: StudySession = {
      id: 'sess_' + Date.now(),
      subjectId: sub.id,
      subjectName: sub.name,
      subjectColor: sub.color,
      durationMinutes: durationMins,
      mode: 'pomodoro',
      timestamp: Date.now(),
      treeType: treeSpecies
    }
    setSessions((prev) => [newSess, ...prev])

    // Plant tree in the forest
    const growthStage: 1 | 2 | 3 | 4 = durationMins >= 45 ? 4 : durationMins >= 25 ? 3 : 2
    const newTree: PlantedTree = {
      id: 'tree_' + Date.now(),
      species: treeSpecies,
      subjectId: sub.id,
      subjectName: sub.name,
      subjectColor: sub.color,
      durationMinutes: durationMins,
      plantedAt: Date.now(),
      growthStage
    }
    setPlantedTrees((prev) => [newTree, ...prev])
  }

  const handleStudySessionComplete = (durationMins: number, mode: 'stopwatch' | 'timer') => {
    if (durationMins < 1) return
    const sub = currentSubject || {
      id: 'general',
      name: 'General Focus',
      color: '#c6ff00'
    }

    const newSess: StudySession = {
      id: 'sess_' + Date.now(),
      subjectId: sub.id,
      subjectName: sub.name,
      subjectColor: sub.color,
      durationMinutes: durationMins,
      mode,
      timestamp: Date.now()
    }
    setSessions((prev) => [newSess, ...prev])

    if (durationMins >= 10) {
      const speciesPool: PlantedTree['species'][] = ['bonsai', 'pine', 'oak', 'willow', 'sakura']
      const chosenSpecies = speciesPool[Math.floor(Math.random() * speciesPool.length)]
      const growthStage: 1 | 2 | 3 | 4 = durationMins >= 45 ? 4 : durationMins >= 20 ? 3 : 2
      const newTree: PlantedTree = {
        id: 'tree_' + Date.now(),
        species: chosenSpecies,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectColor: sub.color,
        durationMinutes: durationMins,
        plantedAt: Date.now(),
        growthStage
      }
      setPlantedTrees((prev) => [newTree, ...prev])
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  // Filter & Sort Songs in Music Tab
  const filteredSongs = useMemo(() => {
    return songs
      .filter((song) => {
        if (musicSearchQuery) {
          const q = musicSearchQuery.toLowerCase()
          const matches =
            song.title.toLowerCase().includes(q) ||
            song.artist.toLowerCase().includes(q) ||
            song.filename.toLowerCase().includes(q)
          if (!matches) return false
        }

        if (musicFormatFilter === 'MP3') return song.extension === 'MP3'
        if (musicFormatFilter === 'M4A') return song.extension === 'M4A'
        if (musicFormatFilter === 'favorites') return favorites.has(song.id)

        return true
      })
      .sort((a, b) => {
        if (musicSortBy === 'title') return a.title.localeCompare(b.title)
        if (musicSortBy === 'artist') return a.artist.localeCompare(b.artist)
        if (musicSortBy === 'size') return b.size - a.size
        return 0
      })
  }, [songs, musicSearchQuery, musicFormatFilter, musicSortBy, favorites])

  // Track Artwork Visual Theme
  const currentArtTheme = useMemo(() => {
    return currentSong ? getTrackVisualTheme(currentSong.title || currentSong.filename) : null
  }, [currentSong])

  return (
    <div className={`startup-app-viewport ${isHollowMode ? 'hollow-active' : ''}`}>
      {isSwitchFlashing && <div className="switch-screen-flash" />}

      {/* Hidden Persistent Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onEnded={handleAudioEnded}
      />

      {/* =========================================================================
          LEFT FLOATING SIDEBAR NAVIGATION (iDraft / Image 3 Luxury Style)
          ========================================================================= */}
      <aside className="startup-sidebar">
        {/* Brand Logo & Glow */}
        <div className="sidebar-brand-block" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-symbol-box">
            <SparklesIcon size={20} color={isHollowMode ? '#ff1a40' : 'var(--accent-primary)'} />
          </div>
          <div className="brand-title-wrap">
            <div className="brand-name-row">
              <span className="brand-heavy-title">SWITCH</span>
              <span className={`brand-sub-tag ${isHollowMode ? 'hollow' : ''}`}>
                {isHollowMode ? 'HOLLOW' : 'HUMAN'}
              </span>
            </div>
            <span className="brand-micro-tag">
              {userProfile
                ? (isHollowMode ? userProfile.hollowName : userProfile.humanName)
                : 'STUDY ECOSYSTEM'}
            </span>
          </div>
        </div>

        {/* Primary Navigation Rail */}
        <nav className="sidebar-nav-group">
          <span className="sidebar-group-title">WORKSPACE</span>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <DashboardIcon size={17} />
            <span className="nav-label-text">Dashboard</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'pomodoro' ? 'active' : ''}`}
            onClick={() => setActiveTab('pomodoro')}
          >
            <PomodoroIcon size={17} />
            <span className="nav-label-text">Pomodoro</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'stopwatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('stopwatch')}
          >
            <StopwatchIcon size={17} />
            <span className="nav-label-text">Stopwatch</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            <TimerIcon size={17} />
            <span className="nav-label-text">Countdown</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'forest' ? 'active' : ''}`}
            onClick={() => setActiveTab('forest')}
          >
            <TreeIcon size={17} />
            <span className="nav-label-text">Forest Grove</span>
            {plantedTrees.length > 0 && <span className="nav-pill-count">{plantedTrees.length}</span>}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <ChartPieIcon size={17} />
            <span className="nav-label-text">Analytics</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'music' ? 'active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            <MusicIcon size={17} />
            <span className="nav-label-text">Audio Studio</span>
            {isPlaying && <span className="sidebar-live-wave-dot" />}
          </button>
        </nav>

        {/* Secondary Utility Controls */}
        <div className="sidebar-footer-group">
          <span className="sidebar-group-title">SETTINGS & TOOLS</span>

          <button
            type="button"
            className="sidebar-util-btn"
            onClick={() => setIsSubjectModalOpen(true)}
            title="Subjects Manager"
          >
            <BookOpenIcon size={16} />
            <span>Subjects</span>
            <span className="util-badge">{subjects.length}</span>
          </button>

          <button
            type="button"
            className="sidebar-util-btn"
            onClick={() => setIsThemeModalOpen(true)}
            title="Theme & Study Preferences"
          >
            <PaletteIcon size={16} />
            <span>Themes & Goals</span>
          </button>

          <button
            type="button"
            className="sidebar-util-btn"
            onClick={() => setIsSoundSettingsOpen(true)}
            title="Equalizer & 3D Spatial Audio"
          >
            <EqualizerIcon size={16} />
            <span>Equalizer & EQ</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE BODY
          ========================================================================= */}
      <div className="startup-main-wrapper">
        {/* Top Floating Header Bar (Image 1 & 2 Style) */}
        <header className="startup-top-bar">
          <div className="topbar-left-cluster">
            <span className="view-breadcrumb-title">
              {activeTab === 'dashboard'
                ? 'Overview'
                : activeTab === 'pomodoro'
                ? 'Pomodoro Focus'
                : activeTab === 'stopwatch'
                ? 'Precision Stopwatch'
                : activeTab === 'timer'
                ? 'Countdown Dial'
                : activeTab === 'forest'
                ? 'Nature Grove'
                : activeTab === 'analytics'
                ? 'Study Insights'
                : 'Audio Library'}
            </span>

            {/* Active Subject Pill with Quick Dropdown / Switch */}
            {currentSubject && (
              <button
                type="button"
                className="topbar-subject-tag"
                onClick={() => setIsSubjectModalOpen(true)}
                title="Switch active subject"
              >
                <span className="subject-dot" style={{ backgroundColor: currentSubject.color }} />
                <span>{currentSubject.name}</span>
                <span className="tag-switch-arrow">▼</span>
              </button>
            )}
          </div>

          {/* Center Timeline / Goal Progress Pill (Image 2 Style) */}
          <div className="topbar-center-pill">
            <div className="pill-status-dot" />
            <span className="pill-text-primary">
              Daily Target: <strong>{dailyGoalHours} hrs</strong>
            </span>
            <span className="pill-divider">|</span>
            <span className="pill-text-sub">
              {(totalStudyMinutes / 60).toFixed(1)} hrs total
            </span>
          </div>

          {/* Right Action Tools */}
          <div className="topbar-right-tools">
            {/* Persona Status Pill */}
            {userProfile && (
              <div className={`persona-status-pill ${isHollowMode ? 'hollow' : ''}`}>
                <span
                  className="subject-dot"
                  style={{ backgroundColor: isHollowMode ? '#ff1a40' : 'var(--accent-primary)' }}
                />
                <span className="persona-mode-label">
                  {isHollowMode ? 'HOLLOW:' : 'HUMAN:'}
                </span>
                <span className="persona-name-display">
                  {isHollowMode ? userProfile.hollowName : userProfile.humanName}
                </span>
              </div>
            )}

            {/* THE SIGNATURE SWITCH BUTTON */}
            <button
              type="button"
              className={`switch-persona-btn ${isHollowMode ? 'hollow-active-btn' : ''}`}
              onClick={handleToggleSwitch}
              title={isHollowMode ? 'Switch back to Human Focus' : 'Unleash Hollow Persona Mode'}
            >
              <span>⚡</span>
              <span>{isHollowMode ? 'SWITCH TO HUMAN' : 'THE SWITCH'}</span>
            </button>

            <button
              type="button"
              className="topbar-quick-action-btn primary"
              onClick={() => setActiveTab('pomodoro')}
            >
              <SparklesIcon size={14} />
              <span>Sprint Focus</span>
              <ArrowUpRightIcon size={13} />
            </button>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => setIsThemeModalOpen(true)}
              title="Change Theme"
            >
              <PaletteIcon size={17} />
            </button>

            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => setIsSoundSettingsOpen(true)}
              title="Sound Studio & EQ"
            >
              <EqualizerIcon size={17} />
            </button>
          </div>
        </header>

        {/* Scrollable Main Viewport */}
        <main className="startup-workspace-scroll">
          {activeTab === 'dashboard' && (
            <Dashboard
              subjects={subjects}
              sessions={sessions}
              trees={plantedTrees}
              currentSubject={currentSubject}
              dailyGoalHours={dailyGoalHours}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onTogglePlayPause={togglePlayPause}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
              onOpenThemeModal={() => setIsThemeModalOpen(true)}
            />
          )}

          {activeTab === 'pomodoro' && (
            <Pomodoro
              selectedSubject={currentSubject}
              onOpenSubjectManager={() => setIsSubjectModalOpen(true)}
              onSessionComplete={handlePomodoroComplete}
              focusDurationMinutes={focusMinutes}
            />
          )}

          {activeTab === 'stopwatch' && (
            <Stopwatch
              selectedSubject={currentSubject}
              onOpenSubjectManager={() => setIsSubjectModalOpen(true)}
              onSessionComplete={handleStudySessionComplete}
            />
          )}

          {activeTab === 'timer' && (
            <CountdownTimer
              selectedSubject={currentSubject}
              onOpenSubjectManager={() => setIsSubjectModalOpen(true)}
              onSessionComplete={handleStudySessionComplete}
            />
          )}

          {activeTab === 'forest' && (
            <Forest trees={plantedTrees} totalStudyMinutes={totalStudyMinutes} />
          )}

          {activeTab === 'analytics' && (
            <Analytics
              subjects={subjects}
              sessions={sessions}
              onDeleteSession={handleDeleteSession}
            />
          )}

          {activeTab === 'music' && (
            <div className="music-tab-view">
              {/* Top Toolbar */}
              <div className="music-toolbar">
                <div className="music-search-wrap">
                  <SearchIcon size={16} className="search-icon-inside" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists..."
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    className="music-search-input"
                  />
                </div>

                {/* Filter Chips */}
                <div className="music-filter-chips">
                  {(['all', 'MP3', 'M4A', 'favorites'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filter-chip ${musicFormatFilter === filter ? 'active' : ''}`}
                      onClick={() => setMusicFormatFilter(filter)}
                    >
                      {filter === 'favorites' ? 'Favorites' : filter.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Folder Selector and Refresh */}
                <div className="music-folder-controls">
                  <button
                    type="button"
                    className="secondary-pill-btn"
                    onClick={handleSelectFolder}
                    title={currentFolder}
                  >
                    <FolderIcon size={15} />
                    <span>Browse Folder</span>
                  </button>

                  <button
                    type="button"
                    className="secondary-pill-btn icon-only"
                    onClick={() => loadSongs()}
                    title="Reload folder"
                  >
                    <RefreshIcon size={15} />
                  </button>
                </div>
              </div>

              {/* Split View */}
              <div className="music-split-layout">
                {/* Left Vinyl Artwork & Realtime Spectrum */}
                <div className="music-nowplaying-card">
                  <div
                    className="card-artwork-banner"
                    style={{
                      background: currentArtTheme
                        ? currentArtTheme.bg
                        : 'linear-gradient(135deg, var(--accent-primary) 0%, #1e1b4b 100%)'
                    }}
                  >
                    <div className="artwork-center-icon">
                      <MusicIcon size={48} color="#ffffff" />
                    </div>
                  </div>

                  <div className="nowplaying-details">
                    <h3 className="nowplaying-title">
                      {currentSong ? currentSong.title : 'Select a track to study with'}
                    </h3>
                    <p className="nowplaying-artist">
                      {currentSong ? currentSong.artist : 'Atmospheric focus sounds'}
                    </p>
                  </div>

                  {/* Realtime Audio Visualizer */}
                  <div className="embedded-visualizer-container">
                    <div className="visualizer-header-row">
                      <span className="visualizer-label">Realtime Spectrum</span>
                      <button
                        type="button"
                        className="visualizer-mode-toggle"
                        onClick={() =>
                          setVisualizerMode((prev) => (prev === 'bars' ? 'wave' : 'bars'))
                        }
                      >
                        {visualizerMode === 'bars' ? 'Waveform' : 'Bars'}
                      </button>
                    </div>
                    <Visualizer isPlaying={isPlaying} mode={visualizerMode} />
                  </div>
                </div>

                {/* Right Tracks List Table */}
                <div className="music-tracks-container">
                  <div className="tracks-header-row">
                    <span className="th-col col-idx">#</span>
                    <span
                      className="th-col col-title"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMusicSortBy('title')}
                      title="Sort by Title"
                    >
                      Title {musicSortBy === 'title' ? '•' : ''}
                    </span>
                    <span
                      className="th-col col-artist"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMusicSortBy('artist')}
                      title="Sort by Artist"
                    >
                      Artist {musicSortBy === 'artist' ? '•' : ''}
                    </span>
                    <span
                      className="th-col col-size"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMusicSortBy('size')}
                      title="Sort by Size"
                    >
                      Size {musicSortBy === 'size' ? '•' : ''}
                    </span>
                    <span className="th-col col-fav">Fav</span>
                  </div>

                  {isLoadingSongs ? (
                    <div className="tracks-loading-state">
                      <RefreshIcon size={24} className="spinning-icon" />
                      <p>Loading tracks from library...</p>
                    </div>
                  ) : filteredSongs.length === 0 ? (
                    <div className="tracks-empty-state">
                      <MusicIcon size={36} color="var(--text-muted)" />
                      <p>No audio files found matching criteria.</p>
                      <button type="button" className="secondary-pill-btn" onClick={handleSelectFolder}>
                        Select another folder
                      </button>
                    </div>
                  ) : (
                    <div className="tracks-scroll-list">
                      {filteredSongs.map((song, idx) => {
                        const isCurrent = currentSong?.id === song.id
                        const isFav = favorites.has(song.id)

                        return (
                          <div
                            key={song.id}
                            className={`track-item-row ${isCurrent ? 'active-playing' : ''}`}
                            onClick={() => {
                              const originalIdx = songs.findIndex((s) => s.id === song.id)
                              if (originalIdx !== -1) playSongAtIndex(originalIdx)
                            }}
                          >
                            <span className="col-idx">
                              {isCurrent && isPlaying ? (
                                <span className="track-equalizer-bar" />
                              ) : (
                                idx + 1
                              )}
                            </span>

                            <div className="col-title track-title-group">
                              <span className="track-title-text">{song.title}</span>
                              <span className="track-badge-ext">{song.extension}</span>
                            </div>

                            <span className="col-artist">{song.artist}</span>

                            <span className="col-size">{song.sizeFormatted}</span>

                            <div className="col-fav">
                              <button
                                type="button"
                                className={`fav-button ${isFav ? 'favorited' : ''}`}
                                onClick={(e) => toggleFavorite(song.id, e)}
                                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <HeartIcon
                                  size={15}
                                  filled={isFav}
                                  color={isFav ? '#f43f5e' : 'var(--text-muted)'}
                                />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* =========================================================================
            FLOATING DOCKED BOTTOM PLAYER BAR (Image 2 Luxury Floating Dock Style)
            ========================================================================= */}
        <footer className="docked-floating-player">
          {/* Track Thumbnail & Titles */}
          <div className="docked-track-meta" onClick={() => setActiveTab('music')}>
            <div
              className="docked-thumb"
              style={{
                background: currentArtTheme
                  ? currentArtTheme.bg
                  : 'linear-gradient(135deg, var(--accent-primary) 0%, #1e1b4b 100%)'
              }}
            >
              <MusicIcon size={18} color="#ffffff" />
            </div>
            <div className="docked-text">
              <span className="docked-title">
                {currentSong ? currentSong.title : 'Atmospheric Focus Audio'}
              </span>
              <span className="docked-artist">
                {currentSong ? currentSong.artist : 'Click to open Studio'}
              </span>
            </div>
          </div>

          {/* Center Controls & Progress Bar */}
          <div className="docked-center-controls">
            <div className="docked-buttons-row">
              <button
                type="button"
                className={`player-sub-btn ${isShuffle ? 'active' : ''}`}
                onClick={() => setIsShuffle((s) => !s)}
                title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
              >
                <ShuffleIcon size={15} color={isShuffle ? 'var(--accent-primary)' : 'currentColor'} />
              </button>

              <button
                type="button"
                className="player-main-btn"
                onClick={playPrevTrack}
                title="Previous Track"
              >
                <SkipBackIcon size={17} />
              </button>

              <button
                type="button"
                className="player-play-btn"
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              </button>

              <button
                type="button"
                className="player-main-btn"
                onClick={playNextTrack}
                title="Next Track"
              >
                <SkipForwardIcon size={17} />
              </button>

              <button
                type="button"
                className={`player-sub-btn ${loopMode !== 'none' ? 'active' : ''}`}
                onClick={cycleLoopMode}
                title={`Loop: ${loopMode}`}
              >
                <LoopIcon
                  size={15}
                  mode={loopMode}
                  color={loopMode !== 'none' ? 'var(--accent-primary)' : 'currentColor'}
                />
              </button>
            </div>

            {/* Seek Progress Bar */}
            <div className="docked-progress-row">
              <span className="time-label">{formatTime(currentTime)}</span>

              <div
                className="progress-bar-track"
                onClick={(e) => {
                  if (!duration) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width))
                  handleSeek(ratio * duration)
                }}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              <span className="time-label">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Tools: Volume & EQ */}
          <div className="docked-right-tools">
            <button
              type="button"
              className="player-sub-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon size={16} volume={volume} muted={isMuted} />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="docked-volume-slider"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />

            <button
              type="button"
              className="player-sub-btn"
              onClick={() => setIsSoundSettingsOpen(true)}
              title="Sound Settings & Equalizer"
            >
              <EqualizerIcon size={16} />
            </button>
          </div>
        </footer>
      </div>

      {/* Subject Manager Modal */}
      <SubjectManager
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjects={subjects}
        onAddSubject={handleAddSubject}
        onDeleteSubject={handleDeleteSubject}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={(id) => {
          setSelectedSubjectId(id)
          setIsSubjectModalOpen(false)
        }}
        sessions={sessions}
      />

      {/* Theme & Study Preferences Modal */}
      <ThemeCustomizer
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        focusMinutes={focusMinutes}
        onChangeFocusMinutes={setFocusMinutes}
        dailyGoalHours={dailyGoalHours}
        onChangeDailyGoalHours={setDailyGoalHours}
      />

      {/* Equalizer & Audio Engine Modal */}
      <SoundSettings
        isOpen={isSoundSettingsOpen}
        onClose={() => setIsSoundSettingsOpen(false)}
        playbackRate={playbackRate}
        onPlaybackRateChange={(rate) => {
          setPlaybackRate(rate)
          if (audioRef.current) audioRef.current.playbackRate = rate
        }}
        preservesPitch={preservesPitch}
        onPreservesPitchChange={(pres) => {
          setPreservesPitch(pres)
          // @ts-ignore
          if (audioRef.current) audioRef.current.preservesPitch = pres
        }}
      />

      {/* Onboarding Persona Modal (Human & Hollow Name) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
