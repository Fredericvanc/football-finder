import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Button,
  IconButton,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import RepeatIcon from '@mui/icons-material/Repeat';
import DirectionsIcon from '@mui/icons-material/Directions';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Game } from '../types';
import { GameFiltersComponent } from './GameFilters';
import { format } from 'date-fns';
import { calculateDistance } from '../utils/distance';

import { GameFilters } from '../types';

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
  currentUser: { id: string } | null;
  onEditGame?: (game: Game) => void;
  onDeleteGame?: (game: Game) => void;
}

// Re-export GameFilters type
export type { GameFilters };

const getDirectionsUrl = (latitude: number, longitude: number, location: string) => {
  // Use a universal link format for directions
  return `https://maps.google.com/?q=${latitude},${longitude}`;
};

export const GameList: React.FC<GameListProps> = ({
  games,
  onGameSelect,
  onLocationSelect,
  onFilterChange,
  currentLocation,
  selectedGame,
  showOnlyFilters = false,
  showOnlyList = false,
  filters,
  currentUser,
  onEditGame,
  onDeleteGame,
}) => {
  const filteredGames = React.useMemo(() => {
    // First filter the games
    const filtered = games.filter(game => {
      // Filter out past games
      const gameDate = new Date(game.date);
      if (gameDate < new Date()) {
        return false;
      }

      // Filter by search term
      if (filters.search && !game.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filter by skill level
      if (filters.skillLevel !== 'all' && game.skill_level !== filters.skillLevel) {
        return false;
      }

      // Filter by maximum players
      if (game.max_players > filters.maxPlayers) {
        return false;
      }

      // Filter by distance
      if (filters.location && filters.distance) {
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
      height: { xs: 'auto', md: '100%' }, 
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      position: 'relative',
      zIndex: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      overflow: { xs: 'visible', md: 'hidden' }, 
      ...(showOnlyList && {
        maxHeight: { md: '100%' }, 
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
          overflow: { xs: 'visible', md: 'auto' }, 
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
                    mb: 2, 
                    cursor: 'pointer',
                    border: selectedGame?.id === game.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => onGameSelect(game)}
                >
                  <CardContent>
                    <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {format(new Date(game.date), "EEE d | HH:mm")}
                      {game.is_recurring && (
                        <RepeatIcon fontSize="small" color="action" />
                      )}
                    </Typography>

                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {game.location_name && (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {game.location_name}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {game.location} ({calculateDistance(
                              currentLocation.latitude,
                              currentLocation.longitude,
                              game.latitude,
                              game.longitude
                            ).toFixed(1)} km)
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {game.max_players} players max
                          {game.skill_level && ` • ${game.skill_level}`}
                        </Typography>
                      </Box>

                      {currentUser && game.creator_id === currentUser.id && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1, 
                          width: '100%'
                        }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditGame?.(game);
                            }}
                            color="primary"
                            fullWidth
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteGame?.(game);
                            }}
                            color="error"
                            fullWidth
                          >
                            Delete
                          </Button>
                        </Box>
                      )}

                      {selectedGame?.id === game.id && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: 1, 
                          mt: 3,
                          width: '100%'
                        }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DirectionsIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getDirectionsUrl(game.latitude, game.longitude, game.location), '_blank');
                            }}
                          >
                            Directions
                          </Button>
                          {game.whatsapp_link && (
                            <Button
                              variant="outlined"  
                              size="small"
                              startIcon={<WhatsAppIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (game.whatsapp_link) {
                                  window.open(game.whatsapp_link, '_blank');
                                }
                              }}
                            >
                              Register
                            </Button>
                          )}
                        </Box>
                      )}
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
