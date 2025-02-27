"use client"

import type React from "react"

import { useState } from "react"
import { ImagePlus, Loader2, Search, Users, X } from "lucide-react"
import Image from "next/image"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types"

interface GroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: User[]
  onCreateGroup: (group: {
    name: string
    tag: string
    image?: string
    participants: string[]
  }) => Promise<void>
}

export function GroupModal({ open, onOpenChange, contacts, onCreateGroup }: GroupModalProps) {
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [image, setImage] = useState<string>()
  const [participants, setParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSubmit = async () => {
    if (!name || !tag || participants.length === 0) return

    setIsLoading(true)
    try {
      await onCreateGroup({
        name,
        tag,
        image,
        participants,
      })
      onOpenChange(false)
      setName("")
      setTag("")
      setImage(undefined)
      setParticipants([])
      setSearchQuery("")
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Novo Grupo</DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full border overflow-hidden flex-shrink-0">
              {image ? (
                <Image src={image || "/placeholder.svg"} alt="Group picture" fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 transition-opacity"
                onClick={() => document.getElementById("picture")?.click()}
              >
                <ImagePlus className="h-5 w-5 text-white" />
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              <Input placeholder="Nome do grupo" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Tag do grupo" value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>
          </div>
          <input id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar participantes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {participants.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {participants.map((id) => {
                  const contact = contacts.find((c) => c.id === id)
                  if (!contact) return null
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {contact.name.split(" ")[0]}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => toggleParticipant(id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            )}

            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4 space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center space-x-2 hover:bg-accent rounded-lg p-2 cursor-pointer"
                    onClick={() => toggleParticipant(contact.id)}
                  >
                    <Checkbox
                      id={contact.id}
                      checked={participants.includes(contact.id)}
                      className="pointer-events-none"
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button onClick={handleSubmit} disabled={isLoading || !name || !tag || participants.length === 0}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

