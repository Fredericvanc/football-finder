import { useState } from 'react';
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
    setError(null);
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('Updating password...');
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      console.log('Password updated successfully, attempting to redirect...');
      
      // Try both immediate and delayed redirect
      navigate('/', { replace: true });
      
      // Backup: try redirect with timeout
      setTimeout(() => {
        console.log('Attempting delayed redirect...');
        window.location.href = '/';
      }, 1000);

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
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
            <Alert severity="error" sx={{ mb: 2 }}>
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
            label="Confirm Password"
            type="password"
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
