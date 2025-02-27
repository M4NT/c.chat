"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface AudioWaveformProps {
  src: string
  isCurrentUser?: boolean
}

export function AudioWaveform({ src, isCurrentUser }: AudioWaveformProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const response = await fetch(src)
        const arrayBuffer = await response.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const buffer = await audioContext.decodeAudioData(arrayBuffer)
        setAudioBuffer(buffer)
        drawWaveform(buffer)
      } catch (error) {
        console.error("Error loading audio:", error)
      }
    }

    loadAudio()
  }, [src])

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const data = buffer.getChannelData(0)
    const step = Math.ceil(data.length / canvas.width)
    const amp = canvas.height / 2

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw center line
    context.beginPath()
    context.strokeStyle = isCurrentUser ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
    context.moveTo(0, amp)
    context.lineTo(canvas.width, amp)
    context.stroke()

    // Draw waveform
    context.beginPath()
    context.moveTo(0, amp)

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }

      const y1 = (1 + min) * amp
      const y2 = (1 + max) * amp

      context.moveTo(i, y1)
      context.lineTo(i, y2)
    }

    context.strokeStyle = isCurrentUser ? "#fff" : "#000"
    context.lineWidth = 1
    context.stroke()
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateDuration = () => setDuration(audio.duration)
    audio.addEventListener("loadedmetadata", updateDuration)

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play()
      const animate = () => {
        setCurrentTime(audio.currentTime)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      audio.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("ended", handleEnded)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeChange = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-3 min-w-[240px]">
      <audio ref={audioRef} src={src} />
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          isCurrentUser ? "text-primary-foreground" : "text-primary",
          isPlaying && "text-blue-500",
        )}
        onClick={togglePlayPause}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1">
        <canvas ref={canvasRef} width={200} height={32} className="w-full rounded" />
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleTimeChange}
          className="mt-1"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

