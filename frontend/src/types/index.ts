export interface Location {
  latitude: number;
  longitude: number;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
}

export type RecurrenceFrequency = 'weekly' | 'monthly';

export interface Game {
  id: number;
  title: string;
  description: string | null;
  location: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  date: string;
  date_time: string;
  max_players: number;
  skill_level: string | null;
  whatsapp_link: string | null;
  is_recurring: boolean;
  creator: Creator | null;
  creator_id: string;
  created_at: string;
}

export interface CreateGameData {
  title: string;
  description?: string | null;
  location: string;
  location_name?: string | null;
  latitude: number;
  longitude: number;
  date: string;
  max_players?: number;
  skill_level?: string | null;
  whatsapp_link?: string | null;
  is_recurring?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  notification_radius?: number;
}

export interface GameFilters {
  search: string;
  skillLevel: string;
  maxPlayers: number;
  distance: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}
