import axios from 'axios';
const API_URL = '/api/events'; 

export const getEventsApi = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch events');
  }
};

export const getEventByIdApi = async (eventId) => {
  if (!eventId) throw new Error('Event ID is required');
  try {
      const response = await axios.get(`${API_URL}/${eventId}`);
      return response.data;
  } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to fetch event details');
  }
};

export const createEventApi = async (eventData) => {
    try {
        const response = await axios.post(API_URL, eventData);
        return response.data;
    } catch (error) {
        console.error('Error creating event:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create event');
    }
};

export const updateEventApi = async (eventId, eventData) => {
    if (!eventId) throw new Error('Event ID is required for update');
    try {
        const response = await axios.put(`${API_URL}/${eventId}`, eventData);
        return response.data;
    } catch (error) {
        console.error(`Error updating event ${eventId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update event');
    }
};

export const deleteEventApi = async (eventId) => {
    if (!eventId) throw new Error('Event ID is required for deletion');
    try {
        const response = await axios.delete(`${API_URL}/${eventId}`);
        return response.data; 
    } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete event');
    }
};