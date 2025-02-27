"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Mic, Square, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [])

  const cleanupAudio = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current)
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (audioContextRef.current?.state !== "closed") {
      try {
        audioContextRef.current?.close()
      } catch (error) {
        console.error("Error closing AudioContext:", error)
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    setIsRecording(false)
    setDuration(0)
    chunksRef.current = []
  }

  const startRecording = async () => {
    try {
      cleanupAudio() // Cleanup any existing audio resources

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
          setAudioBlob(blob)
          cleanupAudio()
        } catch (error) {
          console.error("Error creating audio blob:", error)
          cleanupAudio()
        }
      }

      recorder.start()
      setIsRecording(true)
      setDuration(0)

      timerIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      cleanupAudio()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
      setAudioBlob(null)
      setDuration(0)
    }
  }

  const handleCancel = () => {
    setAudioBlob(null)
    setDuration(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSend}
          className="text-green-500 hover:text-green-600 hover:bg-green-50"
        >
          <Check className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(isRecording && "text-red-500")}
      >
        {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
        </div>
      )}
    </div>
  )
}

