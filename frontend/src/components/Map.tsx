import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { Card, CardContent, Typography, IconButton, Box, Button } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN; // Replace with your Mapbox token

export const MapView: React.FC<MapViewProps> = ({
  games,
  currentLocation,
  selectedGame,
  onGameSelect,
  centerLocation,
}) => {
  const [viewState, setViewState] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    zoom: 13
  });

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

  if (!process.env.REACT_APP_MAPBOX_TOKEN) {
    return (
      <div style={{ padding: 20 }}>
        <Typography variant="h6" color="error">
          Error: Mapbox token not found. Please add your Mapbox token to the .env file.
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={() => onGameSelect(null)}
      >
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
            <div style={{ 
              width: '24px', 
              height: '24px', 
              background: selectedGame?.id === game.id ? '#ff0000' : '#1976d2',
              borderRadius: '50%',
              border: '3px solid white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} />
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
            className="game-popup"
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

      {/* GPS Button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={handleGPSClick}
          sx={{
            background: 'white',
            boxShadow: 2,
            '&:hover': {
              background: '#f5f5f5',
            },
          }}
        >
          <MyLocationIcon />
        </IconButton>
      </Box>
    </div>
  );
};
