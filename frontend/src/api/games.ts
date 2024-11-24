import { supabase } from '../supabase';
import { Game, CreateGameData } from '../types';

interface DatabaseGame {
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
  created_at: string;
  creator_id: string;
  profiles?: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
}

export const transformGame = (dbGame: DatabaseGame): Game => {
  const creator = dbGame.profiles?.[0];
  return {
    id: dbGame.id,
    title: dbGame.title,
    description: dbGame.description,
    location: dbGame.location,
    location_name: dbGame.location_name,
    latitude: dbGame.latitude,
    longitude: dbGame.longitude,
    date: dbGame.date,
    date_time: dbGame.date, // Using date as date_time
    max_players: dbGame.max_players,
    min_players: 1, // Default value
    skill_level: dbGame.skill_level,
    whatsapp_link: dbGame.whatsapp_link,
    is_recurring: dbGame.is_recurring,
    recurrence_frequency: dbGame.recurrence_frequency,
    creator: creator ? {
      id: creator.id,
      name: creator.name || 'Anonymous',
      email: creator.email
    } : null,
    creator_id: dbGame.creator_id,
    created_at: dbGame.created_at
  };
};

export const getGames = async (): Promise<Game[]> => {
  console.log('Fetching games...');
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        profiles (
          id,
          name,
          email
        )
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return (games || []).map(game => transformGame(game as DatabaseGame));
  } catch (error) {
    console.error('Error in getGames:', error);
    throw error;
  }
};

export const createGame = async (gameData: CreateGameData): Promise<Game> => {
  console.log('Creating game with data:', gameData);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: game, error } = await supabase
      .from('games')
      .insert([
        {
          title: gameData.title,
          description: gameData.description ?? null,
          location: gameData.location,
          latitude: gameData.latitude,
          longitude: gameData.longitude,
          date: gameData.date,
          max_players: gameData.max_players || 10,
          skill_level: gameData.skill_level ?? null,
          whatsapp_link: gameData.whatsapp_link ?? null,
          is_recurring: gameData.is_recurring || false,
          recurrence_frequency: gameData.recurrence_frequency ?? null,
          creator_id: user.id
        }
      ])
      .select(`
        *,
        profiles (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    
    return transformGame(game as DatabaseGame);
  } catch (error) {
    console.error('Error in createGame:', error);
    throw error;
  }
};
