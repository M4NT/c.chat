"use client"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Smile } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void
  triggerClassName?: string
}

export function EmojiPicker({ onEmojiSelect, triggerClassName }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <Smile className={triggerClassName} />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-none">
        <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" previewPosition="none" />
      </PopoverContent>
    </Popover>
  )
}

