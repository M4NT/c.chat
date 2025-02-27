export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					id: string
					email: string
					password_hash: string
					name: string
					avatar_url: string | null
					status: string
					last_seen: string | null
					created_at: string
					updated_at: string
					deleted_at: string | null
				}
				Insert: {
					id?: string
					email: string
					password_hash: string
					name: string
					avatar_url?: string | null
					status?: string
					last_seen?: string | null
					created_at?: string
					updated_at?: string
					deleted_at?: string | null
				}
				Update: {
					id?: string
					email?: string
					password_hash?: string
					name?: string
					avatar_url?: string | null
					status?: string
					last_seen?: string | null
					created_at?: string
					updated_at?: string
					deleted_at?: string | null
				}
			}
			companies: {
				Row: {
					id: string
					name: string
					whatsapp_number: string | null
					whatsapp_token: string | null
					created_at: string
					updated_at: string
				}
				Insert: {
					id?: string
					name: string
					whatsapp_number?: string | null
					whatsapp_token?: string | null
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					name?: string
					whatsapp_number?: string | null
					whatsapp_token?: string | null
					created_at?: string
					updated_at?: string
				}
			}
			company_users: {
				Row: {
					company_id: string
					user_id: string
					role: string
					created_at: string
				}
				Insert: {
					company_id: string
					user_id: string
					role: string
					created_at?: string
				}
				Update: {
					company_id?: string
					user_id?: string
					role?: string
					created_at?: string
				}
			}
			chats: {
				Row: {
					id: string
					type: string
					company_id: string
					created_by: string
					created_at: string
					updated_at: string
					last_message_at: string | null
					deleted_at: string | null
				}
				Insert: {
					id?: string
					type: string
					company_id: string
					created_by: string
					created_at?: string
					updated_at?: string
					last_message_at?: string | null
					deleted_at?: string | null
				}
				Update: {
					id?: string
					type?: string
					company_id?: string
					created_by?: string
					created_at?: string
					updated_at?: string
					last_message_at?: string | null
					deleted_at?: string | null
				}
			}
			chat_participants: {
				Row: {
					chat_id: string
					user_id: string
					joined_at: string
					left_at: string | null
					role: string
				}
				Insert: {
					chat_id: string
					user_id: string
					joined_at?: string
					left_at?: string | null
					role?: string
				}
				Update: {
					chat_id?: string
					user_id?: string
					joined_at?: string
					left_at?: string | null
					role?: string
				}
			}
			groups: {
				Row: {
					chat_id: string
					name: string
					description: string | null
					image_url: string | null
					tag: string
					created_at: string
					updated_at: string
				}
				Insert: {
					chat_id: string
					name: string
					description?: string | null
					image_url?: string | null
					tag: string
					created_at?: string
					updated_at?: string
				}
				Update: {
					chat_id?: string
					name?: string
					description?: string | null
					image_url?: string | null
					tag?: string
					created_at?: string
					updated_at?: string
				}
			}
			messages: {
				Row: {
					id: string
					chat_id: string
					sender_id: string
					reply_to_id: string | null
					type: string
					content: string
					metadata: Json
					status: string
					created_at: string
					updated_at: string
					deleted_at: string | null
				}
				Insert: {
					id?: string
					chat_id: string
					sender_id: string
					reply_to_id?: string | null
					type: string
					content: string
					metadata?: Json
					status?: string
					created_at?: string
					updated_at?: string
					deleted_at?: string | null
				}
				Update: {
					id?: string
					chat_id?: string
					sender_id?: string
					reply_to_id?: string | null
					type?: string
					content?: string
					metadata?: Json
					status?: string
					created_at?: string
					updated_at?: string
					deleted_at?: string | null
				}
			}
			files: {
				Row: {
					id: string
					message_id: string
					uploader_id: string
					original_name: string
					storage_path: string
					mime_type: string
					size: number
					metadata: Json
					created_at: string
				}
				Insert: {
					id?: string
					message_id: string
					uploader_id: string
					original_name: string
					storage_path: string
					mime_type: string
					size: number
					metadata?: Json
					created_at?: string
				}
				Update: {
					id?: string
					message_id?: string
					uploader_id?: string
					original_name?: string
					storage_path?: string
					mime_type?: string
					size?: number
					metadata?: Json
					created_at?: string
				}
			}
			reactions: {
				Row: {
					id: string
					message_id: string
					user_id: string
					emoji: string
					created_at: string
				}
				Insert: {
					id?: string
					message_id: string
					user_id: string
					emoji: string
					created_at?: string
				}
				Update: {
					id?: string
					message_id?: string
					user_id?: string
					emoji?: string
					created_at?: string
				}
			}
			notes: {
				Row: {
					id: string
					chat_id: string
					user_id: string
					content: string
					marker: string | null
					statuses: string[]
					position: number
					created_at: string
					updated_at: string
				}
				Insert: {
					id?: string
					chat_id: string
					user_id: string
					content: string
					marker?: string | null
					statuses?: string[]
					position: number
					created_at?: string
					updated_at?: string
				}
				Update: {
					id?: string
					chat_id?: string
					user_id?: string
					content?: string
					marker?: string | null
					statuses?: string[]
					position?: number
					created_at?: string
					updated_at?: string
				}
			}
			user_settings: {
				Row: {
					user_id: string
					notification_preferences: Json
					theme: string
					language: string
					updated_at: string
				}
				Insert: {
					user_id: string
					notification_preferences?: Json
					theme?: string
					language?: string
					updated_at?: string
				}
				Update: {
					user_id?: string
					notification_preferences?: Json
					theme?: string
					language?: string
					updated_at?: string
				}
			}
			chat_settings: {
				Row: {
					chat_id: string
					user_id: string
					is_muted: boolean
					is_pinned: boolean
					custom_name: string | null
					notification_preferences: Json
					updated_at: string
				}
				Insert: {
					chat_id: string
					user_id: string
					is_muted?: boolean
					is_pinned?: boolean
					custom_name?: string | null
					notification_preferences?: Json
					updated_at?: string
				}
				Update: {
					chat_id?: string
					user_id?: string
					is_muted?: boolean
					is_pinned?: boolean
					custom_name?: string | null
					notification_preferences?: Json
					updated_at?: string
				}
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
	}
} 