import { useEffect, useRef } from 'react'
import { audioEngine } from '../audioEngine'

interface VisualizerProps {
  isPlaying: boolean
  mode?: 'bars' | 'wave'
  isHollow?: boolean
}

export function Visualizer({ isPlaying, mode = 'bars', isHollow = false }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = 64
    const dataArray = new Uint8Array(bufferLength)

    const render = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      if (isPlaying) {
        if (mode === 'wave') {
          audioEngine.getTimeDomainData(dataArray)
        } else {
          audioEngine.getFrequencyData(dataArray)
        }
      } else {
        // Flat baseline with subtle idle breathing
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = mode === 'wave' ? 128 : 6
        }
      }

      if (mode === 'wave') {
        // Fluid Waveform
        ctx.lineWidth = 2.5
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        if (isHollow) {
          gradient.addColorStop(0, '#ff1a40')
          gradient.addColorStop(0.5, '#ffffff')
          gradient.addColorStop(1, '#ff0033')
          ctx.shadowColor = 'rgba(255, 26, 64, 0.7)'
        } else {
          gradient.addColorStop(0, '#6366f1')
          gradient.addColorStop(0.5, '#a855f7')
          gradient.addColorStop(1, '#06b6d4')
          ctx.shadowColor = 'rgba(168, 85, 247, 0.4)'
        }

        ctx.strokeStyle = gradient
        ctx.shadowBlur = 8
        ctx.beginPath()

        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
        ctx.shadowBlur = 0
      } else {
        // Frequency spectrum bars
        const numBars = 32
        const barWidth = Math.max(3, width / numBars - 3)
        const gap = 3

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * (bufferLength * 0.75))
          const val = dataArray[dataIndex] || 0
          const percent = val / 255
          const barHeight = Math.max(4, percent * (height - 6))

          const x = i * (barWidth + gap) + 4
          const y = height - barHeight

          const barGradient = ctx.createLinearGradient(x, y, x, height)
          if (isHollow) {
            barGradient.addColorStop(0, '#ffffff')
            barGradient.addColorStop(0.3, '#ff1a40')
            barGradient.addColorStop(1, '#500710')
            ctx.shadowColor = isPlaying ? 'rgba(255, 26, 64, 0.6)' : 'transparent'
          } else {
            barGradient.addColorStop(0, '#38bdf8')
            barGradient.addColorStop(0.5, '#818cf8')
            barGradient.addColorStop(1, '#c084fc')
            ctx.shadowColor = isPlaying ? 'rgba(56, 189, 248, 0.35)' : 'transparent'
          }

          ctx.fillStyle = barGradient
          ctx.shadowBlur = 6

          ctx.beginPath()
          const radius = Math.min(barWidth / 2, 3)
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 1, 1])
          ctx.fill()
        }
        ctx.shadowBlur = 0
      }

      animIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current)
      }
    }
  }, [isPlaying, mode, isHollow])

  return (
    <div className="visualizer-wrapper">
      <canvas
        ref={canvasRef}
        width={320}
        height={56}
        className="visualizer-canvas"
      />
    </div>
  )
}
