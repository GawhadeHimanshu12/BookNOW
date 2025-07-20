import axios from 'axios';
const API_URL = '/api/movies'; 

export const getMoviesApi = async (params = {}) => {
  try {
    
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching movies:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch movies');
  }
};

export const getMovieByIdApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required');
    try {
        
        const url = `${API_URL}/${movieId}`;
        console.log(`[getMovieByIdApi] Attempting fetch from: ${url}`);
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching movie ${movieId}:`, error.response?.data || error.message);
        if (error.message.includes('Network Error') || error.message.includes('CORS')) {
             console.error("CORS or Network Error detected! Ensure backend allows requests from frontend origin or that backend is running.");
        }
        throw error.response?.data || new Error('Failed to fetch movie details');
    }
};

export const createMovieApi = async (movieData) => {
    try {
        
        const response = await axios.post(API_URL, movieData);
        return response.data;
    } catch (error) {
        console.error('Error creating movie:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create movie');
    }
};

export const updateMovieApi = async (movieId, movieData) => {
    if (!movieId) throw new Error('Movie ID is required for update');
    try {
        
        const response = await axios.put(`${API_URL}/${movieId}`, movieData);
        return response.data;
    } catch (error) {
        console.error(`Error updating movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update movie');
    }
};

export const deleteMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for deletion');
    try {
        
        const response = await axios.delete(`${API_URL}/${movieId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete movie');
    }
};

export const checkReviewEligibilityApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required');
    try {
        const response = await axios.get(`${API_URL}/${movieId}/review-eligibility`);
        return response.data;
    } catch (error) {
        
        
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            return { isEligible: false, reason: 'auth_error' };
        }
        console.error(`Error checking review eligibility for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to check review eligibility');
    }
};