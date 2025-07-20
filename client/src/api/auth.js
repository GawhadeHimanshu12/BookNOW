import axios from 'axios';
const API_URL = '/api/auth';

export const registerUserApi = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        console.error('Registration API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Registration failed');
    }
};

export const loginUserApi = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    } catch (error) {
        console.error('Login API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Login failed');
    }
};

export const getMeApi = async (token) => {
     if (!token) throw new Error('No token provided for getMe');
     try {
        const config = {
            headers: { 'Authorization': `Bearer ${token}` } 
        };
        const response = await axios.get(`${API_URL}/me`, config);
        return response.data;
    } catch (error) {
        console.error('GetMe API error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
             console.log("Token likely expired or invalid during getMe.");
        }
        throw error.response?.data || new Error('Failed to fetch profile');
    }
};

export const forgotPasswordApi = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/forgotpassword`, { email });
        
        return response.data;
    } catch (error) {
        console.error('Forgot Password API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to send password reset request');
    }
};

export const resetPasswordApi = async (resetToken, password) => {
    if (!resetToken) throw new Error('Reset token is required');
    try {
        
        const response = await axios.put(`${API_URL}/resetpassword/${resetToken}`, { password });
        
        return response.data;
    } catch (error) {
        console.error('Reset Password API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to reset password');
    }
};