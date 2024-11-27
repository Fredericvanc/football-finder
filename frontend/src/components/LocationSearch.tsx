import React from 'react';
import { Box } from '@mui/material';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './LocationSearch.css';
import { config } from '../config';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  defaultLocation?: { lat: number; lng: number; address: string };
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, defaultLocation }) => {
  const geocoderContainerRef = React.useRef<HTMLDivElement>(null);
  const [address, setAddress] = React.useState(defaultLocation?.address || '');

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
    <Box sx={{ width: '100%' }}>
      <div ref={geocoderContainerRef} />
    </Box>
  );
};
