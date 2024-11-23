import { supabase } from '../supabase';
import { Game, CreateGameData, DbGame } from '../types';

const transformDbGameToGame = (dbGame: DbGame): Game => ({
  ...dbGame,
  date_time: dbGame.date, // Use date as date_time
  min_players: 2, // Default value
  creator: dbGame.creator && dbGame.creator.length > 0 ? {
    id: dbGame.creator[0].id,
    name: dbGame.creator[0].name,
    email: dbGame.creator[0].email,
  } : null,
});

export const getGames = async (): Promise<Game[]> => {
  try {
    console.log('Fetching games...');
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:profiles(*)
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      throw error;
    }

    console.log('Fetched games:', games);
    return games.map(game => transformDbGameToGame(game as DbGame));
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

    const { data: game, error } = await supabase
      .from('games')
      .insert([
        {
          ...gameData,
          creator_id: userData.user.id
        }
      ])
      .select(`
        *,
        creator:profiles(*)
      `)
      .single();

    if (error) {
      console.error('Error creating game:', error);
      throw error;
    }

    console.log('Created game:', game);
    return transformDbGameToGame(game as DbGame);
  } catch (error) {
    console.error('Error in createGame:', error);
    throw error;
  }
};
