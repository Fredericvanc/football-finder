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
import { Game, CreateGameData, User, Location } from './types';
import { AuthDialog } from './components/AuthDialog';
import { supabase } from './supabase';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || null,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || null,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Please enable location services.');
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
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetchedGames = await getGames();
        console.log('Fetched games:', fetchedGames);
        setGames(fetchedGames);
        setFilteredGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, [currentLocation]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreateGame = async (gameData: CreateGameData) => {
    try {
      console.log('Creating game with data:', gameData);
      const newGame = await createGame(gameData);
      console.log('Created new game:', newGame);
      
      // Add the new game to both games and filtered games
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
      
      // Center the map on the new game
      setCenterLocation({
        latitude: newGame.latitude,
        longitude: newGame.longitude,
      });
      
      // Select the new game to show its popup
      setSelectedGame(newGame);
      
      setIsCreateGameOpen(false);

      // Reset center location after a delay
      setTimeout(() => {
        setCenterLocation(undefined);
      }, 1000);
    } catch (error) {
      console.error('Error creating game:', error);
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
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setIsLoggedIn(true);
    setIsAuthDialogOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <AppBar 
          position="fixed" 
          elevation={scrolled ? 1 : 0} 
          sx={{ 
            background: isLoggedIn || scrolled
              ? theme.palette.background.paper
              : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 100%)',
            transition: 'all 0.3s ease',
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
                color: isLoggedIn || scrolled ? theme.palette.text.primary : '#fff'
              }}
            >
              Football Finder
            </Typography>
            <IconButton
              onClick={toggleDarkMode}
              sx={{ 
                mr: 2, 
                color: isLoggedIn || scrolled ? theme.palette.text.primary : '#fff'
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
                  {user?.name || user?.email}
                </Typography>
                <Button 
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{ 
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: theme.palette.text.primary,
                      backgroundColor: theme.palette.action.hover,
                    }
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
                  color: isLoggedIn || scrolled ? theme.palette.text.primary : '#fff',
                  borderColor: isLoggedIn || scrolled ? theme.palette.text.primary : '#fff',
                  '&:hover': {
                    borderColor: isLoggedIn || scrolled ? theme.palette.text.primary : '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>

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

        {isLoggedIn && (
          <Button
            variant="contained"
            onClick={() => setIsCreateGameOpen(true)}
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
        )}

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
    </ThemeProvider>
  );
}

export default App;
