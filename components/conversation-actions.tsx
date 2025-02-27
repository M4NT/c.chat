"use client"

import { Bell, BellOff, Share2, Star, Trash2, MoreVertical } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ConversationActionsProps {
  isMuted?: boolean
  onMute: () => void
  onShare: () => void
  onDelete: () => void
  onFavorite: () => void
}

export function ConversationActions({ isMuted, onMute, onShare, onDelete, onFavorite }: ConversationActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="sr-only">Abrir menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onMute}>
          {isMuted ? (
            <>
              <Bell className="mr-2 h-4 w-4" />
              <span>Ativar notificações</span>
            </>
          ) : (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              <span>Silenciar notificações</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFavorite}>
          <Star className="mr-2 h-4 w-4" />
          <span>Favoritar conversa</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Compartilhar contato</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Excluir conversa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

