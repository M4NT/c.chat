export type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

export type Group = {
  id: string
  name: string
  tag: string
  image?: string
  participants: User[]
  createdAt: Date
}

export type Message = {
  id: string
  chatId: string
  content: string
  type: "text" | "audio" | "file"
  sender: User
  timestamp: Date
  fileName?: string
  fileType?: string
  fileSize?: number
  status?: "sent" | "delivered" | "read" | "error"
  reactions?: Array<{
    emoji: string
    count: number
    users: User[]
  }>
  replyTo?: Message
}

export type Chat = {
  id: string
  type: "direct" | "group"
  participants: User[]
  groupInfo?: Group
  lastMessage?: string
  timestamp: Date
  messages: Message[]
}

