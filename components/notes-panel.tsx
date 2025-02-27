"use client"

import { useState } from "react"
import { Save, Star, Flag, BookmarkCheck, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/emoji-picker"

interface NotesPanelProps {
  chatId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type NoteLine = {
  content: string
  marker?: string
  statuses: ("important" | "pending" | "completed")[]
}

const statusIcons = {
  important: {
    icon: <Star className="h-4 w-4" />,
    activeClass: "text-amber-500",
  },
  pending: {
    icon: <Flag className="h-4 w-4" />,
    activeClass: "text-indigo-500",
  },
  completed: {
    icon: <BookmarkCheck className="h-4 w-4" />,
    activeClass: "text-emerald-500",
  },
}

export function NotesPanel({ chatId, open, onOpenChange }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteLine[]>(Array(100).fill({ content: "", statuses: [] }))
  const [isDirty, setIsDirty] = useState(false)
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null)

  const handleNoteChange = (index: number, content: string) => {
    const newNotes = [...notes]
    newNotes[index] = { ...newNotes[index], content }
    setNotes(newNotes)
    setIsDirty(true)
  }

  const handleMarkerSelect = (index: number, emoji: any) => {
    const newNotes = [...notes]
    newNotes[index] = { ...newNotes[index], marker: emoji.native }
    setNotes(newNotes)
    setIsDirty(true)
  }

  const toggleStatus = (index: number, status: keyof typeof statusIcons) => {
    const newNotes = [...notes]
    const currentStatuses = newNotes[index].statuses || []
    newNotes[index] = {
      ...newNotes[index],
      statuses: currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status].slice(0, 3),
    }
    setNotes(newNotes)
    setIsDirty(true)
  }

  const handleSave = async () => {
    // Save notes to backend
    setIsDirty(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Notas</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={!isDirty}
                className="h-8 w-8 rounded-full"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6">
            <div className="font-mono text-sm">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className="flex gap-4 min-h-[2rem] relative group items-start hover:bg-accent/5 -mx-2 px-2 rounded-md"
                  onMouseEnter={() => setActiveLineIndex(index)}
                  onMouseLeave={() => setActiveLineIndex(null)}
                >
                  <div className="w-24 flex items-center gap-1.5 py-1.5">
                    <div className="flex gap-1">
                      {Object.entries(statusIcons).map(([status, { icon, activeClass }]) => (
                        <button
                          key={status}
                          onClick={() => toggleStatus(index, status as keyof typeof statusIcons)}
                          className={cn(
                            "transition-all hover:scale-110",
                            note.statuses?.includes(status as any) ? activeClass : "text-muted-foreground/40",
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <span className="text-muted-foreground/40 select-none ml-auto">
                      {(index + 1).toString().padStart(3, "0")}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 py-1.5">
                    {note.marker && <span className="select-none">{note.marker}</span>}
                    <Textarea
                      value={note.content}
                      onChange={(e) => handleNoteChange(index, e.target.value)}
                      className="flex-1 min-h-0 h-6 resize-none overflow-hidden py-0 px-0 bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/20"
                      placeholder={activeLineIndex === index ? "Digite sua nota..." : ""}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const nextInput = document.querySelector<HTMLTextAreaElement>(
                            `textarea[data-line="${index + 1}"]`,
                          )
                          nextInput?.focus()
                        }
                      }}
                      data-line={index}
                    />
                    {activeLineIndex === index && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => handleMarkerSelect(index, emoji)}
                          triggerClassName="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

