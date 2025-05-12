import axios from 'axios';


const MOVIE_API_URL = '/api/movies';
const REVIEW_API_URL = '/api/reviews'; 


export const getReviewsForMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for fetching reviews');
    try {
        const response = await axios.get(`<span class="math-inline">\{MOVIE\_API\_URL\}/</span>{movieId}/reviews`);
        return response.data; 
    } catch (error) {
        console.error(`Error fetching reviews for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reviews');
    }
};

