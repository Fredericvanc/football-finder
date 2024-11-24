import { supabase } from '../supabase';
import { Game, CreateGameData, DbGame, DbProfile } from '../types';

interface SupabaseGame extends Omit<DbGame, 'creator'> {
  creator: DbProfile[];
}

const transformDbGameToGame = (dbGame: SupabaseGame): Game => {
  console.log('Transforming game:', dbGame);
  return {
    id: dbGame.id,
    created_at: dbGame.created_at,
    title: dbGame.title,
    description: dbGame.description,
    location: dbGame.location,
    latitude: dbGame.latitude,
    longitude: dbGame.longitude,
    date: dbGame.date,
    date_time: dbGame.date,
    max_players: dbGame.max_players,
    min_players: 2,
    skill_level: dbGame.skill_level,
    creator_id: dbGame.creator_id,
    location_name: dbGame.location_name,
    whatsapp_link: dbGame.whatsapp_link,
    is_recurring: dbGame.is_recurring,
    recurrence_frequency: dbGame.recurrence_frequency,
    creator: dbGame.creator && dbGame.creator.length > 0 ? {
      id: dbGame.creator[0].id,
      name: dbGame.creator[0].name,
      email: dbGame.creator[0].email,
    } : null,
  };
};

export const getGames = async (): Promise<Game[]> => {
  try {
    console.log('Fetching games...');
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:profiles!games_creator_id_fkey(*)
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      throw error;
    }

    console.log('Fetched games:', games);
    return (games || []).map(game => transformDbGameToGame(game as SupabaseGame));
  } catch (error) {
    console.error('Error in getGames:', error);
    throw error;
  }
};

export const createGame = async (gameData: CreateGameData): Promise<Game> => {
  try {
    console.log('Creating game with data:', gameData);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }

    if (!userData.user) {
      throw new Error('No authenticated user found');
    }

    const gameInsertData = {
      title: gameData.title,
      description: gameData.description || null,
      location: gameData.location,
      latitude: gameData.latitude,
      longitude: gameData.longitude,
      date: gameData.date,
      max_players: gameData.max_players,
      skill_level: gameData.skill_level || null,
      creator_id: userData.user.id,
      location_name: gameData.location_name || null,
      whatsapp_link: gameData.whatsapp_link || null,
      is_recurring: gameData.is_recurring || false,
      recurrence_frequency: gameData.recurrence_frequency || null,
    };

    const { data: game, error } = await supabase
      .from('games')
      .insert([gameInsertData])
      .select(`
        *,
        creator:profiles!games_creator_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error creating game:', error);
      throw error;
    }

    if (!game) {
      throw new Error('No game data returned after creation');
    }

    console.log('Created game:', game);
    return transformDbGameToGame(game as SupabaseGame);
  } catch (error) {
    console.error('Error in createGame:', error);
    throw error;
  }
};
