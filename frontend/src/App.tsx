import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Snackbar, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { MapView } from './components/Map';
import { CreateGameForm } from './components/CreateGameForm';
import { WelcomeBanner } from './components/WelcomeBanner';
import { GameList, GameFilters } from './components/GameList';
import { getGames, createGame } from './api';
import { Game, CreateGameData, User, Location } from './types/index';
import { AuthDialog } from './components/AuthDialog';
import ResetPassword from './components/ResetPassword';
import { supabase } from './supabase';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { config } from './config';
import 'mapbox-gl/dist/mapbox-gl.css';

function CreateGameButton({ isLoggedIn, onClick }: { isLoggedIn: boolean; onClick: () => void }) {
  const location = useLocation();
  
  if (!isLoggedIn || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <Button
      variant="contained"
      onClick={onClick}
      startIcon={<AddIcon />}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        height: '48px',
        mx: 2,
        borderRadius: '24px',
        textTransform: 'none',
        fontSize: '1.1rem',
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: 'transparent',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue with transparency
        },
      }}
    >
      Create New Game
    </Button>
  );
}

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [centerLocation, setCenterLocation] = useState<Location | undefined>(undefined);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: 37.7749,
    longitude: -122.4194, // Default to San Francisco
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [filters, setFilters] = useState<GameFilters>({
    search: '',
    skillLevel: 'all',
    minPlayers: 0,
    maxPlayers: 100,
    distance: 5, // Default 5km radius
    location: {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      address: `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
    }
  });

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: isDarkMode ? '#121212' : '#ffffff',
            paper: isDarkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [isDarkMode]
  );

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchGames = async () => {
      console.log('Initiating games fetch...');
      try {
        const fetchedGames = await getGames();
        if (!mounted) {
          console.log('Component unmounted, skipping state update');
          return;
        }
        console.log('Setting games state:', {
          count: fetchedGames.length,
          firstGame: fetchedGames[0],
        });
        setGames(fetchedGames);
        setFilteredGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    // Set up auth and fetch games
    const initialize = async () => {
      console.log('Starting initialization...');
      
      // Wait for Supabase to initialize
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session initialized:', { hasSession: !!session });
      
      if (!mounted) return;
      setIsLoggedIn(!!session);

      // Fetch games after Supabase is initialized
      await fetchGames();
      
      if (session?.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
          if (!mounted) return;

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData?.name || '',
          });
        } catch (error) {
          console.error('Error initializing session:', error);
          if (!mounted) return;
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: null,
          });
        }
      }
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', { event, hasSession: !!session });
        
        // Check for password update first
        const passwordJustUpdated = localStorage.getItem('passwordJustUpdated');
        console.log('Password update flag:', passwordJustUpdated);
        
        if (event === 'USER_UPDATED' && passwordJustUpdated) {
          console.log('Password update detected, redirecting...');
          localStorage.removeItem('passwordJustUpdated');
          window.location.href = '/';
          return; // Exit early after redirect
        }

        if (!mounted) return;
        
        setIsLoggedIn(!!session);
        if (session?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
              return;
            }

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profileData?.name || '',
            });

          } catch (error) {
            console.error('Error in profile fetch:', error);
          }
        } else {
          setUser(null);
        }

        // Only fetch games on actual auth state changes
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth event triggered games refresh:', event);
          fetchGames();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    const mounted = true;
    const maxRetries = 3;
    let retryCount = 0;

    const tryGetLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (mounted) {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
            });
            
            // Reverse geocode to get address
            try {
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${config.mapboxToken}`
              );
              
              if (!response.ok) {
                throw new Error('Failed to fetch address');
              }

              const data = await response.json();
              const address = data.features[0]?.place_name;

              if (address) {
                setFilters((prev: GameFilters) => ({
                  ...prev,
                  location: {
                    lat: latitude,
                    lng: longitude,
                    address
                  }
                }));
              }
            } catch (error) {
              console.error('Error getting address:', error);
            }

            setLocationError('');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (error.code === error.TIMEOUT && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying location request (${retryCount}/${maxRetries})...`);
            tryGetLocation(); // Retry
          } else if (mounted) {
            setLocationError('Unable to get your location. Please enable location services.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased to 10 seconds
          maximumAge: 0
        }
      );
    };

    tryGetLocation();
  }, [setCurrentLocation, setLocationError, setFilters]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    let mounted = true;
    let geoWatchId: number | undefined;
    
    // Get user's location
    if (navigator.geolocation) {
      geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          if (mounted) {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError('');
          }
        },
        (error) => {
          if (mounted) {
            console.error('Error getting location:', error);
            setLocationError('Unable to get your location. Please enable location services.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }

    return () => {
      mounted = false;
      if (geoWatchId !== undefined) {
        navigator.geolocation.clearWatch(geoWatchId);
      }
    };
  }, []);

  useEffect(() => {
    // Check for showLogin parameter in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('showLogin')) {
      setIsAuthDialogOpen(true);
      // Remove the parameter from URL
      params.delete('showLogin');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleCreateGame = async (gameData: CreateGameData): Promise<void> => {
    try {
      console.log('Creating game with data:', gameData);
      const newGame = await createGame(gameData);
      console.log('Created new game:', newGame);
      
      setGames(prevGames => {
        const updatedGames = [...prevGames, newGame];
        console.log('Updated games list:', updatedGames);
        return updatedGames;
      });
      
      setFilteredGames(prevGames => {
        const updatedFiltered = [...prevGames, newGame];
        console.log('Updated filtered games:', updatedFiltered);
        return updatedFiltered;
      });
      
      setCenterLocation({
        latitude: newGame.latitude,
        longitude: newGame.longitude,
      });
      
      setSelectedGame(newGame);
      setIsCreateGameOpen(false);

      setTimeout(() => {
        setCenterLocation(undefined);
      }, 1000);
    } catch (error) {
      console.error('Error creating game:', error);
      setLocationError('Failed to create game. Please try again.');
    }
  };

  const handleFilterChange = (key: keyof GameFilters, value: string | number | { lat: number; lng: number; address: string }) => {
    setFilters((prevFilters: GameFilters) => ({
      ...prevFilters,
      [key]: value
    }));
    // Update map center when location changes
    if (key === 'location') {
      setCenterLocation({
        latitude: (value as { lat: number; lng: number; address: string }).lat,
        longitude: (value as { lat: number; lng: number; address: string }).lng
      });
    }
  };

  const handleGameSelect = (game: Game | null) => {
    setSelectedGame(game);
    if (game) {
      setCenterLocation({
        latitude: game.latitude,
        longitude: game.longitude,
      });
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    // Update filters with new location
    handleFilterChange('location', location);

    // Update map center
    setCenterLocation({
      latitude: location.lat,
      longitude: location.lng
    });
  };

  const handleLogin = () => {
    setIsAuthDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(false);
      localStorage.clear();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setIsLoggedIn(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <AppBar 
            position="fixed" 
            elevation={0} 
            sx={{ 
              background: isLoggedIn
                ? theme.palette.background.paper
                : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 100%)',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              '& .MuiToolbar-root': {
                transition: 'all 0.3s ease',
              }
            }}
          >
            <Toolbar>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1, 
                  color: isLoggedIn ? theme.palette.text.primary : '#fff'
                }}
              >
                Why Not Play Outside?
              </Typography>
              <IconButton
                onClick={toggleDarkMode}
                sx={{ 
                  mr: 2, 
                  color: isLoggedIn ? theme.palette.text.primary : '#fff'
                }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              {isLoggedIn ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: theme.palette.text.primary
                    }}
                  >
                    {user?.name}
                  </Typography>
                  <Button 
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{ 
                      color: theme.palette.text.primary,
                      borderColor: '#e0e0e0', // Lighter gray for a softer border
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              ) : (
                <Button 
                  variant="outlined"
                  onClick={handleLogin}
                  sx={{ 
                    color: isLoggedIn ? theme.palette.text.primary : '#fff',
                    borderColor: '#e0e0e0', // Lighter gray for a softer border
                  }}
                >
                  Login
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <WelcomeBanner isLoggedIn={isLoggedIn} />
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' },
                      height: { 
                        xs: 'auto',
                        md: 'calc(100vh - 64px)'
                      },
                      mt: isLoggedIn ? '64px' : 0,
                      bgcolor: 'background.default',
                      gap: { xs: 0, md: 0 }, // Remove gap between sections
                    }}
                  >
                    {/* Mobile View */}
                    <Box
                      sx={{
                        display: { xs: 'flex', md: 'none' },
                        flexDirection: 'column',
                        gap: 2,
                        p: 0, // Remove padding
                        width: '100%',
                      }}
                    >
                      <GameList
                        games={games}
                        onGameSelect={handleGameSelect}
                        onLocationSelect={handleLocationSelect}
                        onFilterChange={handleFilterChange}
                        currentLocation={currentLocation}
                        selectedGame={selectedGame}
                        showOnlyFilters={true}
                        filters={filters}
                      />
                      <GameList
                        games={games}
                        onGameSelect={handleGameSelect}
                        onLocationSelect={handleLocationSelect}
                        onFilterChange={handleFilterChange}
                        currentLocation={currentLocation}
                        selectedGame={selectedGame}
                        showOnlyList={true}
                        filters={filters}
                      />
                      <Box sx={{ height: '400px', width: '100%' }}>
                        <MapView
                          games={games}
                          currentLocation={currentLocation}
                          selectedGame={selectedGame}
                          onGameSelect={handleGameSelect}
                          centerLocation={centerLocation}
                        />
                      </Box>
                    </Box>

                    {/* Desktop View */}
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column',
                        width: '400px',
                        p: 0, // Remove padding
                        borderRight: 1,
                        borderColor: 'divider',
                        height: '100%',
                        overflow: 'auto',
                      }}
                    >
                      {/* Left sidebar with filters */}
                      <GameList
                        games={games}
                        onGameSelect={handleGameSelect}
                        onLocationSelect={handleLocationSelect}
                        onFilterChange={handleFilterChange}
                        currentLocation={currentLocation}
                        selectedGame={selectedGame}
                        showOnlyFilters={true}
                        filters={filters}
                      />
                    </Box>

                    {/* Center section with game list */}
                    <Box
                      sx={{
                        width: { xs: '100%', md: '400px' },
                        borderRight: { xs: 0, md: '1px solid #e0e0e0' }, // Subtle border style
                        bgcolor: 'background.paper',
                        boxShadow: { 
                          xs: '0 1px 3px rgba(0,0,0,0.1)',
                          md: '1px 0 3px rgba(0,0,0,0.1)'
                        },
                        overflowY: 'auto',
                        height: { xs: 'auto', md: '100%' },
                        zIndex: 1,
                      }}
                    >
                      <GameList
                        games={filteredGames}
                        onGameSelect={handleGameSelect}
                        onLocationSelect={handleLocationSelect}
                        onFilterChange={handleFilterChange}
                        currentLocation={currentLocation}
                        selectedGame={selectedGame}
                        showOnlyList={true}
                        filters={filters}
                      />
                    </Box>

                    {/* Right section with map */}
                    <Box 
                      sx={{ 
                        flexGrow: 1,
                        height: { 
                          xs: '400px',
                          md: '100%'
                        },
                        bgcolor: 'background.paper',
                        boxShadow: { 
                          xs: '0 1px 3px rgba(0,0,0,0.1)',
                          md: 'none'
                        },
                      }}
                    >
                      <MapView
                        games={filteredGames}
                        currentLocation={currentLocation}
                        selectedGame={selectedGame}
                        onGameSelect={handleGameSelect}
                        centerLocation={centerLocation}
                      />
                    </Box>
                  </Box>
                </>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>

          <CreateGameButton 
            isLoggedIn={isLoggedIn} 
            onClick={() => setIsCreateGameOpen(true)} 
          />

          <CreateGameForm
            open={isCreateGameOpen}
            onClose={() => setIsCreateGameOpen(false)}
            onSubmit={handleCreateGame}
            currentLocation={currentLocation}
          />

          <AuthDialog
            open={isAuthDialogOpen}
            onClose={() => setIsAuthDialogOpen(false)}
            onSuccess={handleAuthSuccess}
          />

          <Snackbar
            open={!!locationError}
            message={locationError}
            autoHideDuration={6000}
            onClose={() => setLocationError('')}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
