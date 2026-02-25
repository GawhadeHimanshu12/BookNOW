// client/src/api/bookings.js
import axios from 'axios';

const API_URL = '/api/bookings';

export const createBookingApi = async (bookingData) => {
    try {
        const response = await axios.post(API_URL, bookingData);
        return response.data;
    } catch (error) {
        console.error('Booking API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Booking failed');
    }
};

export const getMyBookingsApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/me`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Get My Bookings API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch your bookings');
    }
};

export const getBookingByIdApi = async (bookingId) => {
     if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.get(`${API_URL}/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error(`Get Booking By ID (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch booking details');
    }
};

export const cancelBookingApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.put(`${API_URL}/${bookingId}/cancel`);
        return response.data;
    } catch (error) {
         console.error(`Cancel Booking (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel booking');
    }
};

export const cancelPendingBookingApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required to cancel a pending booking');
    try {
        const response = await axios.put(`${API_URL}/${bookingId}/cancel-pending`);
        return response.data;
    } catch (error) {
        console.error(`Cancel Pending Booking (${bookingId}) API error:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel pending booking');
    }
};