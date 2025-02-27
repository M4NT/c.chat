"use client"

import type React from "react"

import { useState } from "react"
import { File, Loader2, Paperclip, X } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[]) => Promise<void>
}

export function FileUploadModal({ open, onOpenChange, onUpload }: FileUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(undefined)
    setProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      await onUpload(files)

      setProgress(100)
      setTimeout(() => {
        onOpenChange(false)
        setFiles([])
        setProgress(0)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar arquivo")
      setProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const isImage = (file: File) => file.type.startsWith("image/")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Arquivos</DialogTitle>
          <DialogDescription>Selecione os arquivos que deseja enviar. Tamanho máximo: 50MB.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
            <Paperclip className="h-4 w-4 mr-2" />
            Escolher Arquivos
          </Button>
          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileSelect} />

          {files.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {isImage(file) ? (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden">
                          <Image
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={file.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <File className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">Enviando arquivos... {progress}%</p>
            </div>
          )}

          {error && <p className="text-sm text-center text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

