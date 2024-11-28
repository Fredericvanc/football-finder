import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, MapRef } from 'react-map-gl';
import { Box, Typography, IconButton, Button, useTheme, Stack } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatRelative } from 'date-fns';
import { Game } from '../types';
import { config } from '../config';
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

// Add debug logging
console.log('Environment:', {
  env: config.env,
  mapboxToken: config.mapboxToken ? 'set' : 'missing',
});

if (!config.mapboxToken) {
  throw new Error('Missing Mapbox token in configuration');
}

// MapView component handles the display of games on an interactive map
// Uses Mapbox for rendering and includes navigation controls
export const MapView: React.FC<MapViewProps> = ({
  games,
  currentLocation,
  selectedGame,
  onGameSelect,
  centerLocation,
}) => {
  const theme = useTheme();
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    zoom: 13,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  // Track map loading state
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Memoize the map style
  const mapStyle = useMemo(() => 
    theme.palette.mode === 'dark' 
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12"
  , [theme.palette.mode]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    console.log('Map loaded with style:', mapStyle);
    setIsMapLoaded(true);
  }, [mapStyle]);

  // Handle map removal
  const handleMapRemove = useCallback(() => {
    console.log('Map removed');
    setIsMapLoaded(false);
  }, []);

  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    }));
  }, [currentLocation]);

  useEffect(() => {
    if (centerLocation) {
      setViewState(prev => ({
        ...prev,
        latitude: centerLocation.latitude,
        longitude: centerLocation.longitude,
        zoom: 15,
      }));
    }
  }, [centerLocation]);

  const handleMove = useCallback((evt: { viewState: any }) => {
    setViewState(prev => ({
      ...prev,
      ...evt.viewState,
    }));
  }, []);

  useEffect(() => {
    if (mapRef.current && isMapLoaded) {
      // Remove the old map instance
      handleMapRemove();
      // Force a re-render of the map with the new style
      const map = mapRef.current.getMap();
      map.setStyle(mapStyle);
      // Re-initialize the map
      handleMapLoad();
    }
  }, [theme.palette.mode, mapStyle, handleMapLoad, handleMapRemove, isMapLoaded]);

  const handleGPSClick = () => {
    setViewState(prev => ({
      ...prev,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      zoom: 13,
    }));
  };

  const renderMap = () => (
    <Map
      ref={mapRef}
      reuseMaps
      mapboxAccessToken={config.mapboxToken}
      mapStyle={mapStyle}
      {...viewState}
      onMove={handleMove}
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: isMapLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onClick={() => onGameSelect(null)}
      onLoad={handleMapLoad}
      onRemove={handleMapRemove}
      maxZoom={20}
      minZoom={3}
      attributionControl={false}
      renderWorldCopies={false}
    >
      <NavigationControl position="top-right" />
      
      {/* Current location marker */}
      <Marker
        longitude={currentLocation.longitude}
        latitude={currentLocation.latitude}
        anchor="bottom"
      >
        <MyLocationIcon color="primary" />
      </Marker>

      {/* Game markers */}
      {games.map((game) => (
        <Marker
          key={game.id}
          longitude={game.longitude}
          latitude={game.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onGameSelect(game);
          }}
        >
          <LocationOnIcon
            sx={{
              color: selectedGame?.id === game.id ? 'primary.main' : 'text.primary',
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          />
        </Marker>
      ))}

      {/* Game popup */}
      {selectedGame && (
        <Popup
          longitude={selectedGame.longitude}
          latitude={selectedGame.latitude}
          anchor="bottom"
          onClose={() => onGameSelect(null)}
          closeButton={false}
          offset={[0, -32] as [number, number]}
          className="game-popup"
        >
          <Stack spacing={1.5} sx={{ minWidth: 200, p: 1 }}>
            <Typography 
              variant="h6" 
              color="text.primary"
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500
              }}
            >
              {selectedGame.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.9rem' }}
              >
                {selectedGame.location_name || selectedGame.location}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.9rem' }}
              >
                {formatRelative(new Date(selectedGame.date), new Date())}
              </Typography>
            </Box>

            {selectedGame.whatsapp_link && (
              <Button
                variant="text"
                color="success"
                startIcon={<WhatsAppIcon />}
                fullWidth
                href={selectedGame.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  mt: 0.5,
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Join WhatsApp Group
              </Button>
            )}
          </Stack>
        </Popup>
      )}
    </Map>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>
        {`
          .mapboxgl-popup-content {
            background-color: ${theme.palette.mode === 'dark' ? '#242424' : '#fff'} !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: ${theme.palette.mode === 'dark' ? '#242424' : '#fff'} !important;
          }
        `}
      </style>
      {config.mapboxToken && renderMap()}
      
      {/* GPS button */}
      <IconButton
        onClick={handleGPSClick}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: 'background.paper',
          },
        }}
      >
        <MyLocationIcon />
      </IconButton>
    </Box>
  );
};
