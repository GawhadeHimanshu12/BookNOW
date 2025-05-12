
import axios from 'axios';

const API_URL = '/api/venues'; 

export const getVenuesApi = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching venues:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venues');
    }
};

export const getVenueByIdApi = async (venueId) => {
    if (!venueId) throw new Error('Venue ID is required');
    try {
        const response = await axios.get(`${API_URL}/${venueId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venue details');
    }
};


export const createVenueApi = async (venueData) => {
    try {
        const response = await axios.post(API_URL, venueData);
        return response.data;
    } catch (error) {
        console.error('Error creating venue:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create venue');
    }
};


export const updateVenueApi = async (venueId, venueData) => {
    if (!venueId) throw new Error('Venue ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${venueId}`, venueData);
        return response.data;
    } catch (error) {
        console.error(`Error updating venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update venue');
    }
};


export const deleteVenueApi = async (venueId) => {
    if (!venueId) throw new Error('Venue ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${venueId}`);
        return response.data; // { msg: 'Venue deactivated/removed successfully' }
    } catch (error) {
        console.error(`Error deleting venue ${venueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete venue');
    }
};