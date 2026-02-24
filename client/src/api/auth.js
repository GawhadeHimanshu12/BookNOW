// client/src/api/auth.js
import axios from 'axios';

const API_URL = '/api/auth';

export const registerUserApi = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Registration failed'); }
};

export const loginUserApi = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Login failed'); }
};

export const getMeApi = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Get profile failed'); }
};

export const googleLoginApi = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || ''}${API_URL}/google`, "_self");
};

// --- NEW API CALLS FOR OTP ---

export const checkEmailApi = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/check-email`, { email });
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Check email failed'); }
};

export const sendOtpApi = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/send-otp`, { email });
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Send OTP failed'); }
};

export const verifyOtpApi = async (email, otp) => {
    try {
        const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
        return response.data;
    } catch (error) { throw error.response?.data || new Error('Verify OTP failed'); }
};