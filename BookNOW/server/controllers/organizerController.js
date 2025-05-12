const Venue = require('../models/Venue');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');





exports.getOrganizerDashboardStats = async (req, res) => {
    const organizerId = req.user.id;
    try {
        const venueCount = await Venue.countDocuments({ organizer: organizerId, isActive: true });

        
        const upcomingShowtimeCount = await Showtime.countDocuments({
            venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') }, 
            startTime: { $gte: new Date() }, 
            isActive: true
        });

        
         const totalActiveShowtimeCount = await Showtime.countDocuments({
            venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') },
            isActive: true
        });

        
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentBookingCount = await Booking.countDocuments({
            showtime: { $in: await Showtime.find({ venue: { $in: await Venue.find({ organizer: organizerId }).distinct('_id') }}).distinct('_id')},
            bookingTime: { $gte: sevenDaysAgo },
            status: 'Confirmed' 
        });


        res.status(200).json({
            managedVenues: venueCount,
            upcomingShowtimes: upcomingShowtimeCount,
            totalActiveShowtimes: totalActiveShowtimeCount,
            recentBookings: recentBookingCount,
        });

    } catch (err) {
        console.error('Error fetching organizer dashboard stats:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getMyVenues = async (req, res) => {
    const organizerId = req.user.id;
    try {
        const venues = await Venue.find({ organizer: organizerId }) 
            .sort({ name: 1 });
        res.status(200).json(venues);
    } catch (err) {
        console.error('Error fetching organizer venues:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getMyShowtimes = async (req, res) => {
    const organizerId = req.user.id;
    const { venueId, movieId, date, status } = req.query; 

    try {
        
        const managedVenueIds = await Venue.find({ organizer: organizerId }).distinct('_id');
        if (managedVenueIds.length === 0) {
             return res.status(200).json([]); 
        }

        
        const query = { venue: { $in: managedVenueIds } };

        if (venueId) { 
             if (!managedVenueIds.some(id => id.equals(venueId))) {
                  return res.status(403).json({ msg: 'Access denied to this venue\'s showtimes' });
             }
             if (!mongoose.Types.ObjectId.isValid(venueId)) return res.status(400).json({ msg: 'Invalid Venue ID' });
            query.venue = venueId;
        }
        if (movieId) {
             if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json({ msg: 'Invalid Movie ID' });
            query.movie = movieId;
        }
         if (date) {
            try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                query.startTime = { $gte: startDate, $lt: endDate };
            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        

        
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title')
            .populate('venue', 'name')
            .sort({ startTime: -1 }); 

        res.status(200).json(showtimes);

    } catch (err) {
        console.error('Error fetching organizer showtimes:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getMyVenueBookings = async (req, res) => {
     const organizerId = req.user.id;
     const { showtimeId, date, status } = req.query; 

     try {
        
        const managedVenueIds = await Venue.find({ organizer: organizerId }).distinct('_id');
         if (managedVenueIds.length === 0) return res.status(200).json([]);

        const showtimeQuery = { venue: { $in: managedVenueIds } };
        if (showtimeId) { 
            if (!mongoose.Types.ObjectId.isValid(showtimeId)) return res.status(400).json({ msg: 'Invalid Showtime ID' });
            const st = await Showtime.findById(showtimeId).select('venue');
            if (!st || !managedVenueIds.some(id => id.equals(st.venue))) {
                 return res.status(403).json({ msg: 'Access denied to this showtime\'s bookings' });
            }
            showtimeQuery._id = showtimeId;
        }
        

        const relevantShowtimeIds = await Showtime.find(showtimeQuery).distinct('_id');
        if (relevantShowtimeIds.length === 0) return res.status(200).json([]);


        
        const bookingQuery = { showtime: { $in: relevantShowtimeIds } };

        if (status && ['Pending', 'Confirmed', 'Cancelled', 'CheckedIn'].includes(status)) {
            bookingQuery.status = status;
        }
        
         if (date) {
            try {
                const startDate = new Date(`${date}T00:00:00.000Z`);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 1);
                bookingQuery.bookingTime = { $gte: startDate, $lt: endDate };
            } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)'}); }
        }


        
        const bookings = await Booking.find(bookingQuery)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie screenName venue',
                 populate: [
                    { path: 'movie', select: 'title'},
                    { path: 'venue', select: 'name'}
                 ]
            })
            .sort({ bookingTime: -1 });

        res.status(200).json(bookings);

    } catch (err) {
        console.error('Error fetching organizer venue bookings:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.updateMyProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const organizerId = req.user.id;
    const { name, organizationName } = req.body; 

    try {
        const updateFields = {};
        if (name) updateFields.name = name;
        if (organizationName) updateFields.organizationName = organizationName;
        

        if (Object.keys(updateFields).length === 0) {
             return res.status(400).json({ msg: 'No valid fields provided for update' });
        }

        const updatedOrganizer = await User.findByIdAndUpdate(
            organizerId,
            { $set: updateFields },
            { new: true, runValidators: true } 
        ).select('-password -managedVenues'); 


        if (!updatedOrganizer) {
            
            return res.status(404).json({ msg: 'Organizer not found' });
        }

        res.status(200).json({ msg: 'Profile updated successfully', organizer: updatedOrganizer });

    } catch (err) {
        console.error('Error updating organizer profile:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};