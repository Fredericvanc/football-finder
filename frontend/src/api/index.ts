import axios from 'axios';
import { Game, Location, CreateGameData } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getGames = async (): Promise<Game[]> => {
  try {
    console.log('Fetching games...');
    const response = await axios.get(`${API_BASE_URL}/games`, {
      headers: getAuthHeader(),
    });
    
    // Transform the response to match our frontend types
    const games = response.data.map((game: any) => ({
      ...game,
      date_time: game.date, // Use date as date_time for now
      location_name: game.location, // Use location as location_name for now
    }));
    
    console.log('Games fetched successfully:', games);
    return games;
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

export const createGame = async (gameData: CreateGameData): Promise<Game> => {
  try {
    console.log('Creating game with data:', gameData);
    
    // Transform the data to match backend expectations
    const backendData = {
      title: gameData.title,
      description: gameData.description,
      location: gameData.location_name || gameData.location,
      latitude: gameData.latitude,
      longitude: gameData.longitude,
      date: gameData.date_time || gameData.date,
      max_players: gameData.max_players,
      min_players: gameData.min_players,
      skill_level: gameData.skill_level,
      is_recurring: gameData.is_recurring,
      recurrence_frequency: gameData.recurrence_frequency,
      whatsapp_link: gameData.whatsapp_link,
    };

    const response = await axios.post(`${API_BASE_URL}/games`, backendData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    // Transform the response to match our frontend types
    const createdGame: Game = {
      ...response.data,
      date_time: response.data.date, // Use date as date_time
      location_name: response.data.location, // Use location as location_name
    };

    console.log('Game created successfully:', createdGame);
    return createdGame;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
