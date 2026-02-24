// client/src/pages/RegisterPage.jsx
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
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

const RegisterPage = () => {
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'user', organizationName: ''
    });
    const [otp, setOtp] = useState('');
    const [pageError, setPageError] = useState('');
    
    const { register, verifyOtp, googleLogin, isLoading, authError, setAuthError } = useAuth();
    const navigate = useNavigate();
    const isOrganizer = formData.role === 'organizer';

    useEffect(() => {
        setAuthError(null);
        return () => { setAuthError(null); };
    }, [setAuthError]);

    const handleChange = (e) => {
        setAuthError(null); setPageError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (e) => {
        setAuthError(null); setPageError('');
        setFormData({ ...formData, role: e.target.value });
    };

    // Step 1: Submit Form & Send OTP
    const handleSubmit = async (e) => {
        e.preventDefault();
        setPageError(''); setAuthError(null);

        if (formData.password !== formData.confirmPassword) {
            setPageError("Passwords do not match."); return;
        }
        if (formData.password.length < 6) {
             setPageError("Password must be at least 6 characters."); return;
        }
        if (isOrganizer && !formData.organizationName.trim()) {
            setPageError("Organization name is required for organizers."); return;
        }
        if (!formData.name.trim() || !formData.email.trim()) { 
            setPageError("Name and Email are required."); return;
        }

        const apiData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            ...(isOrganizer && { organizationName: formData.organizationName.trim() })
        };

        const result = await register(apiData);
        if (result && result.success) {
            setStep(2); // Registration recorded, waiting for OTP validation
        }
    };

    // Step 2: Verify OTP
    const handleOtpSubmit = async () => {
        setPageError('');
        if (!otp) return setPageError("Please enter the OTP sent to your email.");
        
        const result = await verifyOtp(formData.email, otp);
        if (result.success) {
            if (formData.role === 'organizer' && !result.isApproved) {
                alert("Account verified successfully! Your organizer account requires admin approval before you can fully log in.");
                navigate('/login');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom> 
                    {step === 1 ? 'Register' : 'Verify Email'} 
                </Typography>

                <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem', py: 0, width: '100%' }}>
                    <strong>Note:</strong> AWS SES is in Sandbox mode. Email Verification will only work for verified Sandbox emails.
                </Alert>

                <Box component="form" onSubmit={step === 1 ? handleSubmit : (e) => e.preventDefault()} noValidate sx={{ mt: 1, width: '100%' }}>
                    
                    {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}
                    {pageError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{pageError}</Alert>}

                    {step === 1 ? (
                        <>
                            <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
                            <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
                            <TextField margin="normal" required fullWidth name="password" label="Password (min 6 chars)" type="password" id="password" inputProps={{ minLength: 6 }} value={formData.password} onChange={handleChange} disabled={isLoading} />
                            <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" inputProps={{ minLength: 6 }} value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />

                            <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
                                <FormLabel component="legend">Register As</FormLabel>
                                <RadioGroup row name="role" value={formData.role} onChange={handleRoleChange}>
                                    <FormControlLabel value="user" control={<Radio size="small"/>} label="User" disabled={isLoading}/>
                                    <FormControlLabel value="organizer" control={<Radio size="small"/>} label="Organizer" disabled={isLoading}/>
                                </RadioGroup>
                            </FormControl>

                            {isOrganizer && ( <TextField margin="normal" required={isOrganizer} fullWidth name="organizationName" label="Organization Name" id="organizationName" value={formData.organizationName} onChange={handleChange} disabled={isLoading} sx={{ mb: 2 }}/> )}

                            <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2, mb: 2 }} disabled={isLoading}>
                               {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register & Send OTP'}
                            </Button>
                            
                            <Button fullWidth variant="outlined" onClick={googleLogin} sx={{ mb: 2 }}>
                                Sign Up with Google
                            </Button>
                            
                            <Box sx={{ textAlign: 'center' }}> 
                                <Link component={RouterLink} to="/login" variant="body2" color="error"> {"Already have an account? Sign In"} </Link> 
                            </Box>
                        </>
                    ) : (
                        <>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                An OTP has been sent to <strong>{formData.email}</strong>.
                            </Alert>
                            <TextField
                                margin="normal" required fullWidth label="Enter 6-digit OTP"
                                value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isLoading} autoFocus
                            />
                            <Button fullWidth variant="contained" color="success" sx={{ mt: 2 }} onClick={handleOtpSubmit} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Continue'}
                            </Button>
                            <Button fullWidth size="small" sx={{ mt: 1 }} onClick={() => setStep(1)} disabled={isLoading}>
                                Back to Details
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default RegisterPage;