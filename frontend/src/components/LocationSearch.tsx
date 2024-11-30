import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Box, FormControl, InputLabel, useTheme, IconButton, TextField, List, ListItem, Paper } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import axios from 'axios';
import './LocationSearch.css';
import { config } from '../config';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  defaultLocation?: { lat: number; lng: number; address: string };
  label?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, defaultLocation, label }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDefaultLocationSet, setIsDefaultLocationSet] = useState(false);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const selectedSuggestionRef = useRef<any>(null);
  
  const geocoderContainerRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{lat: number; lng: number; address: string} | null>(null);
  const theme = useTheme();
  const id = useId();
  const sessionToken = useId();

  // Set initial query if defaultLocation exists
  useEffect(() => {
    if (defaultLocation?.address && !selectedSuggestionRef.current) {
      setIsDefaultLocationSet(true);
      setQuery(defaultLocation.address);
    }
  }, [defaultLocation]);

  useEffect(() => {
    if (isLocationSelected && selectedSuggestionRef.current) {
      setQuery(selectedSuggestionRef.current.name);
      return;
    }
    if (query.length > 2 && !isDefaultLocationSet) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, isDefaultLocationSet, isLocationSelected]);

  // Perform reverse geocoding when coordinates are provided without an address
  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (defaultLocation?.lat && defaultLocation?.lng && !defaultLocation?.address) {
        try {
          setIsDefaultLocationSet(true);
          const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/forward`, {
            params: {
              q: `${defaultLocation.lat},${defaultLocation.lng}`,
              access_token: config.mapboxToken,
              session_token: sessionToken,
              language: 'pt',
              limit: 1,
            },
          });
          
          if (response.data.features && response.data.features.length > 0) {
            const location = response.data.features[0];
            if (!isLocationSelected) {
              setQuery(location.properties.full_address || location.properties.name);
            }
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
        }
      }
    };

    fetchLocationDetails();
  }, [defaultLocation, sessionToken, isLocationSelected]);

  const fetchSuggestions = async (searchText: string) => {
    try {
      const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/suggest`, {
        params: {
          q: searchText,
          access_token: config.mapboxToken,
          session_token: sessionToken,
          language: 'pt',
          limit: 10,
          proximity: defaultLocation ? `${defaultLocation.lng},${defaultLocation.lat}` : 'ip',
        },
      });
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    setIsLocationSelected(true);
    setSuggestions([]);
    selectedSuggestionRef.current = suggestion;
    setQuery(suggestion.name);
    
    try {
      const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}`, {
        params: {
          access_token: config.mapboxToken,
          session_token: sessionToken,
        },
      });
      const location = response.data.features[0];
      setSelectedLocation(location);
      
      onLocationSelect({
        lat: location.geometry.coordinates[1],
        lng: location.geometry.coordinates[0],
        address: suggestion.full_address || suggestion.address,
      });
    } catch (error) {
      console.error('Error fetching location details:', error);
      setIsLocationSelected(false);
      selectedSuggestionRef.current = null;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsDefaultLocationSet(false);
    setIsLocationSelected(false);
    selectedSuggestionRef.current = null;
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (currentLocation) {
      const input = geocoderContainerRef.current?.querySelector('input') as HTMLInputElement;
      if (input) {
        input.value = currentLocation.address;
      }
      onLocationSelect(currentLocation);
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${config.mapboxToken}`
      );
      const data = response.data;
      const address = data.features[0].place_name;

      const input = geocoderContainerRef.current?.querySelector('input') as HTMLInputElement;
      if (input) {
        input.value = address;
      }

      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address,
      };

      setCurrentLocation(locationData);
      onLocationSelect(locationData);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }, [currentLocation, onLocationSelect]);

  return (
    <Box sx={{ position: 'relative' }} ref={geocoderContainerRef}>
      <FormControl fullWidth>
        <TextField
          id={id}
          label={label || 'Search location'}
          value={query}
          onChange={handleInputChange}
          placeholder="Search location..."
          variant="outlined"
          fullWidth
        />
      </FormControl>
      {suggestions.length > 0 && (
        <Paper 
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            zIndex: 1500,
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <List>
            {suggestions.map((suggestion) => (
              <ListItem
                key={suggestion.mapbox_id}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {suggestion.name}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      <IconButton 
        className="location-button"
        onClick={getCurrentLocation}
        sx={{
          position: 'absolute',
          right: theme.spacing(1),
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <MyLocationIcon />
      </IconButton>
    </Box>
  );
};
