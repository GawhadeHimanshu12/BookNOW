// client/src/api/search.js
import axios from 'axios';

const API_URL = '/api/search';

export const globalSearchApi = async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
    }
    try {
        const response = await axios.get(API_URL, { params: { q: query, limit } });
        return response.data;
    } catch (error) {
        console.error('Global Search API error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Search failed');
    }
};