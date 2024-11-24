import axios from 'axios';
import { supabase } from '../supabase';
import { Game, Location, CreateGameData } from '../types';
import { transformDbGameToGame } from './games';

const API_BASE_URL = 'http://localhost:5001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getGames(): Promise<Game[]> {
  console.log('Fetching games...');
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        creator:user_id (
          id,
          name,
          email
        )
      `);

    if (error) throw error;
    
    console.log('Games fetched successfully:', games);
    return games.map(transformDbGameToGame);
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

export async function createGame(gameData: CreateGameData): Promise<Game> {
  console.log('Creating game with data:', gameData);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: game, error } = await supabase
      .from('games')
      .insert([{
        title: gameData.title,
        description: gameData.description,
        location_name: gameData.location,
        latitude: gameData.latitude,
        longitude: gameData.longitude,
        date_time: gameData.date,
        whatsapp_link: gameData.whatsappLink,
        user_id: user.id
      }])
      .select(`
        *,
        creator:user_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;
    
    return transformDbGameToGame(game);
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
