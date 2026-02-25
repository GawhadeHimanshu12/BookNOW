// client/src/pages/GoogleAuthSuccessPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const GoogleAuthSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const { loadUser } = useAuth(); 
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('authToken', token);
            loadUser(token);
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            navigate('/login');
        }
    }, [searchParams, loadUser, navigate]);

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 2 
        }}>
            <CircularProgress size={60} color="primary" />
            <Typography variant="h5">Logging you in...</Typography>
            <Typography variant="body2" color="text.secondary">
                Please wait while we verify your Google account.
            </Typography>
        </Box>
    );
};

export default GoogleAuthSuccessPage;