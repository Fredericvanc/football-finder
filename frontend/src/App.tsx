import React, { useState, useEffect, useMemo } from 'react';
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
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [centerLocation, setCenterLocation] = useState<Location | undefined>(undefined);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: 37.7749,
    longitude: -122.4194, // Default to San Francisco
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
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
            email: session.user.email!,
            name: profileData?.name || null,
          });
        } catch (error) {
          console.error('Error initializing session:', error);
          if (!mounted) return;
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: null,
          });
        }
      }
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state changed:', { event: _event, hasSession: !!session });
        if (!mounted) return;
        
        setIsLoggedIn(!!session);
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
              email: session.user.email!,
              name: profileData?.name || null,
            });
          } catch (error) {
            console.error('Error handling auth change:', error);
            if (!mounted) return;
            
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: null,
            });
          }
        } else {
          setUser(null);
        }

        // Only fetch games on actual auth state changes
        if (_event !== 'INITIAL_SESSION') {
          console.log('Auth event triggered games refresh:', _event);
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

  const handleFilterChange = (filters: GameFilters) => {
    const filtered = games.filter(game => {
      // Search text
      const searchMatch = !filters.search || 
        game.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (game.description?.toLowerCase().includes(filters.search.toLowerCase()) ?? false) ||
        game.location.toLowerCase().includes(filters.search.toLowerCase());

      // Skill level
      const skillMatch = !filters.skillLevel || filters.skillLevel === 'all' || 
        game.skill_level === filters.skillLevel;

      return searchMatch && skillMatch;
    });

    setFilteredGames(filtered);
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
                      borderColor: theme.palette.text.primary,
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
                    borderColor: isLoggedIn ? theme.palette.text.primary : '#fff',
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
                  <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 3,
                    pt: isLoggedIn ? 10 : 0,
                    mb: 8,
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      gap: 3,
                      flexDirection: { xs: 'column', md: 'row' },
                      minHeight: '500px',
                    }}>
                      <Box sx={{ 
                        flex: 1,
                        minWidth: { xs: '100%', md: '400px' },
                        maxWidth: { md: '400px' },
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <GameList
                          games={filteredGames}
                          selectedGame={selectedGame}
                          onGameSelect={handleGameSelect}
                          onFilterChange={handleFilterChange}
                        />
                      </Box>

                      <Box sx={{ 
                        flex: 2,
                        height: { xs: '400px', md: '600px' },
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}>
                        <MapView
                          games={filteredGames}
                          currentLocation={currentLocation}
                          selectedGame={selectedGame}
                          onGameSelect={handleGameSelect}
                          centerLocation={centerLocation}
                        />
                      </Box>
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
