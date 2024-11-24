export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface DbProfile {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
}

export interface DbGame {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  max_players: number;
  skill_level: string | null;
  creator_id: string;
  location_name: string | null;
  whatsapp_link: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  creator: DbProfile | null;
}

export interface Game {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  date_time: string;
  max_players: number;
  min_players: number;
  skill_level: string | null;
  creator_id: string;
  location_name: string | null;
  whatsapp_link: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  creator: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface CreateGameData {
  title: string;
  description?: string | null;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  date_time: string;
  max_players: number;
  min_players?: number;
  skill_level?: string | null;
  location_name?: string | null;
  whatsapp_link?: string | null;
  is_recurring?: boolean;
  recurrence_frequency?: string | null;
}

export interface GameFilters {
  search?: string;
  skillLevel?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
}
