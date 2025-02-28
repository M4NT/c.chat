"use client"

import { useState, useMemo } from "react"
import { Search, Users, UserPlus, Filter, Circle, MessageSquare, Plus, CircleDot } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { GroupModal } from "@/components/group-modal"
import { ConversationActions } from "@/components/conversation-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import type { User } from "@/types"
import type { ConversationListProps } from "@/types"
import { Loader2 } from "lucide-react"

export function ConversationList({ 
  conversations, 
  onSelect, 
  selectedId, 
  onCreateGroup,
  isLoading = false,
  currentView = "chat", // Mantido para compatibilidade, mas não será usado para separar as visualizações
  contacts = [],
  onStartChat
}: ConversationListProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [contactFilter, setContactFilter] = useState<"all" | "online" | "offline">("all")
  const { toast } = useToast()

  // Filtrar conversas com base na pesquisa
  const filteredConversations = conversations.filter((conversation) => {
    const userName = conversation.user?.name || conversation.groupInfo?.name || ""
    return userName.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // Filtrar contatos com base na pesquisa e no filtro de status
  const filteredContacts = contacts.filter((contact) => {
    // Verificar se o contato já tem uma conversa (para evitar duplicação)
    const hasConversation = conversations.some(
      (conv) => conv.type === "direct" && conv.user?.id === contact.id
    )
    
    // Não mostrar contatos que já têm conversas
    if (hasConversation) {
      return false
    }
    
    // Aplicar filtro de pesquisa
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Aplicar filtro de status
    const matchesStatus = 
      contactFilter === "all" || 
      (contactFilter === "online" && contact.status === "online") ||
      (contactFilter === "offline" && contact.status !== "online")
    
    return matchesSearch && matchesStatus
  })
  
  // Separar contatos online e offline
  const onlineContacts = filteredContacts.filter((contact) => contact.status === "online")
  const offlineContacts = filteredContacts.filter((contact) => contact.status !== "online")

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

  // Componente de skeleton para carregamento
  const ItemSkeleton = () => (
    <div className="flex items-center gap-3 p-4 hover:bg-accent">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )

  // Componente para renderizar um contato
  const ContactItem = ({ contact }: { contact: User }) => (
    <button
      key={contact.id}
      className="flex items-center gap-3 p-4 hover:bg-accent text-left w-full rounded-md transition-colors"
      onClick={() => onStartChat(contact.id)}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={contact.avatar} />
          <AvatarFallback>
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        {contact.status === "online" && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium">{contact.name}</div>
        <div className="text-sm text-muted-foreground truncate">{contact.email}</div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          onStartChat(contact.id);
        }}
      >
        <UserPlus className="h-4 w-4" />
      </Button>
    </button>
  )

  return (
    <div className="w-80 flex flex-col border-r">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas e contatos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between">
        <Button variant="outline" size="sm" className="flex-1 mr-2" onClick={() => setIsGroupModalOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar contatos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setContactFilter("all")}
              className={contactFilter === "all" ? "bg-accent" : ""}
            >
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setContactFilter("online")}
              className={contactFilter === "online" ? "bg-accent" : ""}
            >
              <Circle className="h-3 w-3 mr-2 fill-green-500 text-green-500" />
              Online
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setContactFilter("offline")}
              className={contactFilter === "offline" ? "bg-accent" : ""}
            >
              <Circle className="h-3 w-3 mr-2 fill-gray-300 text-gray-300" />
              Offline
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Separator />

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-2">
            {/* Seção de Conversas */}
            {filteredConversations.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    CONVERSAS
                  </div>
                </div>
                
                {filteredConversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant={selectedId === conversation.id ? "secondary" : "ghost"}
                    className="w-full justify-start mb-1 px-2"
                    onClick={() => onSelect(conversation.id)}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-9 w-9 mr-2">
                        <AvatarImage
                          src={
                            conversation.type === "direct"
                              ? conversation.user?.avatar
                              : conversation.groupInfo?.image
                          }
                        />
                        <AvatarFallback>
                          {conversation.type === "direct"
                            ? conversation.user?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : conversation.groupInfo?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {conversation.type === "direct"
                              ? conversation.user?.name
                              : conversation.groupInfo?.name}
                          </span>
                          {conversation.timestamp && (
                            <span className="text-xs text-muted-foreground ml-1 shrink-0">
                              {formatDistanceToNow(conversation.timestamp, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage}
                          </div>
                        )}
                      </div>
                      <ConversationActions
                        onMute={() => handleMute(conversation.id)}
                        onDelete={() => handleDelete(conversation.id)}
                        onFavorite={() => handleFavorite(conversation.id)}
                        onShare={() => handleShare(conversation.id)}
                      />
                    </div>
                  </Button>
                ))}
                
                {(onlineContacts.length > 0 || offlineContacts.length > 0) && (
                  <Separator className="my-2" />
                )}
              </>
            )}
            
            {/* Seção de Contatos Online */}
            {contactFilter !== "offline" && onlineContacts.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center">
                    <CircleDot className="h-3.5 w-3.5 mr-1 text-green-500" />
                    CONTATOS ONLINE
                  </div>
                </div>
                
                {onlineContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start mb-1 px-2"
                    onClick={() => onStartChat(contact.id)}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-9 w-9 mr-2">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center">
                          <span className="text-sm font-medium truncate">
                            {contact.name}
                          </span>
                          <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.email}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </>
            )}
            
            {/* Seção de Contatos Offline */}
            {contactFilter !== "online" && offlineContacts.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center">
                    <Circle className="h-3.5 w-3.5 mr-1" />
                    CONTATOS OFFLINE
                  </div>
                </div>
                
                {offlineContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start mb-1 px-2"
                    onClick={() => onStartChat(contact.id)}
                  >
                    <div className="flex items-center w-full">
                      <Avatar className="h-9 w-9 mr-2">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center">
                          <span className="text-sm font-medium truncate">
                            {contact.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.email}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </>
            )}
            
            {/* Mensagem quando não há conversas nem contatos */}
            {filteredConversations.length === 0 && filteredContacts.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                {searchQuery ? (
                  <p>Nenhum resultado encontrado para "{searchQuery}"</p>
                ) : (
                  <p>Nenhuma conversa ou contato disponível</p>
                )}
              </div>
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

