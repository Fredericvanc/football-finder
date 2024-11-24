import { supabase } from '../supabase';
import { Game, CreateGameData } from '../types';

// Type for raw game data from Supabase
interface SupabaseCreator {
  id: string;
  name: string | null;
  email: string;
}

interface DatabaseGame {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  location: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  date: string;
  date_time: string; // For backward compatibility
  max_players: number;
  min_players: number; // For backward compatibility
  skill_level: string | null;
  creator_id: string;
  whatsapp_link: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  profiles?: SupabaseCreator[];
}

export const transformGame = (dbGame: DatabaseGame): Game => {
  console.log('Transforming game:', dbGame);
  const creator = dbGame.profiles?.[0];
  
  return {
    id: dbGame.id,
    title: dbGame.title,
    description: dbGame.description,
    location: dbGame.location,
    location_name: dbGame.location_name || dbGame.location,
    latitude: dbGame.latitude,
    longitude: dbGame.longitude,
    date: dbGame.date,
    date_time: dbGame.date_time, // For backward compatibility
    max_players: dbGame.max_players,
    min_players: dbGame.min_players, // For backward compatibility
    skill_level: dbGame.skill_level,
    whatsapp_link: dbGame.whatsapp_link,
    is_recurring: dbGame.is_recurring,
    recurrence_frequency: dbGame.recurrence_frequency,
    creator: creator ? {
      id: creator.id,
      name: creator.name || 'Anonymous',
      email: creator.email,
    } : null,
    creator_id: dbGame.creator_id, // For backward compatibility
    created_at: dbGame.created_at,
  };
};

export const getGames = async (): Promise<Game[]> => {
  console.log('Fetching games...');
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        profiles(id, name, email)
      `);

    if (error) throw error;
    console.log('Fetched games:', games);
    return (games || []).map(game => transformGame(game));
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

    const gameInsert = {
      title: gameData.title,
      description: gameData.description ?? null,
      location: gameData.location,
      latitude: gameData.latitude,
      longitude: gameData.longitude,
      date: gameData.date,
      max_players: gameData.max_players || 10,
      min_players: gameData.min_players || 1, // For backward compatibility
      skill_level: gameData.skill_level ?? null,
      whatsapp_link: gameData.whatsapp_link ?? null,
      is_recurring: gameData.is_recurring || false,
      recurrence_frequency: gameData.recurrence_frequency ?? null,
      creator_id: user.id
    };

    const { data: game, error } = await supabase
      .from('games')
      .insert([gameInsert])
      .select(`
        *,
        profiles(id, name, email)
      `)
      .single();

    if (error) throw error;
    console.log('Created game:', game);
    return transformGame(game);
  } catch (error) {
    console.error('Error in createGame:', error);
    throw error;
  }
};
