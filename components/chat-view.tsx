"use client"

import { cn } from "@/lib/utils"

import { useEffect, useRef, useState } from "react"
import { Copy, File, Paperclip, Search, Send, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NotesPanel } from "@/components/notes-panel"
import { AudioRecorder } from "@/components/audio-recorder"
import { FileUploadModal } from "@/components/file-upload-modal"
import { MessageBubble } from "@/components/message-bubble"
import { useToast } from "@/components/ui/use-toast"
import type { Message, User, Chat } from "@/types"

interface ChatViewProps {
  chat: Chat
  currentUser: User
  onSendMessage: (content: string, type: "text" | "audio" | "file", file?: File) => Promise<void>
}

export function ChatView({ chat, currentUser, onSendMessage }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [selectedSearchResult, setSelectedSearchResult] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<{ [key: string]: HTMLDivElement }>({})
  const { toast } = useToast()

  useEffect(() => {
    setMessages(chat.messages || [])
  }, [chat.messages])

  useEffect(() => {
    scrollToBottom()
  }, []) //Fixed unnecessary dependency

  useEffect(() => {
    if (searchQuery) {
      const filtered = messages.filter(
        (message) =>
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredMessages(filtered)
    } else {
      setFilteredMessages([])
    }
  }, [searchQuery, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current[messageId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      setSelectedSearchResult(messageId)
      setTimeout(() => setSelectedSearchResult(null), 2000)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      chatId: chat.id,
      content: newMessage,
      type: "text",
      sender: currentUser,
      timestamp: new Date(),
      status: "sent",
      replyTo: replyTo || undefined,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setReplyTo(null)
    scrollToBottom()

    try {
      await onSendMessage(newMessage, "text")
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "delivered" } : m)))
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        description: "Erro ao enviar mensagem. Tente novamente.",
      })
    }
  }

  const handleAudioComplete = async (blob: Blob) => {
    try {
      // Create a temporary URL for the audio preview
      const audioUrl = URL.createObjectURL(blob)

      // Create a new message for the audio
      const message: Message = {
        id: `msg-${Date.now()}`,
        chatId: chat.id,
        content: audioUrl,
        type: "audio",
        sender: currentUser,
        timestamp: new Date(),
        status: "sent",
      }

      // Add message to UI immediately
      setMessages((prev) => [...prev, message])
      scrollToBottom()

      // Create a File from the Blob
      const audioFile = new File([blob], "audio.webm", {
        type: "audio/webm;codecs=opus",
        lastModified: Date.now(),
      })

      try {
        // Send the audio file
        await onSendMessage(audioUrl, "audio", audioFile)

        // Update message status to delivered
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "delivered" } : m)))
      } catch (error) {
        console.error("Error sending audio:", error)
        // Update UI to show error state
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, status: "error" } : m)))
        toast({
          variant: "destructive",
          description: "Erro ao enviar áudio. Tente novamente.",
        })

        // Clean up the temporary URL
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error) {
      console.error("Error handling audio:", error)
      toast({
        variant: "destructive",
        description: "Erro ao processar áudio. Tente novamente.",
      })
    }
  }

  const handleFileUpload = async (files: File[]) => {
    // Handle file upload
    if (files.length > 0) {
      try {
        await onSendMessage("", "file", files[0])
      } catch (error) {
        console.error("Error sending file:", error)
        toast({
          variant: "destructive",
          description: "Erro ao enviar arquivo. Tente novamente.",
        })
      }
    }
  }

  return (
    <>
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={
                chat.type === "direct"
                  ? chat.participants.find((p) => p.id !== currentUser.id)?.avatar
                  : chat.groupInfo?.image
              }
            />
            <AvatarFallback>
              {chat.type === "direct"
                ? chat.participants
                    .find((p) => p.id !== currentUser.id)
                    ?.name.split(" ")
                    .map((n) => n[0])
                    .join("")
                : chat.groupInfo?.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {chat.type === "direct"
                ? chat.participants.find((p) => p.id !== currentUser.id)?.name
                : chat.groupInfo?.name}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {chat.type === "direct"
                ? chat.participants.find((p) => p.id !== currentUser.id)?.email
                : `${chat.participants.length} participantes`}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const email =
                          chat.type === "direct"
                            ? chat.participants.find((p) => p.id !== currentUser.id)?.email
                            : chat.groupInfo?.tag
                        if (email) {
                          navigator.clipboard.writeText(email)
                          setIsCopied(true)
                          setTimeout(() => setIsCopied(false), 2000)
                        }
                      }}
                    >
                      <Copy className={`h-3 w-3 transition-transform ${isCopied ? "scale-125" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar email</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsNotesOpen(true)}>
            <File className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="border-b p-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredMessages.length > 0 && (
            <ScrollArea className="mt-2 max-h-40 max-w-md mx-auto rounded-md border">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                  onClick={() => scrollToMessage(message.id)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{message.sender.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{message.content}</p>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={(el) => {
                if (el) messageRefs.current[message.id] = el
              }}
              className={cn(
                "transition-colors duration-300",
                selectedSearchResult === message.id && "bg-yellow-100 dark:bg-yellow-900/20",
              )}
            >
              <MessageBubble
                message={message}
                isCurrentUser={message.sender.id === currentUser.id}
                showAvatar={index === 0 || messages[index - 1].sender.id !== message.sender.id}
                onReply={setReplyTo}
                onReact={(message, reaction) => {
                  // Implement reaction logic
                  toast({
                    description: `Reação ${reaction} adicionada.`,
                  })
                }}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="border-t p-2 flex items-center justify-between bg-accent/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-primary rounded" />
            <div>
              <p className="text-sm font-medium">{replyTo.sender.name}</p>
              <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button variant="ghost" size="icon" onClick={() => setIsFileModalOpen(true)}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <AudioRecorder onRecordingComplete={handleAudioComplete} />
          <Button onClick={handleSendMessage}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Panels and Modals */}
      <NotesPanel chatId={chat.id} open={isNotesOpen} onOpenChange={setIsNotesOpen} />
      <FileUploadModal open={isFileModalOpen} onOpenChange={setIsFileModalOpen} onUpload={handleFileUpload} />
    </>
  )
}

