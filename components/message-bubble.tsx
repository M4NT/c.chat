"use client"

import { useState } from "react"
import { Check, CheckCheck, Download, File, MoreHorizontal, Reply, MessageSquare } from "lucide-react"
import Image from "next/image"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AudioWaveform } from "@/components/audio-waveform"
import { EmojiPicker } from "@/components/emoji-picker"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  showAvatar?: boolean
  isGroupChat?: boolean
  onReply: (message: Message) => void
  onReact: (message: Message, reaction: string) => void
}

export function MessageBubble({
  message,
  isCurrentUser,
  showAvatar = true,
  isGroupChat = false,
  onReply,
  onReact,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const renderContent = () => {
    switch (message.type) {
      case "text":
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>
      case "audio":
        return <AudioWaveform src={message.content} isCurrentUser={isCurrentUser} />
      case "file":
        if (message.content.startsWith("data:image/")) {
          return (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={message.content || "/placeholder.svg"}
                  alt="Imagem"
                  width={200}
                  height={150}
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{message.fileName}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={message.content} download={message.fileName}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )
        }
        return (
          <div className="flex flex-col gap-2 p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{message.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {message.fileType} • {formatFileSize(message.fileSize || 0)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={message.content} download={message.fileName}>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn("group flex gap-3 my-2", isCurrentUser ? "ml-[30px] flex-row-reverse" : "mr-[30px]")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showAvatar && !isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback>
            {message.sender.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-1 max-w-[80%]">
        {isGroupChat && !isCurrentUser && (
          <span className="text-sm font-medium text-primary">{message.sender.name}</span>
        )}

        {message.replyTo && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              isCurrentUser ? "bg-primary/10" : "bg-accent",
            )}
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{message.replyTo.sender.name}</p>
              <p className="text-muted-foreground truncate">{message.replyTo.content}</p>
            </div>
          </div>
        )}

        <div className="relative">
          <div 
            className={cn(
              "rounded-lg p-3", 
              isCurrentUser 
                ? "bg-primary text-primary-foreground" 
                : "bg-white border border-gray-200 shadow-sm"
            )}
          >
            {renderContent()}
          </div>

          {/* Fixed Reactions */}
          <div className="absolute -bottom-2 left-2 flex gap-0.5">
            {message.reactions?.map((reaction, index) => (
              <div
                key={index}
                className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-xs shadow-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="ml-1 text-muted-foreground">{reaction.count}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              "absolute -right-2 -bottom-8 flex items-center gap-1 opacity-0 transition-opacity bg-background rounded-full border shadow-sm p-1",
              showActions && "opacity-100",
            )}
          >
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(message)}>
              <Reply className="h-4 w-4" />
            </Button>

            <EmojiPicker onEmojiSelect={(emoji) => onReact(message, emoji.native)} triggerClassName="h-6 w-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                <DropdownMenuItem>Encaminhar</DropdownMenuItem>
                <DropdownMenuItem>Copiar</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Apagar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={cn("flex items-center gap-2 mt-1", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isCurrentUser && (
              <div className="flex">
                {message.status === "sent" && <Check className="h-3 w-3" />}
                {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

