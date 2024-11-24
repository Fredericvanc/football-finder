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
} from '@mui/material';
import { supabase } from '../supabase';
import { User } from '../types';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
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
      } else {
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
        if (!data.user) throw new Error('No user data returned');

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email,
              name,
            },
          ]);

        if (profileError) throw profileError;

        onSuccess({
          id: data.user.id,
          email: data.user.email!,
          name: name || null,
        });
        handleClose();
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
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {isLogin ? 'Login' : 'Register'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
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
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            {!isLogin && (
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
            {isLogin ? 'Login' : 'Register'}
          </Button>
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
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Button
              onClick={() => setIsLogin(!isLogin)}
              sx={{ textTransform: 'none' }}
            >
              {isLogin ? 'Register' : 'Login'}
            </Button>
          </Typography>
        </DialogActions>
      </form>
    </Dialog>
  );
};
