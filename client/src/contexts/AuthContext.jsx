// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    loginUserApi, registerUserApi, getMeApi, googleLoginApi,
    checkEmailApi, sendOtpApi, verifyOtpApi // Imported new functions
} from '../api/auth'; 

const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('authToken', token); 
        console.log('Auth Token Set');
    } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('authToken'); 
        console.log('Auth Token Removed');
    }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true); 
    const [authError, setAuthError] = useState(null);

    const loadUser = useCallback(async (currentToken) => {
        if (!currentToken) {
            setIsLoading(false);
            logout(); 
            return;
        }
        setAuthToken(currentToken);
        setIsAuthenticated(true);
        setIsLoading(true);
        try {
            const userData = await getMeApi(currentToken);
            setUser(userData);
        } catch (error) {
            console.error("AuthProvider: Failed to load user data:", error.message);
            logout(); 
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            loadUser(urlToken);
        } else {
            const storedToken = localStorage.getItem('authToken');
            loadUser(storedToken); 
        }
    }, [loadUser]); 

    // --- OTP Login Flows ---
    const checkEmail = async (email) => {
        setIsLoading(true);
        setAuthError(null);
        try { 
            const data = await checkEmailApi(email);
            setIsLoading(false);
            return data;
        } catch (error) { 
            console.error(error); 
            setIsLoading(false);
            return null; 
        }
    };

    const sendOtp = async (email) => {
        setIsLoading(true);
        setAuthError(null);
        try { 
            await sendOtpApi(email); 
            setIsLoading(false);
            return true; 
        } catch (error) { 
            setAuthError(error.msg || 'Failed to send OTP'); 
            setIsLoading(false);
            return false; 
        }
    };

    const verifyOtp = async (email, otp) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await verifyOtpApi(email, otp);
            setToken(data.token);
            await loadUser(data.token);
            return { success: true, isApproved: data.isApproved };
        } catch (error) {
            setAuthError(error.errors ? error.errors[0].msg : 'OTP verification failed');
            return { success: false };
        } finally { 
            setIsLoading(false); 
        }
    };

    // --- Standard Password Login ---
    const login = async (credentials) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await loginUserApi(credentials);
            setToken(data.token); 
            await loadUser(data.token); 
            return true; 
        } catch (error) {
            const errorMsg = error.errors ? error.errors.map(e => e.msg).join(', ') : (error.message || 'Login failed.');
            setAuthError(errorMsg);
            logout(); 
            return false; 
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = () => {
        googleLoginApi();
    };

    // --- Registration ---
    const register = async (userData) => {
         setIsLoading(true);
         setAuthError(null);
         try {
            const data = await registerUserApi(userData);
            return { success: true }; 
         } catch (error) {
             const errorMsg = error.errors ? error.errors.map(e => e.msg).join(', ') : (error.message || 'Registration failed.');
             setAuthError(errorMsg);
             return { success: false };
         } finally {
             setIsLoading(false);
         }
    };

    const logout = () => {
        setAuthToken(null); 
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoading(false);
    };

    const contextValue = {
        user, token, isAuthenticated, isLoading, authError, setAuthError,
        login, googleLogin, register, logout, loadUser,
        checkEmail, sendOtp, verifyOtp // Exported new tools
    };

    return (
        <AuthContext.Provider value={contextValue}>
             {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};