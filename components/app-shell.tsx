"use client"

import { useState } from "react"
import { LogOut, MessageSquare, Users } from "lucide-react"
import Image from "next/image"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChatView } from "@/components/chat-view"
import { ConversationList } from "@/components/conversation-list"
import type { User, Chat } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const currentUser: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
}

const mockContacts: User[] = [
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
  },
]

const mockChats: Chat[] = [
  {
    id: "1",
    type: "direct",
    participants: [currentUser, mockContacts[0]],
    lastMessage: "Olá, como vai?",
    timestamp: new Date(),
    messages: [],
  },
  {
    id: "2",
    type: "group",
    participants: [currentUser, mockContacts[0], mockContacts[1]],
    groupInfo: {
      id: "group-1",
      name: "Projeto X",
      tag: "projeto-x",
      participants: [currentUser, mockContacts[0], mockContacts[1]],
      createdAt: new Date(),
    },
    lastMessage: "Reunião amanhã às 10h",
    timestamp: new Date(),
    messages: [],
  },
]

type View = "chat" | "contacts"

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>("chat")
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const [chats, setChats] = useState<Chat[]>(mockChats)
  const { toast } = useToast()

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  const handleCreateGroup = async (group: {
    name: string
    tag: string
    image?: string
    participants: string[]
  }) => {
    const selectedParticipants = [
      currentUser,
      ...mockContacts.filter((contact) => group.participants.includes(contact.id)),
    ]

    const newGroup: Chat = {
      id: `group-${Date.now()}`,
      type: "group",
      participants: selectedParticipants,
      groupInfo: {
        id: `group-info-${Date.now()}`,
        name: group.name,
        tag: group.tag,
        image: group.image,
        participants: selectedParticipants,
        createdAt: new Date(),
      },
      timestamp: new Date(),
      messages: [],
    }

    setChats((prev) => [...prev, newGroup])
  }

  const handleSendMessage = async (chatId: string, content: string, type: "text" | "audio" | "file", file?: File) => {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    const newMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      content,
      type,
      sender: currentUser,
      timestamp: new Date(),
    }

    if (file) {
      // Handle file upload here
      // For now, we'll just use a data URL for demo purposes
      const reader = new FileReader()
      reader.onloadend = () => {
        const message = {
          ...newMessage,
          content: reader.result as string,
          fileName: file.name,
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  lastMessage: type === "text" ? content : `Enviou um ${type}`,
                  timestamp: new Date(),
                }
              : c,
          ),
        )
      }
      reader.readAsDataURL(file)
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: content,
                timestamp: new Date(),
              }
            : c,
        ),
      )
    }
  }

  const handleStartChat = (userId: string) => {
    const contact = mockContacts.find((c) => c.id === userId)
    if (!contact) return

    // Check if chat already exists
    const existingChat = chats.find((c) => c.type === "direct" && c.participants.some((p) => p.id === userId))

    if (existingChat) {
      setSelectedChatId(existingChat.id)
      return
    }

    // Create new chat
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      type: "direct",
      participants: [currentUser, contact],
      timestamp: new Date(),
      messages: [],
    }

    setChats((prev) => [...prev, newChat])
    setSelectedChatId(newChat.id)
  }

  const handleLogout = () => {
    // Add your logout logic here
    toast({
      description: "Saindo da conta...",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-20 border-r flex flex-col items-center py-4 gap-6">
        <div className="w-12 h-12">
          <Image src="/placeholder.svg" alt="Logo" width={48} height={48} className="rounded-lg" />
        </div>
        <Separator />
        <Button
          variant={currentView === "chat" ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentView("chat")}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant={currentView === "contacts" ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentView("contacts")}
        >
          <Users className="h-5 w-5" />
        </Button>
        <div className="mt-auto flex flex-col items-center gap-4">
          <Separator />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sair da conta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Conversations List */}
      <ConversationList
        conversations={chats.map((chat) => ({
          id: chat.id,
          type: chat.type,
          user: chat.type === "direct" ? chat.participants.find((p) => p.id !== currentUser.id) : undefined,
          groupInfo: chat.groupInfo,
          lastMessage: chat.lastMessage,
          timestamp: chat.timestamp,
        }))}
        contacts={mockContacts}
        onSelect={currentView === "chat" ? setSelectedChatId : handleStartChat}
        selectedId={selectedChatId}
        onCreateGroup={handleCreateGroup}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatView
            chat={selectedChat}
            currentUser={currentUser}
            onSendMessage={(content, type, file) => handleSendMessage(selectedChat.id, content, type, file)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}

