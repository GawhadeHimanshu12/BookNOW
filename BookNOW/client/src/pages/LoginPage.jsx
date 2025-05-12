
import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoading, authError, setAuthError } = useAuth(); 
  const navigate = useNavigate();

  
  useEffect(() => {
      setAuthError(null); 
      return () => {
          setAuthError(null); 
      };
  }, [setAuthError]);


  const handleChange = (e) => {
    setAuthError(null); 
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null); 
    if (!formData.email || !formData.password) {
        setAuthError("Please enter both email and password."); 
        return;
    }
    try {
         
         
         const success = await login(formData);
         if (success) {
             console.log("Login successful, navigating...");
             navigate('/'); 
         } else {
             
             console.log("Login failed, error message should be displayed.");
         }
         
    } catch (error) {
         
         
         console.error("Unexpected error during login component submit:", error);
         setAuthError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {/* Display authError from context */}
          {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}

          <TextField
            margin="normal" required fullWidth id="email" label="Email Address" name="email"
            autoComplete="email" autoFocus value={formData.email} onChange={handleChange} disabled={isLoading}
          />
          <TextField
            margin="normal" required fullWidth name="password" label="Password" type="password" id="password"
            autoComplete="current-password" value={formData.password} onChange={handleChange} disabled={isLoading}
          />
          <Box sx={{ textAlign: 'right', my: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" color="error">
               Forgot password?
             </Link>
           </Box>
          <Button
            type="submit" fullWidth variant="contained" color="error"
            sx={{ mt: 3, mb: 2 }} disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2" color="error">
                {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;