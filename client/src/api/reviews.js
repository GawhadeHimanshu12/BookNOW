import axios from 'axios';

const MOVIE_API_URL = '/api/movies';
const REVIEW_API_URL = '/api/reviews';

export const getReviewsForMovieApi = async (movieId) => {
    if (!movieId) throw new Error('Movie ID is required for fetching reviews');
    try {
        const response = await axios.get(`${MOVIE_API_URL}/${movieId}/reviews`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching reviews for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch reviews');
    }
};

export const createReviewApi = async (movieId, reviewData) => {
    if (!movieId) throw new Error('Movie ID is required to create a review');
    try {
        const response = await axios.post(`${MOVIE_API_URL}/${movieId}/reviews`, reviewData);
        return response.data;
    } catch (error) {
        console.error(`Error creating review for movie ${movieId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to submit review');
    }
};

export const likeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/like`);
        return response.data;
    } catch (error) {
        console.error(`Error liking review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to like review');
    }
};

export const dislikeReviewApi = async (reviewId) => {
    if (!reviewId) throw new Error('Review ID is required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/dislike`);
        return response.data;
    } catch (error) {
        console.error(`Error disliking review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to dislike review');
    }
};

export const reportReviewApi = async (reviewId, reason) => {
    if (!reviewId || !reason) throw new Error('Review ID and reason are required');
    try {
        const response = await axios.post(`${REVIEW_API_URL}/${reviewId}/report`, { reason });
        return response.data;
    } catch (error) {
        console.error(`Error reporting review ${reviewId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to report review');
    }
};