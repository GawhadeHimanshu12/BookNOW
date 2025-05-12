const Venue = require('../models/Venue');
const User = require('../models/User'); 
const { validationResult } = require('express-validator');




exports.getVenues = async (req, res) => {
    try {
        const query = { isActive: true };
        const { city, facility, sort } = req.query;
        if (req.user?.role !== 'admin' || req.query.status !== 'all') { 
            query.isActive = true; 
            if (req.query.status === 'inactive' && req.user?.role === 'admin') {
                query.isActive = false;
            }
        } else if (req.user?.role === 'admin' && req.query.status === 'active') {
            query.isActive = true;
        } else if (req.user?.role === 'admin' && req.query.status === 'inactive') {
            query.isActive = false;
        }
        
        if (city) query['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') }; 
        if (facility) {
             
             query.facilities = { $regex: new RegExp(`^${facility}$`, 'i') };
        }

        
        let sortOptions = { name: 1 }; 
        if (sort) {
            switch (sort) {
                 case 'name_desc':
                    sortOptions = { name: -1 }; 
                    break;
                 
                 
                 
                 
            }
        }

         
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Venue.countDocuments(query);

        
        const venues = await Venue.find(query)
                                .populate('organizer', 'organizationName') 
                                .sort(sortOptions)
                                .skip(startIndex)
                                .limit(limit)
                                .select('-screens.seatLayout -organizer'); 

        
        const pagination = {};
        if (endIndex < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };


        res.status(200).json({ success: true, count: venues.length, total, pagination, data: venues });

    } catch (err) {
        console.error('Error fetching venues:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findOne({ _id: req.params.id, isActive: true })
                                  .populate('organizer', 'name organizationName'); 

        if (!venue) {
            return res.status(404).json({ msg: 'Venue not found or is inactive' });
        }

        res.status(200).json(venue);
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