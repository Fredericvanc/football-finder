import React from 'react';
import { Box, FormControl, InputLabel } from '@mui/material';
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
  const [address, setAddress] = React.useState(defaultLocation?.address || '');
  const [isFocused, setIsFocused] = React.useState(false);
  const id = React.useId();

  React.useEffect(() => {
    if (!geocoderContainerRef.current || !config.mapboxToken) return;

    const geocoder = new MapboxGeocoder({
      accessToken: config.mapboxToken,
      types: 'address,place,locality',
      placeholder: 'Search location...',
      marker: false,
      language: 'en',
    });

    geocoder.addTo(geocoderContainerRef.current);

    // Handle location selection
    geocoder.on('result', (e) => {
      const [lng, lat] = e.result.center;
      const address = e.result.place_name;
      setAddress(address);
      onLocationSelect({ lat, lng, address });
    });

    // Set default location if provided
    if (defaultLocation) {
      setAddress(defaultLocation.address);
    }

    // Handle focus and blur events
    const input = geocoderContainerRef.current.querySelector('input');
    if (input) {
      input.addEventListener('focus', () => setIsFocused(true));
      input.addEventListener('blur', () => setIsFocused(false));
    }

    return () => {
      geocoder.onRemove();
    };
  }, [onLocationSelect, defaultLocation]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Reverse geocode the coordinates to get the address
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${config.mapboxToken}`)
            .then(response => response.json())
            .then(data => {
              const address = data.features[0].place_name;
              setAddress(address);
              onLocationSelect({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                address
              });
            });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  React.useEffect(() => {
    // Get current location on mount if no default location is provided
    if (!defaultLocation) {
      getCurrentLocation();
    }
  }, []);

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
            background: '#fff',
            padding: '0 8px',
            marginLeft: '-4px',
            zIndex: 1500,
            position: 'absolute',
            pointerEvents: 'none',
            color: isFocused ? '#2196f3' : 'rgba(0, 0, 0, 0.6)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            }
          }}
        >
          {label}
        </InputLabel>
      )}
      <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <div ref={geocoderContainerRef} id={id} className="geocoder-container" />
      </Box>
    </FormControl>
  );
};
