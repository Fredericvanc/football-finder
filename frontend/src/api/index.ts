import { supabase } from '../supabase';
import { Game, CreateGameData } from '../types';
import { config } from '../config';

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
  min_players?: number;
  skill_level: string | null;
  whatsapp_link: string | null;
  is_recurring: boolean;
  creator_id: string;
  created_at: string;
  profiles?: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
}

const transformGame = (dbGame: DatabaseGame): Game => {
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
    date_time: dbGame.date,
    max_players: dbGame.max_players,
    min_players: dbGame.min_players ?? 1,
    skill_level: dbGame.skill_level,
    whatsapp_link: dbGame.whatsapp_link,
    is_recurring: dbGame.is_recurring,
    creator: creator ? {
      id: creator.id,
      name: creator.name || 'Anonymous',
      email: creator.email
    } : null,
    creator_id: dbGame.creator_id,
    created_at: dbGame.created_at
  };
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getGames(): Promise<Game[]> {
  console.log('Fetching games...', { env: config.env });
  try {
    // First, update any recurring games that have passed
    console.log('Updating recurring games...');
    const { error: rpcError } = await supabase.rpc('handle_recurring_games');
    
    if (rpcError) {
      console.error('Error updating recurring games:', rpcError);
    } else {
      console.log('Successfully updated recurring games');
    }

    // Then fetch the updated games
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        profiles(id, name, email)
      `);

    if (error) throw error;
    console.log('Fetched games:', games);
    return (games || []).map(game => transformGame(game as unknown as DatabaseGame));
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}

export async function createGame(gameData: CreateGameData): Promise<Game> {
  console.log('Creating game with data:', gameData);
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    // Ensure required fields are present
    const insertData = {
      title: gameData.title,
      description: gameData.description ?? null,
      location: gameData.location,
      latitude: gameData.latitude,
      longitude: gameData.longitude,
      date: gameData.date,
      max_players: gameData.max_players || 10, // Default to 10 if not provided
      skill_level: gameData.skill_level ?? null,
      creator_id: user.id,
      location_name: gameData.location_name ?? null,
      whatsapp_link: gameData.whatsapp_link ?? null,
      is_recurring: gameData.is_recurring ?? false,
    };

    const { data, error } = await supabase
      .from('games')
      .insert(insertData)
      .select(`
        *,
        profiles(id, name, email)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');

    return transformGame(data as unknown as DatabaseGame);
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

export async function getGameById(id: number): Promise<Game | null> {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select(`
        *,
        profiles(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return game ? transformGame(game as unknown as DatabaseGame) : null;
  } catch (error) {
    console.error('Error in getGameById:', error);
    throw error;
  }
}
