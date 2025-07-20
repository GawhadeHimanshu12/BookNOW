const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Venue = require('../models/Venue');
const Review = require('../models/Review');
const City = require('../models/City');
const sendEmail = require('../utils/sendEmail');

exports.getAllUsers = async (req, res) => {
    const { role } = req.query; 
    const query = {};
    if (role && ['user', 'organizer', 'admin'].includes(role)) {
        query.role = role;
    }

    try {
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }
    try {
        const user = await User.findById(userId)
                               .select('-password')
                               .populate('managedVenues', 'name address.city');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.approveOrganizer = async (req, res) => {
    const organizerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
        return res.status(400).json({ msg: 'Invalid Organizer ID format' });
    }
    try {
        const organizer = await User.findOne({ _id: organizerId, role: 'organizer' });
        if (!organizer) {
            return res.status(404).json({ msg: 'Organizer not found or user is not an organizer' });
        }
        if (organizer.isApproved) {
            return res.status(400).json({ msg: 'Organizer is already approved' });
        }
        organizer.isApproved = true;
        await organizer.save();
        const organizerObj = organizer.toObject();
        delete organizerObj.password;
        res.status(200).json({
            msg: 'Organizer approved successfully',
            organizer: organizerObj
        });
    } catch (err) {
        console.error('Error approving organizer:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;
    const { name, role, isApproved, organizationName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const updateFields = {};
        if (name) updateFields.name = name;
        if (role) updateFields.role = role;

        const finalRole = role || user.role;
        
        if (finalRole === 'organizer') {
            if (typeof isApproved === 'boolean') {
                updateFields.isApproved = isApproved;
            }
            if (organizationName) {
                 updateFields.organizationName = organizationName;
            }
        } else {
            updateFields.isApproved = false;
            updateFields.managedVenues = [];
            updateFields.organizationName = undefined;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ msg: 'User updated successfully', user: updatedUser });

    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (req.user.id === userId || user.id === req.user.id) {
            return res.status(400).json({ msg: 'Admin cannot delete their own account.' });
        }
        await user.remove();
        res.status(200).json({ msg: 'User deleted successfully' });
    } catch (err) {
         console.error('Error deleting user:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};






exports.getAllPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
        res.status(200).json(promoCodes);
    } catch (err) {
        console.error('Error fetching promo codes:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.getPromoCodeById = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }
    try {
        const promoCode = await PromoCode.findById(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }
        res.status(200).json(promoCode);
    } catch (err) {
         console.error('Error fetching promo code by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.createPromoCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    
    if (req.body.code) {
        req.body.code = req.body.code.toUpperCase();
    }

    try {
        
        const existingCode = await PromoCode.findOne({ code: req.body.code });
        if (existingCode) {
            return res.status(400).json({ errors: [{ msg: 'Promo code already exists' }]});
        }

        const promoCode = await PromoCode.create(req.body);
        res.status(201).json(promoCode);
    } catch (err) {
        console.error('Error creating promo code:', err.message);
        
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};





exports.updatePromoCode = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }

    
    if (req.body.code) {
        delete req.body.code; 
        
    }
     if (req.body.uses) {
        delete req.body.uses; 
    }


    try {
        const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
            new: true, 
            runValidators: true 
        });

        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }
        res.status(200).json(promoCode);
    } catch (err) {
        console.error('Error updating promo code:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};





exports.deletePromoCode = async (req, res) => {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Promo Code ID format' });
    }
    try {
        const promoCode = await PromoCode.findById(req.params.id);
        if (!promoCode) {
            return res.status(404).json({ msg: 'Promo code not found' });
        }

        
        await promoCode.remove();
        res.status(200).json({ success: true, msg: 'Promo code deleted' });

    } catch (err) {
        console.error('Error deleting promo code:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};



/**
 * @desc    Get all bookings (Admin access, with filters)
 * @route   GET /api/admin/bookings
 * @access  Private (Admin Only)
 */
exports.getAllBookings = async (req, res) => {
    try {
        const { userId, showtimeId, movieId, eventId, venueId, date, status, sort, bookingRefId } = req.query;
        const query = {};

        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.user = userId;
        }
        if (status && ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'].includes(status)) {
            query.status = status;
        }
        if (bookingRefId) {
            query.bookingRefId = bookingRefId.trim().toUpperCase();
        }

        
        
        if (showtimeId && mongoose.Types.ObjectId.isValid(showtimeId)) {
            query.showtime = showtimeId;
        } else {
            
            const showtimeSubQuery = {};
            if (movieId && mongoose.Types.ObjectId.isValid(movieId)) showtimeSubQuery.movie = movieId;
            if (eventId && mongoose.Types.ObjectId.isValid(eventId)) showtimeSubQuery.event = eventId;
            if (venueId && mongoose.Types.ObjectId.isValid(venueId)) showtimeSubQuery.venue = venueId;

            
            if (Object.keys(showtimeSubQuery).length > 0) {
                const relevantShowtimeIds = await Showtime.find(showtimeSubQuery).distinct('_id');
                
                if (relevantShowtimeIds.length === 0) {
                    return res.status(200).json({ success: true, count: 0, total: 0, pagination: {}, data: [] });
                }
                
                query.showtime = { $in: relevantShowtimeIds };
            }
        }

        
        if (date) {
            try {
                const startDate = dayjs(date).startOf('day').toDate();
                const endDate = dayjs(date).endOf('day').toDate();
                query.bookingTime = { $gte: startDate, $lte: endDate };
            } catch (e) {
                console.warn("Invalid date format for booking filter:", date);
            }
        }

        
        let sortOptions = { bookingTime: -1 }; 
        if (sort) {
            
        }

        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        
        const total = await Booking.countDocuments(query);

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'showtime', 
                select: 'startTime movie event venue screenName', 
                populate: [
                    {
                        path: 'venue', 
                        select: 'name'
                    },
                    {
                        path: 'movie', 
                        select: 'title'
                    },
                    {
                        path: 'event', 
                        select: 'title'
                    }
                ]
            })
            .populate('promoCodeApplied', 'code')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean(); 

        
        const pagination = {};
        if ((startIndex + limit) < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        
        res.status(200).json({ success: true, count: bookings.length, total, pagination, data: bookings });

    } catch (err) {
        console.error('Error fetching all bookings (Admin):', err);
        
        if (err.name === 'StrictPopulateError') {
            console.error('StrictPopulateError Path:', err.path);
        }
        res.status(500).json({ msg: 'Server error fetching bookings', error: err.message });
    }
};






exports.getBookingByIdAdmin = async (req, res) => {
    const bookingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    try {
        const booking = await Booking.findById(bookingId)
            .populate('user', 'name email role')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration' },
                    { path: 'event', select: 'title imageUrl' },
                    { 
                        path: 'venue', 
                        select: 'name address',
                        populate: { path: 'organizer', select: 'name organizationName' }
                    }
                ]
            })
            .populate('promoCodeApplied')
            .populate('checkedInBy', 'name email');

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        res.status(200).json(booking);

    } catch (err) {
        console.error('Error fetching booking by ID (Admin):', err);
        res.status(500).json({ msg: 'Server error fetching booking details', error: err.message });
    }
};







exports.getPlatformStats = async (req, res) => {
    try {
        
        const [
            totalUsers,
            totalOrganizers,
            approvedOrganizers,
            totalMovies,
            totalActiveVenues,
            totalUpcomingEvents,
            totalUpcomingShowtimes,
            totalBookings,
            confirmedBookings,
            totalPromoCodes,
            activePromoCodes,
            revenueData 
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'organizer' }),
            User.countDocuments({ role: 'organizer', isApproved: true }),
            Movie.countDocuments(),
            Venue.countDocuments({ isActive: true }),
            Event.countDocuments({ status: 'Scheduled', startDate: { $gte: new Date() } }),
            Showtime.countDocuments({ isActive: true, startTime: { $gte: new Date() } }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Confirmed' }),
            PromoCode.countDocuments(),
            PromoCode.countDocuments({ isActive: true }),
            
            Booking.aggregate([
                { $match: { status: 'Confirmed' } }, 
                { $group: {
                    _id: null, 
                    totalRevenue: { $sum: '$totalAmount' } 
                 }}
            ])
        ]);

        
        const simulatedTotalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    organizers: totalOrganizers,
                    approvedOrganizers: approvedOrganizers,
                    regularUsers: totalUsers - totalOrganizers 
                },
                content: {
                    movies: totalMovies,
                    activeVenues: totalActiveVenues,
                    upcomingEvents: totalUpcomingEvents,
                    upcomingShowtimes: totalUpcomingShowtimes
                },
                bookings: {
                    total: totalBookings,
                    confirmed: confirmedBookings
                    
                },
                promoCodes: {
                    total: totalPromoCodes,
                    active: activePromoCodes
                },
                financials: { 
                    simulatedTotalRevenue: simulatedTotalRevenue.toFixed(2) 
                }
            }
        });

    } catch (err) {
        console.error('Error fetching platform stats (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};






exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const { userId, movieId, rating, sort } = req.query;
        const query = {};

        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) query.user = userId;
        if (movieId && mongoose.Types.ObjectId.isValid(movieId)) query.movie = movieId;
        if (rating) {
            const numericRating = parseInt(rating, 10);
            if (!isNaN(numericRating) && numericRating >= 1 && numericRating <= 5) { 
                query.rating = numericRating;
            }
        }

        
        let sortOptions = { createdAt: -1 }; 
        if (sort) {
            switch (sort) {
                case 'createdAt_asc': sortOptions = { createdAt: 1 }; break;
                case 'rating_desc': sortOptions = { rating: -1, createdAt: -1 }; break;
                case 'rating_asc': sortOptions = { rating: 1, createdAt: -1 }; break;
                
            }
        }

        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        
        const total = await Review.countDocuments(query);

        
        const reviews = await Review.find(query)
            .populate('user', 'name email') 
            .populate('movie', 'title') 
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

        
        const pagination = {};
        if (endIndex < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: reviews.length, total, pagination, data: reviews });

    } catch (err) {
        console.error('Error fetching all reviews (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getReportedReviewsAdmin = async (req, res) => {
    try {
        
        const reportedReviews = await Review.find({ 'reports.status': 'pending' })
            .populate('user', 'name email') 
            .populate('movie', 'title') 
            .populate('reports.user', 'name email') 
            .sort({ createdAt: -1 });

        res.status(200).json(reportedReviews);
    } catch (err) {
        console.error('Error fetching reported reviews (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.resolveReportedReviewAdmin = async (req, res) => {
    const { reviewId } = req.params;
    const { action } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    if (!['delete', 'dismiss'].includes(action)) {
        return res.status(400).json({ msg: "Invalid action. Must be 'delete' or 'dismiss'." });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        if (action === 'delete') {
            
            await review.remove();
            res.status(200).json({ success: true, msg: 'Review deleted successfully.' });
        } else if (action === 'dismiss') {
            
            await Review.updateOne(
                { _id: reviewId, 'reports.status': 'pending' },
                { $set: { 'reports.$[].status': 'resolved' } }
            );
            res.status(200).json({ success: true, msg: 'Reports dismissed successfully.' });
        }
    } catch (err) {
        console.error(`Error resolving report for review ${reviewId}:`, err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};






exports.getAllCitiesAdmin = async (req, res) => {
    try {
        
        const cities = await City.find().sort({ state: 1, name: 1 }); 
        res.status(200).json(cities);
    } catch (err) {
        console.error('Error fetching cities (Admin):', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.createCity = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, state, isActive } = req.body;

    try {
        
        let city = await City.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (city) {
            return res.status(400).json({ errors: [{ msg: 'City already exists' }]});
        }

        city = await City.create({ name, state, isActive });
        res.status(201).json(city);
    } catch (err) {
        console.error('Error creating city:', err.message);
        if (err.code === 11000) { return res.status(400).json({ errors: [{ msg: 'City already exists (duplicate key).' }]});}
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};




exports.updateCity = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid City ID format' });
    }

    const { name, state, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name; 
    if (state) updateData.state = state;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    try {
        

        const city = await City.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!city) {
            return res.status(404).json({ msg: 'City not found' });
        }
        res.status(200).json(city);
    } catch (err) {
        console.error('Error updating city:', err.message);
         if (err.code === 11000) { return res.status(400).json({ errors: [{ msg: 'Another city with this name already exists.' }]});}
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};




exports.deleteCity = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid City ID format' });
    }
    try {
        
        
        
        const city = await City.findByIdAndDelete(req.params.id);
        
        if (!city) {
            return res.status(404).json({ msg: 'City not found' });
        }

        
        

        res.status(200).json({ success: true, msg: 'City deleted successfully' });

    } catch (err) {
        console.error('Error deleting city:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};








exports.cancelAnyBookingAdmin = async (req, res) => {
    const bookingId = req.params.id;
    const adminUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    const mongoSession = await mongoose.startSession(); 

    try {
        mongoSession.startTransaction();

        const bookingToCancel = await Booking.findById(bookingId)
            
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie event venue seats', 
            })
            .session(mongoSession)
            .lean(); 

        if (!bookingToCancel) {
            await mongoSession.abortTransaction(); mongoSession.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (bookingToCancel.status === 'Cancelled') {
            await mongoSession.abortTransaction(); mongoSession.endSession();
            return res.status(400).json({ msg: `Booking is already Cancelled` });
        }

        const originalStatus = bookingToCancel.status;

        
        await Booking.updateOne(
            { _id: bookingId },
            { $set: { status: 'Cancelled' } },
            { session: mongoSession }
        );


        if ((originalStatus === 'Confirmed' || originalStatus === 'PaymentPending' || originalStatus === 'CheckedIn') && bookingToCancel.showtime && bookingToCancel.seats) {
            console.log(`[Admin Cancel] Releasing seats ${bookingToCancel.seats.join(', ')} for booking ${bookingId} from showtime ${bookingToCancel.showtime._id}.`);
            const showtimeUpdateResult = await Showtime.updateOne(
                { _id: bookingToCancel.showtime._id },
                { $pullAll: { bookedSeats: bookingToCancel.seats } },
                { session: mongoSession }
            );
            if (showtimeUpdateResult.modifiedCount === 0 && bookingToCancel.seats.length > 0) {
                console.warn(`[Admin Cancel] Showtime ${bookingToCancel.showtime._id} seat release might not have modified (modifiedCount: 0).`);
            }
        } else {
            console.log(`[Admin Cancel] Booking ${bookingId} status was ${originalStatus}, seats not explicitly released again or showtime/seats info missing.`);
        }

        await mongoSession.commitTransaction();
        mongoSession.endSession();

        
        const finalBookingDetails = await Booking.findById(bookingId)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                select: 'startTime movie event venue screenName',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name' }
                ]
            }).lean();


        if (finalBookingDetails?.user?.email) {
            const subject = `Your BookNOW Booking (Ref: ${finalBookingDetails.bookingRefId || finalBookingDetails._id.toString().slice(-6)}) Has Been Cancelled`;
            const itemTitle = finalBookingDetails.showtime?.movie?.title || finalBookingDetails.showtime?.event?.title || "the scheduled item";
            const showtimeDateTime = finalBookingDetails.showtime?.startTime ? dayjs(finalBookingDetails.showtime.startTime).format('DD MMM YY, hh:mm A') : "N/A";
            const message = `
                 <p>Hi ${finalBookingDetails.user.name},</p>
                 <p>This email is to inform you that your BookNOW booking (Ref ID: <strong>${finalBookingDetails.bookingRefId || finalBookingDetails._id.toString().slice(-6)}</strong>) for ${itemTitle} originally scheduled for ${showtimeDateTime} has been cancelled by administration.</p>
                 <p>If applicable, any refunds will be processed according to our policy. Please allow a few business days for this to reflect in your account.</p>
                 <p>If you have questions, please contact our support team.</p>
                 <p>Sincerely,<br/>The BookNOW Team</p>`;
            try {
              await sendEmail({ to: finalBookingDetails.user.email, subject: subject, html: message });
              console.log(`[Admin Cancel] Cancellation notification sent to ${finalBookingDetails.user.email}`);
            } catch (emailError) {
              console.error(`[Admin Cancel] Failed to send cancellation email for ${bookingId}: ${emailError.message}`);
            }
        }

        res.status(200).json({ success: true, msg: 'Booking cancelled successfully by admin', booking: finalBookingDetails });

    } catch (err) {
        console.error('Error cancelling booking (Admin):', err);
        if (mongoSession.inTransaction()) {
            await mongoSession.abortTransaction();
        }
        mongoSession.endSession();
        res.status(500).json({ msg: `Server error: ${err.message}`, path: err.path });
    }
};