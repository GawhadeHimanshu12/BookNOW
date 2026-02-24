// client/src/pages/LoginPage.jsx
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
import Divider from '@mui/material/Divider';

const LoginPage = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Select Pwd/OTP, 3: Enter OTP
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const { login, googleLogin, checkEmail, sendOtp, verifyOtp, isLoading, authError, setAuthError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setAuthError(null);
        return () => { setAuthError(null); };
    }, [setAuthError]);

    // Step 1: Submit Email
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        if (!email) return setAuthError("Please enter your email.");
        
        const result = await checkEmail(email);
        if (result && result.exists) {
            setStep(2); // Move to password/OTP choice
        } else if (result && !result.exists) {
            setAuthError("Email not found. Please register to create an account.");
        }
    };

    // Step 2: Login with Password
    const handlePasswordLogin = async () => {
        if (!password) return setAuthError("Password is required");
        const success = await login({ email, password });
        if (success) navigate('/');
    };

    // Step 2: Request OTP
    const handleRequestOtp = async () => {
        const success = await sendOtp(email);
        if (success) {
            setStep(3); // Move to OTP input
        }
    };

    // Step 3: Verify OTP
    const handleOtpVerify = async () => {
        if (!otp) return setAuthError("Please enter the OTP.");
        const result = await verifyOtp(email, otp);
        if (result.success) {
             navigate('/');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom>
                    {step === 3 ? 'Verify OTP' : 'Login'}
                </Typography>

                {/* SES Sandbox Notice */}
                <Alert severity="warning" sx={{ mb: 3, fontSize: '0.75rem', py: 0 }}>
                    <strong>Note:</strong> AWS SES is in Sandbox mode. OTPs will only be sent to verified email addresses. Alternatively, use Password or Google Sign In.
                </Alert>

                <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                    {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}

                    {/* STEP 1: Email Input */}
                    <TextField
                        margin="normal" required fullWidth id="email" label="Email Address" name="email"
                        autoComplete="email" autoFocus={step === 1} value={email} onChange={(e) => setEmail(e.target.value)}
                        disabled={step !== 1 || isLoading}
                    />

                    {step === 1 && (
                        <>
                            <Button fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} onClick={handleEmailSubmit} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
                            </Button>
                            
                            <Divider sx={{ my: 2 }}>OR</Divider>
                            
                            <Button fullWidth variant="outlined" onClick={googleLogin} sx={{ mb: 2 }}>
                                Sign In with Google
                            </Button>
                        </>
                    )}

                    {/* STEP 2: Choose Password or OTP */}
                    {step === 2 && (
                        <>
                            <TextField
                                margin="normal" required fullWidth name="password" label="Password" type="password"
                                id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading} autoFocus
                            />
                            
                            <Box sx={{ textAlign: 'right', my: 1 }}>
                                <Link component={RouterLink} to="/forgot-password" variant="body2" color="error">
                                    Forgot password?
                                </Link>
                            </Box>

                            <Button fullWidth variant="contained" color="error" sx={{ mt: 1, mb: 2 }} onClick={handlePasswordLogin} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login with Password'}
                            </Button>

                            <Divider sx={{ my: 2 }}>OR</Divider>

                            <Button fullWidth variant="outlined" color="primary" onClick={handleRequestOtp} disabled={isLoading} sx={{ mb: 2 }}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login using OTP'}
                            </Button>
                            
                            <Button fullWidth size="small" onClick={() => { setStep(1); setPassword(''); setAuthError(null); }}>
                                Back to Email
                            </Button>
                        </>
                    )}

                    {/* STEP 3: OTP Input */}
                    {step === 3 && (
                        <>
                            <TextField
                                margin="normal" required fullWidth label="Enter 6-digit OTP"
                                value={otp} onChange={(e) => setOtp(e.target.value)}
                                disabled={isLoading} autoFocus
                            />
                            <Button fullWidth variant="contained" color="success" sx={{ mt: 2, mb: 2 }} onClick={handleOtpVerify} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
                            </Button>

                            <Button fullWidth size="small" onClick={() => { setStep(2); setOtp(''); setAuthError(null); }}>
                                Go Back
                            </Button>
                        </>
                    )}

                    {step === 1 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Link component={RouterLink} to="/register" variant="body2" color="error">
                                {"Don't have an account? Sign Up"}
                            </Link>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;