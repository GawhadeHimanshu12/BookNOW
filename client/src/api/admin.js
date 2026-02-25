// client/src/api/admin.js

import axios from 'axios';
const API_URL = '/api/admin';

// --- User Management ---
export const getAllUsersAdminApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/users`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching all users (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch users');
    }
};

export const approveOrganizerAdminApi = async (organizerId) => {
    if (!organizerId) throw new Error('Organizer ID is required for approval');
    try {
        const response = await axios.put(`${API_URL}/organizers/${organizerId}/approve`);
        return response.data;
    } catch (error) {
        console.error(`Error approving organizer ${organizerId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to approve organizer');
    }
};

export const updateUserAdminApi = async (userId, userData) => {
    try {
        const response = await axios.put(`${API_URL}/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update user');
    }
};

export const deleteUserAdminApi = async (userId) => {
    try {
        const response = await axios.delete(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete user');
    }
};

// --- Promo Code Management API Functions ---
export const getAllPromoCodesAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/promocodes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching promo codes (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch promo codes');
    }
};

export const createPromoCodeAdminApi = async (promoCodeData) => {
    try {
        const response = await axios.post(`${API_URL}/promocodes`, promoCodeData);
        return response.data;
    } catch (error) {
        console.error('Error creating promo code (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create promo code');
    }
};

export const updatePromoCodeAdminApi = async (promoCodeId, promoCodeData) => {
    try {
        const response = await axios.put(`${API_URL}/promocodes/${promoCodeId}`, promoCodeData);
        return response.data;
    } catch (error) {
        console.error(`Error updating promo code ${promoCodeId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update promo code');
    }
};

export const deletePromoCodeAdminApi = async (promoCodeId) => {
    try {
        const response = await axios.delete(`${API_URL}/promocodes/${promoCodeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting promo code ${promoCodeId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete promo code');
    }
};

// --- City Management API Functions ---
export const getAllCitiesAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/cities`);
        return response.data;
    } catch (error) {
        console.error('Error fetching cities (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch cities');
    }
};

export const createCityAdminApi = async (cityData) => {
    try {
        const response = await axios.post(`${API_URL}/cities`, cityData);
        return response.data;
    } catch (error) {
        console.error('Error creating city (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create city');
    }
};

export const updateCityAdminApi = async (cityId, cityData) => {
    try {
        const response = await axios.put(`${API_URL}/cities/${cityId}`, cityData);
        return response.data;
    } catch (error) {
        console.error(`Error updating city ${cityId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update city');
    }
};

export const deleteCityAdminApi = async (cityId) => {
    try {
        const response = await axios.delete(`${API_URL}/cities/${cityId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting city ${cityId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete city');
    }
};


export const getAllVenuesAdminApi = async (params = { status: 'all', limit: 100 }) => { 
    try {

        const response = await axios.get(`/api/venues`, { params }); 
        return response.data;
    } catch (error) {
        console.error('Error fetching all venues (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch venues for admin');
    }
};

// --- Venue Management API Functions  ---
export const updateVenueAdminApi = async (venueId, venueData) => {
    if (!venueId) throw new Error('Venue ID is required for update');
    try {
        const response = await axios.put(`/api/venues/${venueId}`, venueData);
        return response.data;
    } catch (error) {
        console.error(`Error updating venue ${venueId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update venue');
    }
};

// --- Booking Management API Functions (for Admin) ---

export const getAllBookingsAdminApi = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/bookings`, { params });
        return response.data; // Expected: { success, count, total, pagination, data: [bookings] }
    } catch (error) {
        console.error('Error fetching all bookings (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch bookings for admin');
    }
};

export const getBookingByIdAdminApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required');
    try {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching booking ${bookingId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch booking details for admin');
    }
};


export const cancelAnyBookingAdminApi = async (bookingId) => {
    if (!bookingId) throw new Error('Booking ID is required for cancellation');
    try {
        const response = await axios.put(`${API_URL}/bookings/${bookingId}/cancel`);
        return response.data; 
    } catch (error) {
        console.error(`Error cancelling booking ${bookingId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to cancel booking as admin');
    }
};

// --- Platform Statistics API Function ---
export const getPlatformStatsAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data; // Expected: { success: true, stats: { users: {...}, content: {...}, ... } }
    } catch (error) {
        console.error('Error fetching platform stats (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch platform statistics');
    }
};

export const getUserByIdAdminApi = async (userId) => {
    if (!userId) throw new Error('User ID is required');
    try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${userId} (Admin):`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch user details');
    }
};


export const getReportedReviewsAdminApi = async () => {
    try {
        const response = await axios.get(`${API_URL}/reviews/reported`);
        return response.data;
    } catch (error) {
        console.error('Error fetching reported reviews (Admin):', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reported reviews');
    }
};

export const resolveReportAdminApi = async (reviewId, action) => {
    if (!reviewId || !action) throw new Error('Review ID and action are required');
    try {
        const response = await axios.put(`${API_URL}/reviews/${reviewId}/resolve`, { action });
        return response.data;
    } catch (error) {
        console.error(`Error resolving report for review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to resolve report');
    }
};
