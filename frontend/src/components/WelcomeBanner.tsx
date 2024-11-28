import React from 'react';
import { Box, Typography, Container, List, ListItem, ListItemText } from '@mui/material';
import SportsIcon from '@mui/icons-material/Sports';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

interface WelcomeBannerProps {
  isLoggedIn: boolean;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ isLoggedIn }) => {
  if (isLoggedIn) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        mt: '-64px', // Offset for AppBar height
        pt: '64px',  // Add padding to account for the offset
        mb: 0, // Remove bottom margin
      }}
    >
      {/* Video Background */}
      <Box
        component="video"
        autoPlay
        muted
        loop
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          filter: 'brightness(0.4)',
        }}
      >
        <source src="/football-background.mp4" type="video/mp4" />
      </Box>

      {/* Content Overlay */}
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          py: 2,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 3,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          Find Your Game
        </Typography>

        <Typography
          variant="h5"
          sx={{
            mb: 4,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Join local football games or create your own match
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, md: 4 },
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <LocationOnIcon />
            <Typography>Find Games Nearby</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <GroupsIcon />
            <Typography>Meet New Players</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SportsSoccerIcon />
            <Typography>Play More Football</Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
