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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import { Game } from '../types';
import { format } from 'date-fns';

interface GameListProps {
  games: Game[];
  selectedGame: Game | null;
  onGameSelect: (game: Game) => void;
  onFilterChange: (filters: GameFilters) => void;
}

export interface GameFilters {
  search: string;
  skillLevel: string;
  minPlayers: number;
  maxPlayers: number;
}

export const GameList: React.FC<GameListProps> = ({
  games,
  selectedGame,
  onGameSelect,
  onFilterChange,
}) => {
  const [filters, setFilters] = React.useState<GameFilters>({
    search: '',
    skillLevel: 'all',
    minPlayers: 0,
    maxPlayers: 100,
  });

  const handleFilterChange = (key: keyof GameFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Stack spacing={2}>
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
              label="Skill Level"
              onChange={(e) => handleFilterChange('skillLevel', e.target.value)}
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

      {/* Game List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {games.map((game) => (
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
                <Typography variant="h6" gutterBottom>
                  {game.title || 'Football Game'}
                </Typography>
                
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

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={game.skill_level || 'All Levels'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {game.is_recurring && (
                      <Chip
                        label="Recurring"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
