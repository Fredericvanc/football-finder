import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import Map, { Marker } from 'react-map-gl';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Game, Location, CreateGameData } from '../types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CreateGameFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (gameData: CreateGameData) => Promise<void>;
  currentLocation: Location;
}

export const CreateGameForm: React.FC<CreateGameFormProps> = ({
  open,
  onClose,
  onSubmit,
  currentLocation,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date_time: new Date(),
    whatsapp_link: '',
    max_players: '',
    min_players: '',
    skill_level: '',
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    is_recurring: false,
    recurrence_frequency: 'weekly' as const,
  });

  const [viewState, setViewState] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    zoom: 15
  });

  // Update form location when current location changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
  }, [currentLocation]);

  const handleMapClick = (event: any) => {
    const { lat, lng } = event.lngLat;
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng,
    });
  };

  const handleResetLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      zoom: 15,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the game data with required fields
    const gameData: CreateGameData = {
      title: formData.title,
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      date: formData.date_time.toISOString(),
      date_time: formData.date_time.toISOString(),
      max_players: parseInt(formData.max_players) || 10,
      min_players: parseInt(formData.min_players) || 2,
      skill_level: formData.skill_level,
      is_recurring: formData.is_recurring,
      recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : undefined,
    };

    console.log('Submitting game data:', gameData);
    
    try {
      await onSubmit(gameData);
      onClose();
    } catch (error) {
      console.error('Error submitting game:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Friendly Football Match"
            />
            <TextField
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              placeholder="Add any additional details about the game..."
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Central Park Football Field"
            />
            
            <Box sx={{ position: 'relative' }}>
              <Typography variant="subtitle1" color="textSecondary">
                Click on the map to select game location
              </Typography>
              <IconButton
                onClick={handleResetLocation}
                sx={{
                  position: 'absolute',
                  right: 10,
                  top: 40,
                  zIndex: 1,
                  backgroundColor: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
                size="small"
              >
                <MyLocationIcon />
              </IconButton>
              <Box sx={{ height: 300, width: '100%', mb: 2 }}>
                <Map
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v11"
                  mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                  onClick={handleMapClick}
                >
                  <Marker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    draggable
                    onDragEnd={(event) => {
                      const { lat, lng } = event.lngLat;
                      setFormData({
                        ...formData,
                        latitude: lat,
                        longitude: lng,
                      });
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#1976d2',
                        border: '2px solid white',
                        cursor: 'grab',
                      }}
                    />
                  </Marker>
                </Map>
              </Box>
            </Box>
            
            <Typography variant="caption" color="textSecondary">
              Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DateTimePicker
                label="Date & Time"
                value={formData.date_time}
                onChange={(newValue) => setFormData({ ...formData, date_time: newValue || new Date() })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                }
                label="Repeat Weekly"
              />
            </Box>

            <TextField
              label="WhatsApp Group Link (optional)"
              value={formData.whatsapp_link}
              onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
              placeholder="https://chat.whatsapp.com/..."
            />
            <TextField
              label="Max Players"
              type="number"
              value={formData.max_players}
              onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
              placeholder="e.g., 10"
            />
            <TextField
              label="Min Players"
              type="number"
              value={formData.min_players}
              onChange={(e) => setFormData({ ...formData, min_players: e.target.value })}
              placeholder="e.g., 2"
            />
            <TextField
              select
              label="Skill Level (optional)"
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
            >
              <MenuItem value="">Any Skill Level</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Game
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
