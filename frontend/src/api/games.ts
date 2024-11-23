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
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:profiles(id, name, email)
      `);

    if (error) {
      throw error;
    }

    if (!games) {
      return [];
    }

    return games.map(game => transformDbGameToGame(game as DbGame));
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

export const createGame = async (gameData: CreateGameData): Promise<Game> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      throw new Error('Not authenticated');
    }

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        title: gameData.title,
        description: gameData.description || null,
        location: gameData.location,
        latitude: gameData.latitude,
        longitude: gameData.longitude,
        date: gameData.date,
        max_players: gameData.max_players,
        skill_level: gameData.skill_level || null,
        creator_id: user.data.user.id,
        location_name: gameData.location_name || null,
        whatsapp_link: gameData.whatsapp_link || null,
        is_recurring: gameData.is_recurring || false,
        recurrence_frequency: gameData.recurrence_frequency || null,
      })
      .select(`
        *,
        creator:profiles(id, name, email)
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!game) {
      throw new Error('No game data returned');
    }

    return transformDbGameToGame(game as DbGame);
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
