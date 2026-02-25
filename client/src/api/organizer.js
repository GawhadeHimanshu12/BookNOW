// client/src/api/organizer.js
import axios from 'axios';

const API_URL = '/api/organizer'; 

export const getOrganizerDashboardStatsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard`);
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer dashboard stats:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer dashboard stats');
    }
};

export const getMyVenuesApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/venues`);
        return response.data; // Expects an array of venues
    } catch (error) {
        console.error('Error fetching organizer venues:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer venues');
    }
};

export const getMyShowtimesApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/showtimes`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer showtimes:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer showtimes');
    }
};

export const getMyVenueBookingsApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/bookings`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching organizer venue bookings:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer venue bookings');
    }
};

export const updateMyOrganizerProfileApi = async (profileData) => {
    try {
        const response = await axios.put(`${API_URL}/profile`, profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating organizer profile:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update organizer profile');
    }
};


export const getMyEventsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/events`);
        return response.data; // Expects an array of events
    } catch (error) {
        console.error('Error fetching organizer events:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch organizer events');
    }
};
