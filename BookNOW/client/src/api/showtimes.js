import axios from 'axios';
const API_URL = '/api/showtimes'; 

export const getShowtimesApi = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data; 
    } catch (error) {
         console.error('Error fetching showtimes:', error.response?.data || error.message);
         throw error.response?.data || new Error('Failed to fetch showtimes');
    }
};

export const getShowtimeSeatmapApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required for fetching seat map');
    try {
        
        const url = `${API_URL}/${showtimeId}/seatmap`;
        console.log(`[getShowtimeSeatmapApi] Fetching from: ${url}`); 
        const response = await axios.get(url);
        console.log(`[getShowtimeSeatmapApi] Response for ${showtimeId}:`, response.data); 
        
        return response.data;
    } catch (error) {
        console.error(`Error fetching seat map for showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch seat map');
    }
};


export const getShowtimeByIdApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required');
    try {
        
        const url = `${API_URL}/${showtimeId}`;
        console.log(`[getShowtimeByIdApi] Fetching from: ${url}`); 
        const response = await axios.get(url);
        console.log(`[getShowtimeByIdApi] Response for ${showtimeId}:`, response.data); 
        return response.data; 
    } catch (error) {
        console.error(`Error fetching showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch showtime details');
    }
};


export const createShowtimeApi = async (showtimeData) => {
    try {
        const response = await axios.post(API_URL, showtimeData);
        return response.data;
    } catch (error) {
        console.error('Error creating showtime:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create showtime');
    }
};


export const updateShowtimeApi = async (showtimeId, showtimeData) => {
    if (!showtimeId) throw new Error('Showtime ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${showtimeId}`, showtimeData);
        return response.data;
    } catch (error) {
        console.error(`Error updating showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update showtime');
    }
};

export const deleteShowtimeApi = async (showtimeId) => {
    if (!showtimeId) throw new Error('Showtime ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${showtimeId}`);
        return response.data; 
    } catch (error) {
        console.error(`Error deleting showtime ${showtimeId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete showtime');
    }
};