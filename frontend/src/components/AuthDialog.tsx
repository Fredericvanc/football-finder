import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { supabase } from '../supabase';
import { User } from '../types';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

type ViewState = 'login' | 'register' | 'reset-password';

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [view, setView] = useState<ViewState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user data returned');

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        onSuccess({
          id: data.user.id,
          email: data.user.email!,
          name: profileData.name,
        });
        handleClose();
      } else if (view === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) throw error;
        
        // Check if the user already exists
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please login instead.');
        }
        
        if (!data.user) throw new Error('No user data returned');

        // Wait for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the created profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('Failed to fetch profile. Please try again.');
        }

        onSuccess({
          id: data.user.id,
          email: data.user.email!,
          name: profileData.name,
        });
        handleClose();
      } else if (view === 'reset-password') {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setSuccess('Password reset instructions have been sent to your email.');
        setTimeout(() => {
          setView('login');
          setSuccess(null);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setSuccess(null);
    setView('login');
    onClose();
  };

  const getTitle = () => {
    switch (view) {
      case 'login':
        return 'Login';
      case 'register':
        return 'Register';
      case 'reset-password':
        return 'Reset Password';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {getTitle()}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            {view !== 'reset-password' && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
            )}
            {view === 'register' && (
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {view === 'reset-password' ? 'Send Reset Instructions' : view === 'login' ? 'Login' : 'Register'}
          </Button>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            width: '100%' 
          }}>
            {view === 'login' && (
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  setView('reset-password');
                }}
                sx={{ textDecoration: 'none' }}
              >
                Forgot Password?
              </Link>
            )}
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {view === 'login' ? "Don't have an account?" : view === 'register' ? 'Already have an account?' : 'Remember your password?'}
              <Button
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                sx={{ textTransform: 'none' }}
              >
                {view === 'login' ? 'Register' : 'Login'}
              </Button>
            </Typography>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};
