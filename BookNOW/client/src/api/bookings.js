

import axios from 'axios';

const API_URL = '/api/bookings'; 

export const createBookingApi = async (bookingData) => {
    console.log("[createBookingApi] Sending booking data:", bookingData);
    try {
        
        
        const response = await axios.post(API_URL, bookingData);
        console.log("[createBookingApi] Backend response:", response.data);
        
        return response.data;
    } catch (error) {
        console.error('Booking API error:', error.response?.data || error.message);
        
        
        throw error.response?.data || new Error('Booking failed');
    }
};

export const getMyBookingsApi = async () => {
    console.log("[getMyBookingsApi] Fetching user's bookings...");
    try {
        
        const response = await axios.get(`${API_URL}/me`);
        console.log("[getMyBookingsApi] Received bookings:", response.data);
        
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Get My Bookings API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch your bookings');
    }
};

export const getBookingByIdApi = async (bookingId) => {
     if (!bookingId) throw new Error('Booking ID is required');
     console.log(`[getBookingByIdApi] Fetching booking: ${bookingId}`);
    try {
        
        const response = await axios.get(`${API_URL}/${bookingId}`);
        console.log(`[getBookingByIdApi] Received booking details for ${bookingId}:`, response.data);
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
