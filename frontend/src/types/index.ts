export interface Location {
  latitude: number;
  longitude: number;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
}

export interface Game {
  id: number;
  title: string;
  description: string | null;
  location: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  date: string;
  max_players: number;
  skill_level: string | null;
  whatsapp_link: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  creator: Creator | null;
  created_at: string;
}

export interface CreateGameData {
  title: string;
  description?: string | null;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  max_players?: number;
  skill_level?: string | null;
  whatsapp_link?: string | null;
  is_recurring?: boolean;
  recurrence_frequency?: string | null;
}

export interface User {
  id: number;
  email: string;
  notification_radius: number;
}
