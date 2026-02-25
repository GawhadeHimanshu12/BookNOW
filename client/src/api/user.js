// client/src/api/user.js
import axios from 'axios';

const API_URL = '/api/users';

export const updateMyProfileApi = async (profileData) => {
    try {
        const response = await axios.put(`${API_URL}/profile`, profileData);
        return response.data;
    } catch (error) {
        console.error('Update Profile API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update profile');
    }
};