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
    max_players: dbGame.max_players,
    skill_level: dbGame.skill_level,
    whatsapp_link: dbGame.whatsapp_link,
    is_recurring: dbGame.is_recurring,
    recurrence_frequency: dbGame.recurrence_frequency,
    creator: creator ? {
      id: creator.id,
      name: creator.name || 'Anonymous',
      email: creator.email,
    } : null,
    created_at: dbGame.created_at,
  };
};

export const getGames = async (): Promise<Game[]> => {
  console.log('Fetching games...');
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        id,
        title,
        description,
        location,
        location_name,
        latitude,
        longitude,
        date,
        max_players,
        skill_level,
        whatsapp_link,
        is_recurring,
        recurrence_frequency,
        created_at,
        creator_id,
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
        id,
        title,
        description,
        location,
        location_name,
        latitude,
        longitude,
        date,
        max_players,
        skill_level,
        whatsapp_link,
        is_recurring,
        recurrence_frequency,
        created_at,
        creator_id,
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
