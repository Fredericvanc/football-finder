import React from 'react';
import {
  Box,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { GameFilters } from '../types';
import { LocationSearch } from './LocationSearch';

interface GameFiltersComponentProps {
  filters: GameFilters;
  onFilterChange: (
    key: keyof GameFilters,
    value: string | number | { lat: number; lng: number; address: string }
  ) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

export const GameFiltersComponent: React.FC<GameFiltersComponentProps> = ({
  filters,
  onFilterChange,
  onLocationSelect,
}) => {
  return (
    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
      <Stack spacing={2}>
        <LocationSearch
          label="Location"
          onLocationSelect={(location) => {
            onLocationSelect(location);
            onFilterChange('location', location);
          }}
          defaultLocation={filters.location}
        />

        <TextField
          fullWidth
          label="Distance (km)"
          type="number"
          value={filters.distance}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 5;
            onFilterChange('distance', Math.max(1, Math.min(50, value)));
          }}
          inputProps={{
            min: 1,
            max: 50,
            step: 1,
            style: { height: '23px' }
          }}
          sx={{
            '& .MuiInputBase-root': {
              height: '56px'
            }
          }}
          size="small"
        />

        <FormControl 
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              height: '56px'
            }
          }}
          size="small"
        >
          <InputLabel>Skill Level</InputLabel>
          <Select
            value={filters.skillLevel}
            label="Skill Level"
            onChange={(e) => onFilterChange('skillLevel', e.target.value)}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="advanced">Advanced</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <InputLabel>Number of Players</InputLabel>
          <Slider
            value={[filters.minPlayers, filters.maxPlayers]}
            onChange={(_, value) => {
              const [min, max] = value as number[];
              onFilterChange('minPlayers', min);
              onFilterChange('maxPlayers', max);
            }}
            min={2}
            max={22}
            valueLabelDisplay="auto"
            marks={[
              { value: 2, label: '2' },
              { value: 12, label: '12' },
              { value: 22, label: '22' },
            ]}
          />
        </Box>
      </Stack>
    </Box>
  );
};
