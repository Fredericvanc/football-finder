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
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import RepeatIcon from '@mui/icons-material/Repeat';
import { Game } from '../types';
import { format, isPast } from 'date-fns';
import { calculateDistance } from '../utils/distance';
import { LocationSearch } from './LocationSearch';

interface GameListProps {
  games: Game[];
  selectedGame: Game | null;
  onGameSelect: (game: Game) => void;
  onFilterChange: (filters: GameFilters) => void;
  showOnlyFilters?: boolean;
  showOnlyList?: boolean;
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
  selectedGame,
  onGameSelect,
  onFilterChange,
  showOnlyFilters = false,
  showOnlyList = false,
}) => {
  const [filters, setFilters] = React.useState<GameFilters>({
    search: '',
    skillLevel: 'all',
    minPlayers: 0,
    maxPlayers: 100,
    distance: 5, // Default 5km
    location: {
      lat: 0,
      lng: 0,
      address: ''
    }
  });

  const filteredGames = React.useMemo(() => {
    return games.filter(game => {
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

      // Filter by distance
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
  }, [games, filters]);

  // Get device location on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location'
          };
          handleFilterChange('location', newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleFilterChange = (key: keyof GameFilters, value: string | number | { lat: number; lng: number; address: string }) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      overflow: 'hidden',
      ...(showOnlyList && {
        maxHeight: { xs: '500px', md: '100%' },
      })
    }}>
      {/* Filters */}
      {!showOnlyList && (
        <Box sx={{ 
          borderBottom: showOnlyFilters ? 0 : 1, 
          borderColor: 'divider',
          pt: 2, // Add padding at the top
          pb: 2,
          px: 2,
        }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Stack spacing={2}>
            <LocationSearch
              onLocationSelect={(location) => handleFilterChange('location', location)}
              defaultLocation={filters.location.lat !== 0 ? filters.location : undefined}
            />
            
            <TextField
              fullWidth
              type="number"
              label="Distance (km)"
              value={filters.distance}
              onChange={(e) => handleFilterChange('distance', Math.max(0, parseInt(e.target.value) || 0))}
              InputProps={{
                inputProps: { min: 0 },
                endAdornment: <InputAdornment position="end">km</InputAdornment>,
              }}
            />
            
            <TextField
              fullWidth
              placeholder="Search games..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Skill Level</InputLabel>
              <Select
                value={filters.skillLevel}
                onChange={(e) => handleFilterChange('skillLevel', e.target.value)}
                label="Skill Level"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                type="number"
                label="Min Players"
                value={filters.minPlayers}
                onChange={(e) => handleFilterChange('minPlayers', parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                type="number"
                label="Max Players"
                value={filters.maxPlayers}
                onChange={(e) => handleFilterChange('maxPlayers', parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </Stack>
        </Box>
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
            {filteredGames.map((game) => {
              const isGamePast = isPast(new Date(game.date));
              
              return (
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
                          {game.location_name || 'Location Name'}
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
                          Up to {game.max_players} players
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
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
