import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { Card, CardContent, Typography, IconButton, Box, Button, useTheme } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { formatRelative } from 'date-fns';
import { Game, Location } from '../types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  games: Game[];
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  selectedGame: Game | null;
  onGameSelect: (game: Game | null) => void;
  centerLocation?: {
    latitude: number;
    longitude: number;
  };
}

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Add debug logging
console.log('Environment variables:', {
  MAPBOX_TOKEN: MAPBOX_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  all_env: process.env
});

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is missing in environment variables');
}

export const MapView: React.FC<MapViewProps> = ({
  games,
  currentLocation,
  selectedGame,
  onGameSelect,
  centerLocation,
}) => {
  const theme = useTheme();
  const [viewState, setViewState] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    zoom: 13
  });

  useEffect(() => {
    if (MAPBOX_TOKEN) {
      console.log('Mapbox initialized with token:', MAPBOX_TOKEN.substring(0, 10) + '...');
    }
  }, []);

  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
  }, [currentLocation]);

  // Update view state when center location changes
  useEffect(() => {
    if (centerLocation) {
      setViewState(prev => ({
        ...prev,
        latitude: centerLocation.latitude,
        longitude: centerLocation.longitude,
        zoom: 15, // Zoom in closer when centering on a new game
      }));
    }
  }, [centerLocation]);

  const handleGPSClick = () => {
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      zoom: 13,
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {MAPBOX_TOKEN ? (
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={theme.palette.mode === 'dark' 
            ? "mapbox://styles/mapbox/navigation-night-v1"
            : "mapbox://styles/mapbox/navigation-day-v1"
          }
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          onClick={() => onGameSelect(null)}
        >
          <NavigationControl position="top-right" />
          
          {/* Current location marker */}
          <Marker
            longitude={currentLocation.longitude}
            latitude={currentLocation.latitude}
            anchor="bottom"
          >
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: '#4CAF50', 
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.3)'
            }} />
          </Marker>

          {/* Game markers */}
          {games.map((game) => (
            <Marker
              key={game.id}
              longitude={game.longitude}
              latitude={game.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onGameSelect(game);
              }}
            >
              <LocationOnIcon 
                sx={{ 
                  color: selectedGame?.id === game.id ? 'primary.main' : 'secondary.main',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }} 
              />
            </Marker>
          ))}

          {/* Selected game popup */}
          {selectedGame && (
            <Popup
              latitude={selectedGame.latitude}
              longitude={selectedGame.longitude}
              onClose={() => onGameSelect(null)}
              closeOnClick={false}
              closeButton={true}
              maxWidth="300px"
            >
              <Box sx={{ p: 1 }}>
                <Typography variant="h6" component="h3">
                  {selectedGame.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedGame.location_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatRelative(new Date(selectedGame.date), new Date())}
                </Typography>
                {selectedGame.is_recurring && (
                  <Typography variant="body2" color="primary">
                    Repeats {selectedGame.recurrence_frequency}
                  </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {/* Join game handler */}}
                    sx={{ flex: 1 }}
                  >
                    Join Game
                  </Button>
                  {selectedGame.whatsapp_link && (
                    <IconButton
                      color="primary"
                      component="a"
                      href={selectedGame.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      aria-label="Join WhatsApp group"
                    >
                      <WhatsAppIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Popup>
          )}
        </Map>
      ) : (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1
        }}>
          <Typography color="error">
            Map configuration error. Please check console.
          </Typography>
        </Box>
      )}

      {/* GPS Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1
        }}
      >
        <IconButton
          onClick={handleGPSClick}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            }
          }}
        >
          <MyLocationIcon />
        </IconButton>
      </Box>
    </div>
  );
};
