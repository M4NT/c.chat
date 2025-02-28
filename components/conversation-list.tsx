"use client"

import { useState } from "react"
import { Search, Users, Loader2, Database } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { GroupModal } from "@/components/group-modal"
import { ConversationActions } from "@/components/conversation-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { User } from "@/types"
import type { ConversationListProps } from "@/types"

export function ConversationList({ 
  conversations, 
  onSelect, 
  selectedId, 
  onCreateGroup,
  isLoading = false,
  currentView = "chat",
  contacts = [],
  onStartChat
}: ConversationListProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const filteredConversations = conversations.filter((conv) =>
    conv.type === "direct"
      ? conv.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : conv.groupInfo?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMute = (id: string) => {
    toast({
      description: "Notificações silenciadas com sucesso.",
    })
  }

  const handleShare = (id: string) => {
    toast({
      description: "Link de contato copiado para a área de transferência.",
    })
  }

  const handleDelete = (id: string) => {
    toast({
      description: "Conversa excluída com sucesso.",
    })
  }

  const handleFavorite = (id: string) => {
    toast({
      description: "Conversa adicionada aos favoritos.",
    })
  }

  const formatParticipants = (participants: User[]) => {
    if (participants.length <= 5) {
      return participants.map((p) => p.name.split(" ")[0]).join(", ")
    }
    return `${participants
      .slice(0, 5)
      .map((p) => p.name.split(" ")[0])
      .join(", ")} +${participants.length - 5}`
  }

  // Componente de skeleton para conversas
  const ConversationSkeleton = () => (
    <div className="flex items-center gap-3 p-4 hover:bg-accent">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )

  // Componente de skeleton para contatos
  const ContactSkeleton = () => (
    <div className="flex items-center gap-3 p-4 hover:bg-accent">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )

  return (
    <div className="w-80 border-r">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={currentView === "chat" ? "Buscar conversas..." : "Buscar contatos..."}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 py-2">
        <Button variant="outline" size="sm" className="w-full" onClick={() => setIsGroupModalOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      <Separator />

      <ScrollArea className="h-[calc(100vh-8.5rem)]">
        {isLoading ? (
          <div className="flex flex-col py-2">
            {currentView === "chat" ? (
              // Skeleton para conversas
              Array.from({ length: 5 }).map((_, index) => (
                <ConversationSkeleton key={index} />
              ))
            ) : (
              // Skeleton para contatos
              Array.from({ length: 8 }).map((_, index) => (
                <ContactSkeleton key={index} />
              ))
            )}
          </div>
        ) : currentView === "chat" ? (
          <div className="flex flex-col py-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 gap-4">
                <div className="text-center text-muted-foreground">
                  Nenhuma conversa encontrada
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`flex items-center gap-3 p-4 hover:bg-accent text-left relative group ${
                    selectedId === conv.id ? "bg-accent" : ""
                  }`}
                  onClick={() => onSelect(conv.id)}
                >
                  <Avatar>
                    <AvatarImage src={conv.type === "direct" ? conv.user?.avatar : conv.groupInfo?.image} />
                    <AvatarFallback>
                      {conv.type === "direct"
                        ? conv.user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : conv.groupInfo?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium">{conv.type === "direct" ? conv.user?.name : conv.groupInfo?.name}</div>
                    {conv.type === "group" && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatParticipants(conv.groupInfo?.participants || [])}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground truncate">{conv.lastMessage || "Nenhuma mensagem"}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground group-hover:hidden">
                      {new Date(conv.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <ConversationActions
                      onMute={() => handleMute(conv.id)}
                      onShare={() => handleShare(conv.id)}
                      onDelete={() => handleDelete(conv.id)}
                      onFavorite={() => handleFavorite(conv.id)}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum contato encontrado
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  className="flex items-center gap-3 p-4 hover:bg-accent text-left"
                  onClick={() => onStartChat(contact.id)}
                >
                  <Avatar>
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">{contact.email}</div>
                  </div>
                  {contact.status === "online" && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      <GroupModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        contacts={contacts}
        onCreateGroup={onCreateGroup}
      />
    </div>
  )
}

