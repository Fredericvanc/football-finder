import React, { useCallback } from 'react';
import { Box, FormControl, InputLabel, useTheme, IconButton } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './LocationSearch.css';
import { config } from '../config';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  defaultLocation?: { lat: number; lng: number; address: string };
  label?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, defaultLocation, label }) => {
  const geocoderContainerRef = React.useRef<HTMLDivElement>(null);
  const geocoderRef = React.useRef<MapboxGeocoder | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{lat: number; lng: number; address: string} | null>(null);
  const theme = useTheme();
  const id = React.useId();

  React.useEffect(() => {
    if (!geocoderContainerRef.current || !config.mapboxToken) return;

    const container = geocoderContainerRef.current;
    // Set theme attribute for dark mode styling
    container.setAttribute('data-theme', theme.palette.mode);

    const geocoder = new MapboxGeocoder({
      accessToken: config.mapboxToken,
      types: 'address,place,locality',
      placeholder: 'Search location...',
      marker: false,
      language: 'en',
    });

    geocoderRef.current = geocoder;
    geocoder.addTo(container);

    // Set initial value if defaultLocation exists
    const input = container.querySelector('input') as HTMLInputElement;
    if (input && defaultLocation?.address) {
      input.value = defaultLocation.address;
      // Also set the geocoder's internal state
      geocoder.setInput(defaultLocation.address);
    }

    // Handle location selection
    geocoder.on('result', (e) => {
      const [lng, lat] = e.result.center;
      const address = e.result.place_name;
      onLocationSelect({ lat, lng, address });
    });

    // Handle focus and blur events
    if (input) {
      input.addEventListener('focus', () => setIsFocused(true));
      input.addEventListener('blur', () => setIsFocused(false));
    }

    return () => {
      geocoder.onRemove();
      geocoderRef.current = null;
    };
  }, [onLocationSelect, defaultLocation, theme.palette.mode]);

  // Update input value when defaultLocation changes
  React.useEffect(() => {
    const container = geocoderContainerRef.current;
    const geocoder = geocoderRef.current;
    if (!container || !geocoder) return;

    const input = container.querySelector('input') as HTMLInputElement;
    if (input && defaultLocation?.address) {
      input.value = defaultLocation.address;
      geocoder.setInput(defaultLocation.address);
    }
  }, [defaultLocation]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    // If we already have the location, use it
    if (currentLocation) {
      const input = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder--input') as HTMLInputElement;
      if (input) {
        input.value = currentLocation.address;
      }
      if (geocoderRef.current) {
        geocoderRef.current.setInput(currentLocation.address);
      }
      onLocationSelect(currentLocation);
      return;
    }

    // Otherwise fetch it (this is for the initial load)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            console.error('Geolocation error:', err.message, err.code);
            reject(err);
          },
          { 
            enableHighAccuracy: false,  
            timeout: 30000,            
            maximumAge: 300000         
          }
        );
      });

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${config.mapboxToken}`
      );
      const data = await response.json();
      const address = data.features[0].place_name;

      // Update the input field
      const input = geocoderContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder--input') as HTMLInputElement;
      if (input) {
        input.value = address;
      }

      // Update geocoder state
      if (geocoderRef.current) {
        geocoderRef.current.setInput(address);
      }

      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address
      };
      setCurrentLocation(locationData);  // Store the location
      onLocationSelect(locationData);
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
    }
  }, [currentLocation, onLocationSelect]);

  React.useEffect(() => {
    // Get current location on mount if no default location is provided
    if (!defaultLocation) {
      getCurrentLocation();
    }
  }, [defaultLocation, getCurrentLocation]);

  return (
    <FormControl 
      fullWidth 
      variant="outlined"
      sx={{ position: 'relative' }}
    >
      {label && (
        <InputLabel 
          shrink 
          htmlFor={id}
          sx={{
            background: theme.palette.background.paper,
            padding: '0 8px',
            marginLeft: '-4px',
            zIndex: 1500,
            position: 'absolute',
            pointerEvents: 'none',
            color: isFocused 
              ? theme.palette.primary.main
              : theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.6)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            }
          }}
        >
          {label}
        </InputLabel>
      )}
      <Box ref={geocoderContainerRef} />
      <IconButton 
        className="location-button"
        onClick={getCurrentLocation}
        size="small"
      >
        <MyLocationIcon />
      </IconButton>
    </FormControl>
  );
};
