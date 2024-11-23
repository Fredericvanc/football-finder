export interface Location {
  latitude: number;
  longitude: number;
}

export interface Game {
  id: string;
  title?: string;
  description?: string;
  location_name?: string;
  date_time: string;
  whatsapp_link?: string;
  max_players?: number;
  skill_level?: string;
  latitude: number;
  longitude: number;
  is_recurring?: boolean;
  recurrence_frequency?: 'weekly';
}

export interface User {
  id: number;
  email: string;
  notification_radius: number;
}

export interface CreateGameData {
  title?: string;
  description?: string;
  location_name?: string;
  date_time: string;
  whatsapp_link?: string;
  max_players?: number;
  skill_level?: string;
  latitude: number;
  longitude: number;
  is_recurring?: boolean;
  recurrence_frequency?: 'weekly';
}
