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
import { LocationSearch } from './LocationSearch';

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
    title: 'Football Game',
    organization: '',
    description: '',
    location: '',
    date: new Date(),
    whatsapp_link: '',
    max_players: '',
    skill_level: '',
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    is_recurring: false,
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

  const handleMapClick = async (event: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = event.lngLat;
    
    try {
      // Reverse geocode the clicked coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        
        // Update form data with new location
        setFormData({
          ...formData,
          location: address,
          latitude: lat,
          longitude: lng,
        });

        // Update map view while keeping the current zoom level
        setViewState({
          ...viewState,
          latitude: lat,
          longitude: lng,
        });

        // Update the LocationSearch component's input
        const geocoder = document.querySelector('.mapboxgl-ctrl-geocoder--input') as HTMLInputElement;
        if (geocoder) {
          geocoder.value = address;
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
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

    const gameData: CreateGameData = {
      title: formData.title,
      description: formData.description || null,
      location: formData.location,
      location_name: formData.organization || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      date: formData.date.toISOString(),
      max_players: parseInt(formData.max_players) || 10,
      skill_level: formData.skill_level || null,
      whatsapp_link: formData.whatsapp_link || null,
      is_recurring: formData.is_recurring,
    };

    console.log('Submitting game data:', gameData);
    
    try {
      await onSubmit(gameData);
      onClose();
    } catch (error) {
      console.error('Error submitting game:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      zoom: 14
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <LocationSearch
              label="Location"
              onLocationSelect={(location) => {
                setFormData({
                  ...formData,
                  location: location.address,
                  latitude: location.lat,
                  longitude: location.lng,
                });
                setViewState({
                  ...viewState,
                  latitude: location.lat,
                  longitude: location.lng,
                  zoom: 14
                });
              }}
              defaultLocation={
                formData.location ? {
                  lat: formData.latitude,
                  lng: formData.longitude,
                  address: formData.location
                } : undefined
              }
            />

            <Box sx={{ height: 300 }}>
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v9"
                mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                onClick={handleMapClick}
              >
                <Marker
                  longitude={formData.longitude}
                  latitude={formData.latitude}
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
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MyLocationIcon />}
                  onClick={handleUseCurrentLocation}
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                >
                  Use My Location
                </Button>
              </Map>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <DateTimePicker
                label="Date & Time"
                value={formData.date}
                onChange={(newValue) => setFormData({ ...formData, date: newValue || new Date() })}
                sx={{ flex: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                }
                label="Recurring Weekly"
              />
            </Box>

            <TextField
              label="Maximum Players"
              type="number"
              value={formData.max_players}
              onChange={(e) => setFormData({ ...formData, max_players: e.target.value })}
              inputProps={{ min: 2, max: 100 }}
            />

            <TextField
              select
              label="Skill Level"
              value={formData.skill_level}
              onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
              <MenuItem value="all">All Levels</MenuItem>
            </TextField>

            <TextField
              label="Organization Name (optional)"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g., Sports Club, School, Company"
            />

            <TextField
              label="WhatsApp Group Link (optional)"
              value={formData.whatsapp_link}
              onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
              placeholder="https://chat.whatsapp.com/..."
            />

            <TextField
              label="Description (optional)"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional information about the game..."
            />
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
