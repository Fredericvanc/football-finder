import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Container, Box, TextField, Button, Alert, Typography, CircularProgress } from '@mui/material';

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: true,
  hasLowerCase: true,
  hasNumber: true,
  hasSpecialChar: true,
};

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }
    if (PASSWORD_REQUIREMENTS.hasUpperCase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_REQUIREMENTS.hasLowerCase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_REQUIREMENTS.hasNumber && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (PASSWORD_REQUIREMENTS.hasSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate password requirements
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join('\n'));
      }

      // Validate password match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Set flag before password update
      localStorage.setItem('passwordJustUpdated', 'true');

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
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
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Reset Password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password updated successfully! Redirecting to home page...
            </Alert>
          )}

          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
            fullWidth
            margin="normal"
            required
            error={!!error && error.includes('Password must')}
            helperText={
              !error ? 
              'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' :
              undefined
            }
          />
          
          <TextField
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || success}
            fullWidth
            margin="normal"
            required
            error={!!error && error.includes('Passwords do not match')}
          />
          
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || success}
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Update Password'
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
