// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    console.log('[ProtectedRoute] Checking auth:', { isLoading, isAuthenticated, userRole: user?.role });

    if (isLoading) {
        console.log('[ProtectedRoute] Auth state loading...');
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress color="error" />
            </Box>
        );
    }
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Not authenticated, redirecting to login.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            console.log(`[ProtectedRoute] Role mismatch. User role: ${userRole}, Allowed: ${allowedRoles.join(',')}. Redirecting to home.`);
            return <Navigate to="/" replace />
        }
         console.log(`[ProtectedRoute] Role check passed. User role: ${userRole}`);
    }

    console.log('[ProtectedRoute] Access granted.');
    return children;
};

export default ProtectedRoute;
