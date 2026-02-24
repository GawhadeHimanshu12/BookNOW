// client/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { resetPasswordApi } from '../api/auth';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';

const ResetPasswordPage = () => {
    const { resettoken } = useParams(); // Gets the token from the URL
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        setIsLoading(true);
        try {
            const response = await resetPasswordApi(resettoken, password);
            setMessage(response.msg || 'Password reset successful! Redirecting to login...');
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.msg || err.message || 'Failed to reset password. The link might be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    Set New Password
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

                    <TextField
                        margin="normal" required fullWidth name="password" label="New Password" type="password"
                        value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                    />
                    <TextField
                        margin="normal" required fullWidth name="confirmPassword" label="Confirm New Password" type="password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading}
                    />
                    
                    <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2" color="error">
                            {"Back to Login"}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;