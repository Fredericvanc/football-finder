import axios from 'axios';
import { supabase } from '../supabase';
import { Game, CreateGameData } from '../types';
import { transformDbGameToGame } from './games';
import { config } from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getGames(): Promise<Game[]> {
  console.log('Fetching games...');
  try {
    if (config.useLocalApi) {
      const response = await axios.get(`${config.apiBaseUrl}/games`, {
        headers: getAuthHeader(),
      });
      return response.data.map((game: any) => ({
        ...game,
        date_time: game.date,
        location_name: game.location,
      }));
    } else {
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          *,
          profiles(id, name, email)
        `);

      if (error) throw error;
      return (games || []).map(game => transformDbGameToGame(game));
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}

export async function createGame(gameData: CreateGameData): Promise<Game> {
  console.log('Creating game with data:', gameData);
  try {
    if (config.useLocalApi) {
      const backendData = {
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
      };

      const response = await axios.post(
        `${config.apiBaseUrl}/games`,
        backendData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      return transformDbGameToGame({
        ...response.data,
        date_time: response.data.date,
        location_name: response.data.location,
      });
    } else {
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
          *,
          profiles(id, name, email)
        `)
        .single();

      if (error) throw error;
      if (!game) throw new Error('No game data returned after creation');
      
      return transformDbGameToGame(game);
    }
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}
