import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import RepeatIcon from '@mui/icons-material/Repeat';
import { Game } from '../types';
import { format } from 'date-fns';
import { calculateDistance } from '../utils/distance';
import { LocationSearch } from './LocationSearch';
import { GameFiltersComponent } from './GameFilters';

interface GameListProps {
  games: Game[];
  onGameSelect: (game: Game | null) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onFilterChange: (key: keyof GameFilters, value: string | number | { lat: number; lng: number; address: string }) => void;
  currentLocation: { latitude: number; longitude: number };
  selectedGame: Game | null;
  showOnlyFilters?: boolean;
  showOnlyList?: boolean;
  filters: GameFilters;
}

export interface GameFilters {
  search: string;
  skillLevel: string;
  minPlayers: number;
  maxPlayers: number;
  distance: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export const GameList: React.FC<GameListProps> = ({
  games,
  onGameSelect,
  onLocationSelect,
  onFilterChange,
  currentLocation,
  selectedGame,
  showOnlyFilters = false,
  showOnlyList = false,
  filters
}) => {
  const filteredGames = React.useMemo(() => {
    // First filter the games
    const filtered = games.filter(game => {
      // Filter by search text
      if (filters.search && !game.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filter by skill level
      if (filters.skillLevel !== 'all' && game.skill_level !== filters.skillLevel) {
        return false;
      }

      // Filter by players
      if (game.max_players < filters.minPlayers || game.min_players > filters.maxPlayers) {
        return false;
      }

      // Filter by distance if location is set
      if (filters.location.lat && filters.location.lng) {
        const distance = calculateDistance(
          filters.location.lat,
          filters.location.lng,
          game.latitude,
          game.longitude
        );
        if (distance > filters.distance) {
          return false;
        }
      }

      return true;
    });

    // Then sort by date (closest date first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [games, filters]);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      position: 'relative',
      zIndex: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: 'hidden',
      ...(showOnlyList && {
        maxHeight: { xs: '500px', md: '100%' },
      })
    }}>
      {/* Filters */}
      {!showOnlyList && (
        <GameFiltersComponent
          filters={filters}
          onFilterChange={onFilterChange}
          onLocationSelect={onLocationSelect}
        />
      )}

      {/* Game List */}
      {!showOnlyFilters && (
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          px: 2,
          py: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0,0,0,0.2)',
          },
        }}>
          <Stack spacing={2}>
            {filteredGames.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No games found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters or increasing the search radius
                </Typography>
              </Box>
            ) : (
              filteredGames.map((game) => (
                <Card
                  key={game.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                    border: selectedGame?.id === game.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => onGameSelect(game)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {game.title || 'Football Game'}
                      </Typography>
                      {game.is_recurring && (
                        <Tooltip title="Recurring game">
                          <RepeatIcon color="action" />
                        </Tooltip>
                      )}
                    </Box>

                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {game.location_name || 'Location Name'} ({calculateDistance(
                            currentLocation.latitude,
                            currentLocation.longitude,
                            game.latitude,
                            game.longitude
                          ).toFixed(1)} km)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(game.date), 'PPp')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {game.min_players} - {game.max_players} players
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={game.skill_level || 'All Levels'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
