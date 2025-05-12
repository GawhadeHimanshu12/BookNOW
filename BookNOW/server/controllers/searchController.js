const Movie = require('../models/Movie');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const mongoose = require('mongoose');

exports.searchAll = async (req, res) => {
    const searchTerm = req.query.q; 
    const limit = parseInt(req.query.limit, 10) || 10; 

    if (!searchTerm || searchTerm.trim().length < 2) { 
        return res.status(400).json({ msg: 'Please provide a search term (at least 2 characters)' });
    }

    
    

    try {
        
        const [movieResults, eventResults, venueResults] = await Promise.all([
            
            Movie.find(
                { $text: { $search: searchTerm } },
                { score: { $meta: 'textScore' } } 
            )
            .select('title description posterUrl releaseDate language genre averageRating') 
            .sort({ score: { $meta: 'textScore' } }) 
            .limit(limit),

            
            Event.find(
                 { $text: { $search: searchTerm }, status: 'Scheduled', startDate: { $gte: new Date() } }, 
                 { score: { $meta: 'textScore' } }
            )
            .select('title description category imageUrl startDate address venue') 
            .populate('venue', 'name') 
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit),

            
            Venue.find(
                { $text: { $search: searchTerm }, isActive: true },
                { score: { $meta: 'textScore' } }
            )
            .select('name address screens.name facilities') 
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
        ]);

        res.status(200).json({
            query: searchTerm,
            results: {
                movies: movieResults,
                events: eventResults,
                venues: venueResults
            }
        });

    } catch (err) {
        console.error('Search Error:', err.message);
        
        if (err.message.includes('text index required')) {
             return res.status(500).json({ msg: 'Search functionality requires text indexes to be configured on the database.' });
        }
        res.status(500).json({ msg: 'Server error during search' });
    }
};