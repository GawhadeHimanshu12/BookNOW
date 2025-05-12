
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loginUserApi, registerUserApi, getMeApi } from '../api/auth'; 


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
        console.log('AuthProvider: loadUser called with token:', !!currentToken);
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
            console.log("AuthProvider: User loaded successfully:", userData?.email);
        } catch (error) {
            console.error("AuthProvider: Failed to load user data (likely invalid/expired token):", error.message);
            logout(); 
        } finally {
            setIsLoading(false);
        }
    }, []); 

    
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        console.log("AuthProvider: Initial mount check - Stored token found:", !!storedToken);
        loadUser(storedToken); 
        
    }, []); 

    
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

    
    const register = async (userData) => {
         setIsLoading(true);
         setAuthError(null);
         try {
            const data = await registerUserApi(userData);
            setToken(data.token);
            await loadUser(data.token); 
             return { success: true, isApproved: data.isApproved }; 
         } catch (error) {
             const errorMsg = error.errors ? error.errors.map(e => e.msg).join(', ') : (error.message || 'Registration failed.');
             setAuthError(errorMsg);
             logout(); 
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
        console.log("AuthProvider: User logged out");
    };

    
    const contextValue = {
        user,
        token,
        isAuthenticated,
        isLoading,
        authError,
        setAuthError, 
        login,
        register,
        logout,
        loadUser 
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {/* Don't render children until initial auth check is complete */}
            {/*!isLoading ? children : <div>Loading Application...</div> */}
             {/* Render children immediately, components can check isLoading themselves */}
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