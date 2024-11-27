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
      games: {
        Row: {
          id: number
          title: string
          description: string | null
          location: string
          latitude: number
          longitude: number
          date: string
          max_players: number
          skill_level: string | null
          creator_id: string
          created_at: string
          location_name: string | null
          whatsapp_link: string | null
          is_recurring: boolean
          recurrence_frequency: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          location: string
          latitude: number
          longitude: number
          date: string
          max_players: number
          skill_level?: string | null
          creator_id: string
          created_at?: string
          location_name?: string | null
          whatsapp_link?: string | null
          is_recurring?: boolean
          recurrence_frequency?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          location?: string
          latitude?: number
          longitude?: number
          date?: string
          max_players?: number
          skill_level?: string | null
          creator_id?: string
          created_at?: string
          location_name?: string | null
          whatsapp_link?: string | null
          is_recurring?: boolean
          recurrence_frequency?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_recurring_games: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
