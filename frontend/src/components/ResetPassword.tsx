import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Container, Box, TextField, Button, Alert } from '@mui/material';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('Starting password update process...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      // Set flag before password update
      localStorage.setItem('passwordJustUpdated', 'true');

      console.log('Attempting to update password...');
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Update error:', error);
        localStorage.removeItem('passwordJustUpdated');
        throw error;
      }

      // Add a small delay before showing success message
      await new Promise(resolve => setTimeout(resolve, 500));
      setError('Password updated successfully!');
      
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
      localStorage.removeItem('passwordJustUpdated');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
          <h2>Reset Password</h2>
          
          {error && (
            <Alert severity={error === 'Password updated successfully!' ? 'success' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            fullWidth
            margin="normal"
            required
          />
          
          <TextField
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            fullWidth
            margin="normal"
            required
          />
          
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            Update Password
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
