"use client"

import { useEffect, useState, useRef } from "react"
import { LogOut, MessageSquare, Users, Loader2, AlertTriangle } from "lucide-react"
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
import { getSupabase, getSupabaseWithFallback, checkSupabaseConnection, getAllUsers } from "@/lib/supabase"
import { logoutAction, initializeChatData, createExampleUsers } from "@/app/lib/actions"
import { Database } from "@/types/database.types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Removendo os dados mockados
// const mockContacts: User[] = [...]

type View = "chat" | "contacts"
type DbUser = Database['public']['Tables']['users']['Row']
type DbGroup = Database['public']['Tables']['groups']['Row']

export function AppShell() {
  const { user, signOut } = useAuth()
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const [chats, setChats] = useState<Chat[]>([])
  const [contacts, setContacts] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [sessionVerified, setSessionVerified] = useState(false)
  const [forceShowInterface, setForceShowInterface] = useState(false)
  const loadingAttempts = useRef(0)
  const maxLoadingAttempts = 2
  const { toast } = useToast()
  const router = useRouter()

  // Verificar se o usuário está autenticado e definir sessionVerified
  useEffect(() => {
    // Forçar exibição da interface após 2 segundos independentemente do estado de autenticação
    const forceShowTimeout = setTimeout(() => {
      if (isLoading || isLoadingContacts) {
        console.log("Forçando exibição da interface após 2 segundos")
        setForceShowInterface(true)
        
        // Criar dados de exemplo se necessário
        if (contacts.length === 0) {
          setContacts([
            {
              id: "example-1",
              name: "Maria Silva",
              email: "maria@exemplo.com",
              status: "online"
            },
            {
              id: "example-2",
              name: "João Santos",
              email: "joao@exemplo.com",
              status: "offline"
            },
            {
              id: "example-3",
              name: "Ana Oliveira",
              email: "ana@exemplo.com",
              status: "online"
            }
          ])
          setIsLoadingContacts(false)
        }
        
        if (chats.length === 0) {
          setChats([
            {
              id: "example-chat-1",
              type: "direct",
              participants: [
                {
                  id: "current-user",
                  name: user?.name || "Você",
                  email: user?.email || "voce@exemplo.com",
                  status: "online"
                },
                {
                  id: "example-1",
                  name: "Maria Silva",
                  email: "maria@exemplo.com",
                  status: "online"
                }
              ],
              lastMessage: "Olá, como você está?",
              timestamp: new Date(),
              messages: []
            }
          ])
          setIsLoading(false)
        }
      }
    }, 2000)
    
    return () => clearTimeout(forceShowTimeout)
  }, [isLoading, isLoadingContacts, contacts.length, chats.length, user])

  // Verificar se o usuário está autenticado e definir sessionVerified
  useEffect(() => {
    if (user) {
      console.log("Usuário autenticado:", user.id)
      setSessionVerified(true)
      loadingAttempts.current = 0 // Resetar contador quando autenticado
    } else if (loadingAttempts.current >= maxLoadingAttempts) {
      console.log(`Usuário não autenticado após ${maxLoadingAttempts} tentativas`)
      
      // Verificar cookies antes de redirecionar
      const hasCookies = typeof document !== 'undefined' && (
        document.cookie.includes('sb-access-token') || 
        document.cookie.includes('sb-auth-state')
      )
      
      if (!hasCookies) {
        console.log("Nenhum cookie de autenticação encontrado, redirecionando para login")
        window.location.href = '/auth/login'
      } else {
        console.log("Cookies de autenticação encontrados, mas sessão não restaurada")
        // Forçar exibição da interface com dados de exemplo após timeout
        setForceShowInterface(true)
        
        // Criar dados de exemplo
        setContacts([
          {
            id: "example-1",
            name: "Maria Silva",
            email: "maria@exemplo.com",
            status: "online"
          },
          {
            id: "example-2",
            name: "João Santos",
            email: "joao@exemplo.com",
            status: "offline"
          },
          {
            id: "example-3",
            name: "Ana Oliveira",
            email: "ana@exemplo.com",
            status: "online"
          }
        ])
        
        setChats([
          {
            id: "example-chat-1",
            type: "direct",
            participants: [
              {
                id: "current-user",
                name: "Você",
                email: "voce@exemplo.com",
                status: "online"
              },
              {
                id: "example-1",
                name: "Maria Silva",
                email: "maria@exemplo.com",
                status: "online"
              }
            ],
            lastMessage: "Olá, como você está?",
            timestamp: new Date(),
            messages: []
          }
        ])
        
        setIsLoading(false)
        setIsLoadingContacts(false)
      }
    } else {
      loadingAttempts.current += 1
      console.log(`Tentativa ${loadingAttempts.current} de verificar sessão`)
    }
  }, [user])

  // Definir um timeout para forçar a exibição da interface
  useEffect(() => {
    // Se já estamos forçando a exibição, não precisamos do timeout
    if (forceShowInterface) {
      setIsLoading(false)
      setIsLoadingContacts(false)
      return
    }
    
    const timeoutId = setTimeout(() => {
      if (isLoading || isLoadingContacts) {
        console.log("Timeout de carregamento atingido. Forçando exibição da interface.")
        setTimeoutReached(true)
        setForceShowInterface(true)
        
        // Criar dados de exemplo se necessário
        if (isLoadingContacts) {
          setContacts([
            {
              id: "example-1",
              name: "Maria Silva",
              email: "maria@exemplo.com",
              status: "online"
            },
            {
              id: "example-2",
              name: "João Santos",
              email: "joao@exemplo.com",
              status: "offline"
            },
            {
              id: "example-3",
              name: "Ana Oliveira",
              email: "ana@exemplo.com",
              status: "online"
            }
          ])
          setIsLoadingContacts(false)
        }
        
        if (isLoading) {
          setChats([
            {
              id: "example-chat-1",
              type: "direct",
              participants: [
                {
                  id: "current-user",
                  name: user?.name || "Você",
                  email: user?.email || "voce@exemplo.com",
                  status: "online"
                },
                {
                  id: "example-1",
                  name: "Maria Silva",
                  email: "maria@exemplo.com",
                  status: "online"
                }
              ],
              lastMessage: "Olá, como você está?",
              timestamp: new Date(),
              messages: []
            }
          ])
          setIsLoading(false)
        }
      }
    }, 2000) // Reduzido para 2 segundos
    
    return () => clearTimeout(timeoutId)
  }, [isLoading, isLoadingContacts, forceShowInterface, user])

  // Verificar conexão com Supabase
  useEffect(() => {
    const checkConnection = async () => {
      // Se já estamos forçando a exibição da interface, não verificar conexão
      if (forceShowInterface) {
        return
      }
      
      const isConnected = await checkSupabaseConnection()
      setConnectionError(!isConnected)
      
      if (!isConnected) {
        console.error("Erro de conexão com Supabase detectado")
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor. Usando dados de exemplo."
        })
        
        // Forçar exibição da interface com dados de exemplo
        setForceShowInterface(true)
        
        // Criar contatos de exemplo
        setContacts([
          {
            id: "example-1",
            name: "Maria Silva",
            email: "maria@exemplo.com",
            status: "online"
          },
          {
            id: "example-2",
            name: "João Santos",
            email: "joao@exemplo.com",
            status: "offline"
          },
          {
            id: "example-3",
            name: "Ana Oliveira",
            email: "ana@exemplo.com",
            status: "online"
          }
        ])
        
        // Criar chats de exemplo
        setChats([
          {
            id: "example-chat-1",
            type: "direct",
            participants: [
              {
                id: "current-user",
                name: user?.name || "Você",
                email: user?.email || "voce@exemplo.com",
                status: "online"
              },
              {
                id: "example-1",
                name: "Maria Silva",
                email: "maria@exemplo.com",
                status: "online"
              }
            ],
            lastMessage: "Olá, como você está?",
            timestamp: new Date(),
            messages: []
          }
        ])
        
        setIsLoading(false)
        setIsLoadingContacts(false)
      }
    }
    
    checkConnection()
  }, [toast, user, forceShowInterface])

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
      if (!user) {
        console.log("Nenhum usuário autenticado, não carregando contatos")
        setIsLoadingContacts(false)
        return
      }
      
      // Se já detectou erro de conexão, não tentar carregar
      if (connectionError || timeoutReached) {
        return
      }
      
      console.log("Iniciando carregamento de contatos para o usuário:", user.id)
      setIsLoadingContacts(true)
      try {
        // Usar a nova função para buscar todos os usuários
        const { data: usersData, error: usersError } = await getAllUsers()
        
        if (usersError) {
          console.error("Erro ao buscar usuários:", usersError)
          throw usersError
        }
        
        console.log("Usuários encontrados:", usersData?.length || 0, usersData)
        
        // Verificar se não há usuários e criar usuários de exemplo
        if (!usersData || usersData.length === 0) {
          console.log("Nenhum usuário encontrado, criando usuários de exemplo...")
          
          // Criar usuários de exemplo no banco de dados
          const { success, users } = await createExampleUsers()
          
          if (success && users && users.length > 0) {
            console.log("Usuários de exemplo criados com sucesso:", users)
            
            // Converter para o formato esperado pelo componente
            const formattedContacts = users.map((userData: any) => ({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              avatar: userData.avatar_url || undefined,
              status: userData.status || 'offline'
            }))
            
            setContacts(formattedContacts)
            setIsLoadingContacts(false)
            return
          } else {
            console.log("Não foi possível criar usuários de exemplo, usando dados locais...")
            
            // Criar alguns contatos de exemplo para não deixar a interface vazia
            const exampleContacts = [
              {
                id: "example-1",
                name: "Maria Silva",
                email: "maria@exemplo.com",
                status: "online"
              },
              {
                id: "example-2",
                name: "João Santos",
                email: "joao@exemplo.com",
                status: "offline"
              },
              {
                id: "example-3",
                name: "Ana Oliveira",
                email: "ana@exemplo.com",
                status: "online"
              }
            ]
            setContacts(exampleContacts)
            setIsLoadingContacts(false)
            return
          }
        }
        
        // Converter para o formato esperado pelo componente
        const formattedContacts = (usersData || []).map((userData: any) => ({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_url || undefined,
          status: userData.status || 'offline'
        }))
        
        console.log("Contatos formatados:", formattedContacts.length)
        setContacts(formattedContacts)
      } catch (error) {
        console.error('Erro ao carregar contatos:', error)
        toast({
          variant: "destructive",
          title: "Erro ao carregar contatos",
          description: "Não foi possível carregar seus contatos. Usando dados de exemplo."
        })
        
        // Criar alguns contatos de exemplo para não deixar a interface vazia
        console.log("Criando contatos de exemplo para exibição")
        const exampleContacts = [
          {
            id: "example-1",
            name: "Maria Silva",
            email: "maria@exemplo.com",
            status: "online"
          },
          {
            id: "example-2",
            name: "João Santos",
            email: "joao@exemplo.com",
            status: "offline"
          },
          {
            id: "example-3",
            name: "Ana Oliveira",
            email: "ana@exemplo.com",
            status: "online"
          }
        ]
        setContacts(exampleContacts)
      } finally {
        setIsLoadingContacts(false)
      }
    }
    
    loadContacts()
  }, [user, toast, connectionError, timeoutReached])

  // Carregar chats do usuário
  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        console.log("Nenhum usuário autenticado, não carregando chats")
        setIsLoading(false)
        return
      }
      
      // Se já detectou erro de conexão, não tentar carregar
      if (connectionError || timeoutReached) {
        return
      }
      
      console.log("Iniciando busca de chats para o usuário:", user.id)
      setIsLoading(true)
      try {
        const supabase = getSupabaseWithFallback()
        
        // Buscar chats em que o usuário é participante
        const { data: chatParticipants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id)
          .is('left_at', null)
        
        if (participantsError) {
          console.error("Erro ao buscar participantes:", participantsError)
          // Não lançar erro, apenas continuar com lista vazia
          setChats([])
          setIsLoading(false)
          return
        }
        
        console.log("Participantes encontrados:", chatParticipants?.length || 0)
        
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
          // Não lançar erro, apenas continuar com lista vazia
          setChats([])
          setIsLoading(false)
          return
        }
        
        console.log("Chats encontrados:", chatsData?.length || 0)
        
        if (!chatsData || chatsData.length === 0) {
          console.log("Nenhum chat encontrado com os IDs fornecidos")
          setChats([])
          setIsLoading(false)
          return
        }

        // Buscar participantes para cada chat
        const chatPromises = chatsData.map(async (chat) => {
          const { data: participants, error: participantsError } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              users (
                id,
                name,
                email,
                avatar_url
              )
            `)
            .eq('chat_id', chat.id)
            .is('left_at', null)

          if (participantsError) {
            console.error(`Erro ao buscar participantes para o chat ${chat.id}:`, participantsError)
            // Retornar um objeto Chat válido mesmo em caso de erro
            return {
              id: chat.id,
              type: chat.type as 'direct' | 'group',
              participants: [],
              timestamp: new Date(chat.last_message_at || chat.updated_at || chat.created_at),
              messages: []
            } as Chat;
          }

          // Buscar última mensagem
          const { data: lastMessages, error: messagesError } = await supabase
            .from('messages')
            .select('id, content, created_at, user_id, users(name)')
            .eq('chat_id', chat.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)

          if (messagesError) {
            console.error(`Erro ao buscar última mensagem para o chat ${chat.id}:`, messagesError)
          }

          const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null

          // Formatar participantes
          const formattedParticipants = participants
            ? participants.map((p: any) => ({
                id: p.user_id,
                name: p.users?.name || 'Usuário desconhecido',
                email: p.users?.email || '',
                avatar: p.users?.avatar_url || undefined
              }))
            : []

          // Determinar o nome do chat
          let chatName = ''
          let chatAvatar = undefined

          if (chat.type === 'group' && chat.groups && chat.groups[0]) {
            // Para grupos, usar o nome do grupo (groups é um array)
            chatName = chat.groups[0].name || 'Grupo sem nome'
            chatAvatar = chat.groups[0].image_url
          } else {
            // Para chats diretos, usar o nome do outro participante
            const otherParticipant = formattedParticipants.find(p => p.id !== user.id)
            chatName = otherParticipant?.name || 'Chat'
            chatAvatar = otherParticipant?.avatar
          }

          // Formatar a última mensagem
          let lastMessageText = ''
          if (lastMessage) {
            lastMessageText = lastMessage.content || ''
          }

          // Criar objeto de chat no formato esperado
          const formattedChat: Chat = {
            id: chat.id,
            type: chat.type as 'direct' | 'group',
            participants: formattedParticipants,
            lastMessage: lastMessageText,
            timestamp: new Date(chat.last_message_at || chat.updated_at || chat.created_at),
            messages: [],
            groupInfo: chat.type === 'group' && chat.groups && chat.groups[0] ? {
              id: chat.id,
              name: chat.groups[0].name || 'Grupo sem nome',
              tag: chat.groups[0].tag || '',
              image: chat.groups[0].image_url,
              participants: formattedParticipants,
              createdAt: new Date(chat.created_at)
            } : undefined
          }

          return formattedChat
        })

        try {
          const formattedChats = await Promise.all(chatPromises)
          console.log("Chats formatados:", formattedChats.length)
          setChats(formattedChats)
        } catch (error) {
          console.error("Erro ao processar chats:", error)
          // Em caso de erro, definir uma lista vazia em vez de lançar erro
          setChats([])
          toast({
            variant: "destructive",
            title: "Erro ao carregar conversas",
            description: "Não foi possível carregar suas conversas. Tente novamente mais tarde."
          })
        } finally {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Erro ao carregar chats:', error)
        setChats([])
        toast({
          variant: "destructive",
          title: "Erro ao carregar conversas",
          description: "Não foi possível carregar suas conversas. Tente novamente mais tarde."
        })
        setIsLoading(false)
      }
    }

    loadChats()
  }, [user, toast, connectionError, timeoutReached])

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
      {/* Avisos de conexão */}
      {(connectionError || timeoutReached) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problema de conexão</AlertTitle>
            <AlertDescription>
              {connectionError 
                ? "Não foi possível conectar ao servidor. Usando dados de exemplo." 
                : "Tempo limite de carregamento excedido. Usando dados de exemplo."}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Sidebar */}
      <div className="w-20 border-r flex flex-col items-center py-4 gap-6">
        <div className="w-12 h-12">
          <Image src="/saudecredlogo.svg" alt="SaudeCred Logo" width={48} height={48} className="rounded-lg" />
        </div>
        <Separator />
        <Button
          variant="default"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
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

      {/* Lista unificada de conversas e contatos */}
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
        isLoading={isLoading || isLoadingContacts}
        contacts={contacts}
        onStartChat={handleStartChat}
        currentView="chat"
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
          <p className="mb-4">Selecione uma conversa ou contato para começar</p>
          
          {chats.length === 0 && contacts.length === 0 && !isLoading && !isLoadingContacts && (
            <div className="flex flex-col items-center">
              <p className="mb-4">Você ainda não tem conversas ou contatos</p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleInitializeChat}>
                  Inicializar dados de exemplo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      toast({
                        description: "Criando usuários de exemplo...",
                      })
                      
                      const response = await fetch('/api/create-example-users')
                      const data = await response.json()
                      
                      if (data.success) {
                        toast({
                          title: "Usuários criados",
                          description: "Usuários de exemplo criados com sucesso. Recarregando a página...",
                        })
                        
                        // Recarregar a página após 2 segundos
                        setTimeout(() => {
                          window.location.reload()
                        }, 2000)
                      } else {
                        toast({
                          variant: "destructive",
                          title: "Erro ao criar usuários",
                          description: data.error || "Não foi possível criar usuários de exemplo.",
                        })
                      }
                    } catch (error) {
                      console.error('Erro ao criar usuários de exemplo:', error)
                      toast({
                        variant: "destructive",
                        title: "Erro ao criar usuários",
                        description: "Não foi possível criar usuários de exemplo.",
                      })
                    }
                  }}
                >
                  Criar usuários de exemplo
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

