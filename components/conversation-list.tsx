"use client"

import { useState, useMemo } from "react"
import { Search, Users, UserPlus, Filter, Circle, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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

  // Filtra conversas com base na consulta de pesquisa
  const filteredConversations = conversations.filter((conv) =>
    conv.type === "direct"
      ? conv.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : conv.groupInfo?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filtra contatos com base na consulta de pesquisa e no filtro de status
  const filteredContacts = useMemo(() => {
    // Primeiro, remova os contatos que já têm conversas
    const contactsWithoutConversations = contacts.filter(contact => {
      return !conversations.some(conv => 
        conv.type === "direct" && conv.user?.id === contact.id
      );
    });
    
    return contactsWithoutConversations.filter((contact) => {
      // Filtrar por texto de busca
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           contact.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtrar por status (online/offline)
      const matchesStatus = 
        contactFilter === "all" || 
        (contactFilter === "online" && contact.status === "online") ||
        (contactFilter === "offline" && contact.status !== "online");
      
      return matchesSearch && matchesStatus;
    });
  }, [contacts, conversations, searchQuery, contactFilter]);

  // Agrupar contatos por status
  const groupedContacts = useMemo(() => {
    const online = filteredContacts.filter(c => c.status === "online");
    const offline = filteredContacts.filter(c => c.status !== "online");
    
    return {
      online,
      offline
    };
  }, [filteredContacts]);

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
    <div className="w-80 border-r">
      <div className="p-4">
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

      <ScrollArea className="h-[calc(100vh-8.5rem)]">
        {isLoading ? (
          <div className="flex flex-col py-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <ItemSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {/* Seção de Conversas Ativas */}
            {filteredConversations.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Conversas ({filteredConversations.length})
                  </Badge>
                </div>
                
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-3 p-4 hover:bg-accent ${
                      selectedId === conversation.id ? "bg-accent" : ""
                    }`}
                  >
                    <button
                      className="flex flex-1 items-center gap-3"
                      onClick={() => onSelect(conversation.id)}
                    >
                      <div className="relative">
                        <Avatar>
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
                        {conversation.type === "direct" && conversation.user?.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium">
                          {conversation.type === "direct"
                            ? conversation.user?.name
                            : conversation.groupInfo?.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">
                          {conversation.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {conversation.unread && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                    <ConversationActions
                      onMute={() => handleMute(conversation.id)}
                      onShare={() => handleShare(conversation.id)}
                      onDelete={() => handleDelete(conversation.id)}
                      onFavorite={() => handleFavorite(conversation.id)}
                    />
                  </div>
                ))}
                
                {/* Separador entre conversas e contatos */}
                {(groupedContacts.online.length > 0 || groupedContacts.offline.length > 0) && (
                  <Separator className="my-2" />
                )}
              </>
            )}
            
            {/* Contatos Online */}
            {groupedContacts.online.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1" />
                    Contatos Online ({groupedContacts.online.length})
                  </Badge>
                </div>
                {groupedContacts.online.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </>
            )}
            
            {/* Contatos Offline */}
            {groupedContacts.offline.length > 0 && (
              <>
                <div className="px-4 py-2 mt-2">
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    <Circle className="h-2 w-2 fill-gray-300 text-gray-300 mr-1" />
                    Contatos Offline ({groupedContacts.offline.length})
                  </Badge>
                </div>
                {groupedContacts.offline.map((contact) => (
                  <ContactItem key={contact.id} contact={contact} />
                ))}
              </>
            )}
            
            {/* Mensagem quando não há nada para exibir */}
            {filteredConversations.length === 0 && filteredContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center p-4 gap-4">
                <div className="text-center text-muted-foreground">
                  Nenhuma conversa ou contato encontrado
                </div>
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

