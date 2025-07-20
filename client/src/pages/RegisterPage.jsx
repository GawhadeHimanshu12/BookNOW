
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
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'user', organizationName: ''
    });
    const [pageError, setPageError] = useState('');
    
    const { register, isLoading, authError, setAuthError } = useAuth();
    const navigate = useNavigate();
    const isOrganizer = formData.role === 'organizer';

    
    useEffect(() => {
        setAuthError(null);
        return () => { setAuthError(null); };
    }, [setAuthError]);

    const handleChange = (e) => {
        setAuthError(null); 
        setPageError('');   
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (e) => {
        setAuthError(null); setPageError('');
        setFormData({ ...formData, role: e.target.value });
    };

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
        if (!formData.name.trim()) {
            setPageError("Full Name is required."); return;
        }
         if (!formData.email.trim()) { 
            setPageError("Email is required."); return;
        }
        

        
        const apiData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            ...(isOrganizer && { organizationName: formData.organizationName.trim() })
        };

        try {
            
            const result = await register(apiData);

            
            
            if (result.success) {
                console.log("Registration successful, navigating...");
                
                if (formData.role === 'organizer' && !result.isApproved) {
                    alert("Registration successful! Your organizer account requires admin approval before you can manage venues/showtimes or log in fully as an organizer.");
                    
                    navigate('/login');
                } else {
                    
                    navigate('/');
                }
            } else {
                
                console.log("Registration failed, error should be displayed from context.");
                
            }
            

        } catch (error) {
            
             console.error("Unexpected error during registration submit:", error);
             setPageError("An unexpected registration error occurred. Please try again.");
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom> Register </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    {/* Display errors */}
                    {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}
                    {pageError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{pageError}</Alert>}

                    {/* Form Fields */}
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
                       {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                    </Button>
                     <Box sx={{ textAlign: 'center' }}> <Link component={RouterLink} to="/login" variant="body2" color="error"> {"Already have an account? Sign In"} </Link> </Box>
                </Box>
            </Paper>
        </Container>
    );
};
export default RegisterPage;
