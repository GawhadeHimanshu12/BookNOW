const Venue = require('../models/Venue');
const User = require('../models/User'); 
const { validationResult } = require('express-validator');

exports.getVenues = async (req, res) => {
    try {
        const { city, facility, sort, status } = req.query;
        let query = {};      
        if (req.user?.role !== 'admin') {
            query.isActive = true;
        }     
        else {
            if (status === 'active') {
                query.isActive = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            }  
        }
        if (city) {
            query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const total = await Venue.countDocuments(query);

        const venues = await Venue.find(query)
                                .populate('organizer', 'organizationName')
                                .sort({ name: 1 }) 
                                .skip(startIndex)
                                .limit(limit);

        const pagination = {
            next: (startIndex + limit < total) ? { page: page + 1, limit } : null,
            prev: (startIndex > 0) ? { page: page - 1, limit } : null,
        };

        res.status(200).json({ success: true, count: venues.length, total, pagination, data: venues });

    } catch (err) {
        console.error('Error fetching venues:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
exports.getVenueById = async (req, res) => {
    try {
        
        const venue = await Venue.findById(req.params.id)
                                 .populate('organizer', 'name organizationName');

        
        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }
        if (venue.isActive) {
            return res.status(200).json(venue);
        }
        const user = req.user;

        if (user && (user.role === 'admin' || venue.organizer._id.toString() === user.id)) {
            return res.status(200).json(venue);
        }

        return res.status(404).json({ msg: 'Venue not found or is inactive' });

    } catch (err) {
        console.error('Error fetching venue by ID:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.createVenue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, facilities, screens } = req.body;
    const organizerId = req.user.id; 

    try {
         
        const user = await User.findById(organizerId);
        if (!user || (user.role === 'organizer' && !user.isApproved) && user.role !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized or not approved to create venues' });
        }
        const newVenue = new Venue({
            name,
            address,
            facilities,
            screens, 
            organizer: organizerId, 
            isActive: true 
        });

        
        const venue = await newVenue.save();

        
        if (user.role === 'organizer') {
            user.managedVenues.push(venue._id);
            await user.save();
        }

        res.status(201).json(venue);

    } catch (err) {
        console.error('Error creating venue:', err.message);
        
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateVenue = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, facilities, screens, isActive } = req.body;
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        let venue = await Venue.findById(venueId);

        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }

        
        if (venue.organizer.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ msg: 'User not authorized to update this venue' });
        }

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (address) updatedFields.address = address;
        if (facilities) updatedFields.facilities = facilities;
        if (screens) updatedFields.screens = screens; 
        if (typeof isActive === 'boolean') updatedFields.isActive = isActive; 

        
        venue = await Venue.findByIdAndUpdate(
            venueId,
            { $set: updatedFields },
            { new: true, runValidators: true } 
        ).populate('organizer', 'name organizationName');

        res.status(200).json(venue);

    } catch (err) {
        console.error('Error updating venue:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deleteVenue = async (req, res) => {
    const venueId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const venue = await Venue.findById(venueId);

        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found' });
        }

        
        if (venue.organizer.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ msg: 'User not authorized to delete this venue' });
        }

        venue.isActive = false;
        await venue.save();


        
        await User.findByIdAndUpdate(venue.organizer, {
            $pull: { managedVenues: venueId }
        });

        res.status(200).json({ msg: 'Venue deactivated successfully' }); 

    } catch (err) {
        console.error('Error deleting/deactivating venue:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Venue not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};