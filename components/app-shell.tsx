"use client"

import { useEffect, useState } from "react"
import { LogOut, MessageSquare, Users, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChatView } from "@/components/chat-view"
import { ConversationList } from "@/components/conversation-list"
import type { User, Chat, Group } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "./auth-provider"
import { getSupabase } from "@/lib/supabase"
import { logoutAction, initializeChatData } from "@/app/lib/actions"
import { Database } from "@/types/database.types"
import { ScrollArea } from "@/components/ui/scroll-area"

// Removendo os dados mockados
// const mockContacts: User[] = [...]

type View = "chat" | "contacts"
type DbUser = Database['public']['Tables']['users']['Row']
type DbGroup = Database['public']['Tables']['groups']['Row']

export function AppShell() {
  const { user, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<View>("chat")
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const [chats, setChats] = useState<Chat[]>([])
  const [contacts, setContacts] = useState<User[]>([]) // Novo estado para contatos
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContacts, setIsLoadingContacts] = useState(true) // Novo estado para loading de contatos
  const { toast } = useToast()
  const router = useRouter()

  // Converter o usuário do Supabase para o formato User do nosso app
  const currentUser: User = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url || undefined,
    status: "online"
  } : {
    id: "",
    name: "",
    email: "",
    status: "offline"
  }

  // Carregar contatos (todos os usuários exceto o atual)
  useEffect(() => {
    const loadContacts = async () => {
      if (!user) return
      
      console.log("Iniciando carregamento de contatos para o usuário:", user.id)
      setIsLoadingContacts(true)
      try {
        const supabase = getSupabase()
        
        // Buscar todos os usuários exceto o atual
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, status, last_seen')
          .neq('id', user.id)
          .is('deleted_at', null)
          .order('name')
        
        if (usersError) {
          console.error("Erro ao buscar usuários:", usersError)
          throw usersError
        }
        
        console.log("Usuários encontrados:", usersData)
        
        // Converter para o formato esperado pelo componente
        const formattedContacts = (usersData || []).map((userData: any) => ({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_url || undefined,
          status: userData.status || 'offline'
        }))
        
        console.log("Contatos formatados:", formattedContacts)
        setContacts(formattedContacts)
      } catch (error) {
        console.error('Erro ao carregar contatos:', error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar contatos",
          description: "Não foi possível carregar seus contatos. Tente novamente mais tarde."
        })
      } finally {
        setIsLoadingContacts(false)
      }
    }
    
    loadContacts()
  }, [user, toast])

  // Carregar chats do usuário
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        console.log("Nenhum usuário autenticado, não carregando chats")
        return
      }
      
      console.log("Iniciando busca de chats para o usuário:", user.id)
      setIsLoading(true)
      try {
        const supabase = getSupabase()
        
        // Buscar chats em que o usuário é participante
        const { data: chatParticipants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id)
          .is('left_at', null)
        
        if (participantsError) {
          console.error("Erro ao buscar participantes:", participantsError)
          throw participantsError
        }
        
        console.log("Participantes encontrados:", chatParticipants)
        
        if (!chatParticipants || chatParticipants.length === 0) {
          console.log("Nenhum chat encontrado para o usuário")
          setChats([])
          setIsLoading(false)
          return
        }
        
        const chatIds = chatParticipants.map(cp => cp.chat_id)
        console.log("IDs dos chats:", chatIds)
        
        // Buscar informações dos chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            id, 
            type, 
            created_at,
            updated_at,
            last_message_at,
            groups(name, description, image_url, tag)
          `)
          .in('id', chatIds)
          .is('deleted_at', null)
          .order('last_message_at', { ascending: false })
        
        if (chatsError) {
          console.error("Erro ao buscar chats:", chatsError)
          throw chatsError
        }
        
        console.log("Chats encontrados:", chatsData)
        
        if (!chatsData || chatsData.length === 0) {
          console.log("Nenhum chat encontrado com os IDs fornecidos")
          setChats([])
          setIsLoading(false)
          return
        }
        
        // Para cada chat, buscar os participantes
        const chatsWithParticipants = await Promise.all(
          chatsData.map(async (chat) => {
            console.log("Processando chat:", chat.id)
            
            const { data: participants, error: participantsError } = await supabase
              .from('chat_participants')
              .select(`
                user_id,
                users(id, name, email, avatar_url, status)
              `)
              .eq('chat_id', chat.id)
              .is('left_at', null)
            
            if (participantsError) {
              console.error("Erro ao buscar participantes do chat:", participantsError)
              throw participantsError
            }
            
            console.log("Participantes do chat:", participants)
            
            // Buscar última mensagem
            const { data: lastMessage, error: lastMessageError } = await supabase
              .from('messages')
              .select('content, type, created_at')
              .eq('chat_id', chat.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
            
            if (lastMessageError) {
              console.error("Erro ao buscar última mensagem:", lastMessageError)
              throw lastMessageError
            }
            
            console.log("Última mensagem:", lastMessage)
            
            // Converter para o formato esperado pelo componente
            const formattedParticipants = participants.map(p => {
              // Verificar se p.users existe e é um objeto
              if (!p.users || typeof p.users !== 'object') {
                console.log("Usuário não encontrado para o participante:", p.user_id)
                return {
                  id: p.user_id,
                  name: 'Usuário desconhecido',
                  email: '',
                  avatar: undefined,
                  status: 'offline'
                }
              }
              
              const userObj = p.users as any
              
              return {
                id: userObj.id,
                name: userObj.name,
                email: userObj.email,
                avatar: userObj.avatar_url || undefined,
                status: userObj.status || 'offline'
              }
            })
            
            const groupData = chat.groups as any
            
            // Verificar se é um chat direto e se tem pelo menos 2 participantes
            if (chat.type === 'direct' && formattedParticipants.length < 2) {
              console.log("Chat direto com menos de 2 participantes:", chat.id)
              
              // Se for um chat direto, mas só tem o usuário atual, buscar o outro usuário
              if (formattedParticipants.length === 1 && formattedParticipants[0].id === user.id) {
                console.log("Buscando outro participante para o chat direto")
                
                // Buscar todos os participantes do chat
                const { data: allParticipants, error: allParticipantsError } = await supabase
                  .from('chat_participants')
                  .select('user_id')
                  .eq('chat_id', chat.id)
                  .neq('user_id', user.id)
                  .is('left_at', null)
                
                if (!allParticipantsError && allParticipants && allParticipants.length > 0) {
                  console.log("Outros participantes encontrados:", allParticipants)
                  
                  // Buscar informações do outro usuário
                  const { data: otherUser, error: otherUserError } = await supabase
                    .from('users')
                    .select('id, name, email, avatar_url, status')
                    .eq('id', allParticipants[0].user_id)
                    .single()
                  
                  if (!otherUserError && otherUser) {
                    console.log("Outro usuário encontrado:", otherUser)
                    
                    // Adicionar o outro usuário à lista de participantes
                    formattedParticipants.push({
                      id: otherUser.id,
                      name: otherUser.name,
                      email: otherUser.email,
                      avatar: otherUser.avatar_url || undefined,
                      status: otherUser.status || 'offline'
                    })
                  }
                }
              }
            }
            
            const chatResult = {
              id: chat.id,
              type: chat.type as 'direct' | 'group',
              participants: formattedParticipants,
              groupInfo: groupData ? {
                id: chat.id,
                name: groupData.name || 'Grupo sem nome',
                tag: groupData.tag || '',
                image: groupData.image_url || undefined,
                participants: formattedParticipants,
                createdAt: new Date(chat.created_at)
              } : undefined,
              lastMessage: lastMessage && lastMessage.length > 0 ? 
                lastMessage[0].type === 'text' ? 
                  lastMessage[0].content : 
                  `Enviou um ${lastMessage[0].type}` : 
                undefined,
              timestamp: lastMessage && lastMessage.length > 0 ? 
                new Date(lastMessage[0].created_at) : 
                new Date(chat.last_message_at || chat.updated_at || chat.created_at),
              messages: []
            }
            
            console.log("Chat processado:", chatResult)
            return chatResult
          })
        )
        
        console.log("Todos os chats processados:", chatsWithParticipants)
        setChats(chatsWithParticipants)
      } catch (error) {
        console.error('Erro ao carregar chats:', error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar conversas",
          description: "Não foi possível carregar suas conversas. Tente novamente mais tarde."
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadChats()
  }, [user, toast])

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  const handleCreateGroup = async (group: {
    name: string
    tag: string
    image?: string
    participants: string[]
  }) => {
    if (!user) return
    
    try {
      const supabase = getSupabase()
      
      // Criar o chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'group',
          company_id: null, // Implementar seleção de empresa posteriormente
          created_by: user.id,
        })
        .select('id')
        .single()
      
      if (chatError) throw chatError
      
      // Criar o grupo
      const { error: groupError } = await supabase
        .from('groups')
        .insert({
          chat_id: chatData.id,
          name: group.name,
          tag: group.tag,
          image_url: group.image
        })
      
      if (groupError) throw groupError
      
      // Adicionar participantes
      const participants = [user.id, ...group.participants]
      
      const participantsToInsert = participants.map(participantId => ({
        chat_id: chatData.id,
        user_id: participantId,
        role: participantId === user.id ? 'admin' : 'member'
      }))
      
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsToInsert)
      
      if (participantsError) throw participantsError
      
      // Adicionar mensagem de sistema
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatData.id,
          sender_id: user.id,
          type: 'system',
          content: `Grupo "${group.name}" criado por ${user.name}`
        })
      
      if (messageError) throw messageError
      
      toast({
        title: "Grupo criado com sucesso!",
        description: `O grupo "${group.name}" foi criado.`
      })
      
      // Recarregar chats
      window.location.reload()
    } catch (error) {
      console.error('Erro ao criar grupo:', error)
      toast({
        variant: "destructive",
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo. Tente novamente mais tarde."
      })
    }
  }

  const handleSendMessage = async (chatId: string, content: string, type: "text" | "audio" | "file", file?: File) => {
    if (!user) return
    
    try {
      const supabase = getSupabase()
      
      // Criar a mensagem
      const messageData = {
        chat_id: chatId,
        sender_id: user.id,
        type,
        content,
        status: 'sent'
      }
      
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('id')
        .single()
      
      if (messageError) throw messageError
      
      // Atualizar o timestamp da última mensagem no chat
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId)
      
      // Se for um arquivo, fazer upload
      if (file && message) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError
        
        // Registrar o arquivo no banco de dados
        const { error: fileError } = await supabase
          .from('files')
          .insert({
            message_id: message.id,
            uploader_id: user.id,
            original_name: file.name,
            storage_path: filePath,
            mime_type: file.type,
            size: file.size
          })
        
        if (fileError) throw fileError
      }
      
      // Atualizar a interface
      // Aqui estamos apenas atualizando o estado local para refletir a nova mensagem
      // Em uma implementação real, você usaria Supabase Realtime para receber atualizações em tempo real
      const newMessage = {
        id: message?.id || `msg-${Date.now()}`,
        chatId,
        content,
        type,
        sender: currentUser,
        timestamp: new Date(),
        fileName: file?.name,
        status: "sent" as "sent" | "delivered" | "read" | "error"
      }
      
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: type === "text" ? content : `Enviou um ${type}`,
                timestamp: new Date(),
              }
            : c,
        ),
      )
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente mais tarde."
      })
    }
  }

  const handleStartChat = async (userId: string) => {
    if (!user) return
    
    try {
      // Verificar se já existe um chat direto com este usuário
      const existingChat = chats.find(
        (c) => c.type === "direct" && c.participants.some((p) => p.id === userId)
      )
      
      if (existingChat) {
        setSelectedChatId(existingChat.id)
        return
      }
      
      const supabase = getSupabase()
      
      // Criar um novo chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          company_id: null, // Implementar seleção de empresa posteriormente
          created_by: user.id,
        })
        .select('id')
        .single()
      
      if (chatError) throw chatError
      
      // Adicionar participantes
      const participantsToInsert = [
        { chat_id: chatData.id, user_id: user.id, role: 'member' },
        { chat_id: chatData.id, user_id: userId, role: 'member' }
      ]
      
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsToInsert)
      
      if (participantsError) throw participantsError
      
      // Buscar informações do outro usuário
      const { data: otherUser, error: userError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, status')
        .eq('id', userId)
        .single()
      
      if (userError) throw userError
      
      // Adicionar o novo chat à lista
      const newChat: Chat = {
        id: chatData.id,
        type: "direct",
        participants: [
          currentUser,
          {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            avatar: otherUser.avatar_url || undefined,
            status: otherUser.status || "offline"
          }
        ],
        timestamp: new Date(),
        messages: [],
      }
      
      setChats((prev) => [...prev, newChat])
      setSelectedChatId(newChat.id)
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      toast({
        variant: "destructive",
        title: "Erro ao iniciar conversa",
        description: "Não foi possível iniciar a conversa. Tente novamente mais tarde."
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Usar a Server Action para logout
      const result = await logoutAction()
      
      toast({
        description: "Saindo da conta...",
      })
      
      if (result?.success) {
        // Redirecionar para a página de login após o logout
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast({
        variant: "destructive",
        title: "Erro ao sair da conta",
        description: "Não foi possível sair da conta. Tente novamente mais tarde."
      })
    }
  }

  const handleInitializeChat = async () => {
    try {
      toast({
        description: "Inicializando dados de chat...",
      })
      
      const result = await initializeChatData()
      
      if (result?.success) {
        toast({
          title: "Dados inicializados",
          description: "Dados de chat inicializados com sucesso. Recarregando a página...",
        })
        
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (result?.error) {
        toast({
          variant: "destructive",
          title: "Erro ao inicializar dados",
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Erro ao inicializar dados de chat:', error)
      toast({
        variant: "destructive",
        title: "Erro ao inicializar dados",
        description: "Não foi possível inicializar os dados de chat. Tente novamente mais tarde."
      })
    }
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
          unread: false, // Implementar contagem de não lidos posteriormente
        }))}
        selectedId={selectedChatId}
        onSelect={setSelectedChatId}
        onCreateGroup={handleCreateGroup}
        isLoading={currentView === "chat" ? isLoading : isLoadingContacts}
        currentView={currentView}
        contacts={contacts}
        onStartChat={handleStartChat}
      />

      {/* Chat View */}
      {selectedChat ? (
        <ChatView
          chat={selectedChat}
          currentUser={currentUser}
          onSendMessage={(content, type, file) => handleSendMessage(selectedChat.id, content, type, file)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-muted-foreground">
          <p className="mb-4">Selecione uma conversa para começar</p>
          
          {chats.length === 0 && !isLoading && (
            <div className="flex flex-col items-center">
              <p className="mb-4">Você ainda não tem conversas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

