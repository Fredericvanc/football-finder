import { supabase } from '../supabase';
import { Game, CreateGameData } from '../types';
import { transformDbGameToGame } from './games';
import { config } from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getGames(): Promise<Game[]> {
  console.log('Fetching games...', { env: config.env });
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        profiles(id, name, email)
      `);

    if (error) throw error;
    return (games || []).map(game => transformDbGameToGame(game));
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}

export async function createGame(gameData: CreateGameData): Promise<Game> {
  console.log('Creating game with data:', gameData);
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('games')
      .insert([{
        title: gameData.title,
        description: gameData.description ?? null,
        location: gameData.location,
        location_name: gameData.location,
        latitude: gameData.latitude,
        longitude: gameData.longitude,
        date: gameData.date,
        max_players: gameData.max_players || 10,
        skill_level: gameData.skill_level ?? null,
        whatsapp_link: gameData.whatsapp_link ?? null,
        is_recurring: gameData.is_recurring || false,
        recurrence_frequency: gameData.recurrence_frequency ?? null,
        creator_id: user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    return transformDbGameToGame(data);
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}
