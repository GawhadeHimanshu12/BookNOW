const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User'); 
const PromoCode = require('../models/PromoCode');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail'); 
const dayjs = require('dayjs');
const { customAlphabet } = require('nanoid');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateBookingRefId = customAlphabet(ALPHABET, 6); 

exports.createBooking = async (req, res) => {
    
    
    

    const { showtimeId, seats, promoCode: promoCodeString } = req.body;
    const userId = req.user.id;

    if (!seats || seats.length === 0) {
        return res.status(400).json({ errors: [{ msg: 'Please select at least one seat' }] });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        console.log(`[createBooking - Tiered] Transaction started for showtime ${showtimeId}`);

        const showtime = await Showtime.findById(showtimeId).populate('venue').session(session); 

        if (!showtime) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ msg: 'Showtime not found' });
        }
        if (!showtime.isActive) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'This showtime is no longer active' });
        }
        if (!showtime.priceTiers || showtime.priceTiers.length === 0) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'Pricing information not available for this showtime.' });
        }
        if (!showtime.venue || !showtime.venue.screens) { 
            await session.abortTransaction(); session.endSession();
            return res.status(500).json({ msg: 'Venue or screen details missing for showtime.' });
        }

        
        const updatedShowtimeSeats = await Showtime.findOneAndUpdate(
            { _id: showtimeId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
            { $addToSet: { bookedSeats: { $each: seats } } },
            { new: true, session: session }
        );
        if (!updatedShowtimeSeats) {
            await session.abortTransaction(); session.endSession();
            const currentShowForError = await Showtime.findById(showtimeId).select('bookedSeats');
            const alreadyBookedForError = seats.filter(seat => currentShowForError?.bookedSeats.includes(seat));
            return res.status(409).json({ msg: `Seats [${alreadyBookedForError.join(', ')}] are already booked. Please select different seats.` });
        }
        console.log(`[createBooking - Tiered] Seats [${seats.join(', ')}] successfully reserved.`);


        
        let calculatedOriginalAmount = 0;
        const screenForLayout = showtime.venue.screens.id(showtime.screenId);
        if (!screenForLayout || !screenForLayout.seatLayout || !screenForLayout.seatLayout.rows) {
            await session.abortTransaction(); session.endSession();
            return res.status(500).json({ msg: 'Screen layout not found for price calculation.' });
        }

        for (const seatIdentifier of seats) {
            let seatType = 'Normal'; 
            let seatPrice = 0;
            let foundSeatInLayout = false;

            for (const row of screenForLayout.seatLayout.rows) {
                const seatInRow = row.seats.find(s => `${row.rowId}${s.seatNumber}` === seatIdentifier);
                if (seatInRow) {
                    seatType = seatInRow.type || 'Normal';
                    foundSeatInLayout = true;
                    break;
                }
            }
            if (!foundSeatInLayout) {
                 console.warn(`[createBooking - Tiered] Seat ${seatIdentifier} not found in layout for price calc. Assuming default price.`);
                
            }

            const priceTier = showtime.priceTiers.find(pt => pt.seatType === seatType);
            if (priceTier) {
                seatPrice = priceTier.price;
            } else {
                
                const normalTier = showtime.priceTiers.find(pt => pt.seatType === 'Normal');
                seatPrice = normalTier ? normalTier.price : 0; 
                console.warn(`[createBooking - Tiered] Price tier for type '${seatType}' not found for seat ${seatIdentifier}. Used fallback/default price: ${seatPrice}`);
            }
            calculatedOriginalAmount += seatPrice;
        }
        console.log(`[createBooking - Tiered] Calculated Original Amount: ${calculatedOriginalAmount}`);
        


        let finalAmount = calculatedOriginalAmount;
        let discountAmount = 0;
        let appliedPromoCodeDoc = null;

        if (promoCodeString) {
            const promoCodeDoc = await PromoCode.findOne({ code: promoCodeString.trim().toUpperCase(), isActive: true }).session(session);
            if (promoCodeDoc && promoCodeDoc.isValid()) {
                const calculatedDiscount = promoCodeDoc.calculateDiscount(calculatedOriginalAmount); 
                if (calculatedDiscount > 0) {
                    discountAmount = calculatedDiscount;
                    finalAmount = calculatedOriginalAmount - discountAmount;
                    appliedPromoCodeDoc = promoCodeDoc;
                } else if (calculatedOriginalAmount < promoCodeDoc.minPurchaseAmount) {
                    await session.abortTransaction(); session.endSession();
                    return res.status(400).json({ errors: [{ msg: `Minimum purchase amount of Rs. ${promoCodeDoc.minPurchaseAmount} not met for code ${promoCodeString}` }]});
                }
            } else if (promoCodeDoc) { /* code found but not valid */
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ errors: [{ msg: 'Promo code is expired or usage limit reached' }]});
            } else { /* code not found or inactive */
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ errors: [{ msg: 'Invalid or inactive promo code' }]});
            }
        }
        finalAmount = Math.max(finalAmount, 0); 

        
        let bookingRefIdGenerated;
        
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        while (!bookingRefIdGenerated && attempts < MAX_ATTEMPTS) {
            const potentialId = generateBookingRefId();
            const existing = await Booking.findOne({ bookingRefId: potentialId }).select('_id').session(session);
            if (!existing) bookingRefIdGenerated = potentialId;
            attempts++;
        }
        if (!bookingRefIdGenerated) {
            await session.abortTransaction(); session.endSession();
            throw new Error('Failed to generate unique booking reference ID.');
        }


        const newBooking = new Booking({
            bookingRefId: bookingRefIdGenerated,
            user: userId,
            showtime: showtimeId,
            seats: seats,
            originalAmount: calculatedOriginalAmount, 
            totalAmount: finalAmount,
            discountAmount: discountAmount,
            promoCodeApplied: appliedPromoCodeDoc ? appliedPromoCodeDoc._id : null,
            status: 'Confirmed', 
            paymentId: `SIM_PAY_TIERED_${Date.now()}`,
        });
        const booking = await newBooking.save({ session: session });

        if (appliedPromoCodeDoc) {
            await PromoCode.updateOne(
                 { _id: appliedPromoCodeDoc._id },
                 { $inc: { uses: 1 } },
                 { session: session }
            );
        }

        await session.commitTransaction();
        console.log(`[createBooking - Tiered] Transaction committed for booking ${booking.bookingRefId}`);

        
        const confirmedBookingForEmail = await Booking.findById(booking._id)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title' }, { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name address' }
                ]
            });
        if (confirmedBookingForEmail?.user?.email) { /* ... send email ... */ }


        
        const populatedApiResponse = await Booking.findById(booking._id)
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [ 
                    { path: 'movie', select: 'title posterUrl' }, 
                    { path: 'event', select: 'title' },
                    { path: 'venue', select: 'name address' } 
                ]
            }).populate('promoCodeApplied', 'code');
            
        res.status(201).json(populatedApiResponse);

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('[createBooking - Tiered] Error:', err);
        
        if (updatedShowtimeSeats) { 
            try {
                await Showtime.findByIdAndUpdate(showtimeId, { $pullAll: { bookedSeats: seats } });
                console.log(`[createBooking - Tiered] Seats [${seats.join(', ')}] rolled back due to error.`);
            } catch (rollbackError) {
                console.error(`[createBooking - Tiered] Failed to rollback seats for showtime ${showtimeId}:`, rollbackError);
            }
        }
        res.status(err.status || 500).json({ msg: err.message || 'Server error during booking.', errors: err.errors });
    } finally {
        if(session) session.endSession();
    }
};









exports.getMyBookings = async (req, res) => {
    const userId = req.user.id;

    try {
        const bookings = await Booking.find({ user: userId })
            .populate({
                path: 'showtime',
                populate: [ 
                    { path: 'movie', select: 'title posterUrl duration releaseDate' },
                    { path: 'venue', select: 'name address' }
                ],
                select: 'startTime screenName' 
            })
            .sort({ bookingTime: -1 }); 

        if (!bookings) {
            return res.status(200).json([]); 
        }

        res.status(200).json(bookings);

    } catch (err) {
        console.error('Error fetching user bookings:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getBookingById = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(404).json({ msg: 'Booking not found (Invalid ID format)' });
        }

        const booking = await Booking.findById(bookingId)
             .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title posterUrl duration language genre censorRating' },
                    { path: 'venue', select: 'name address facilities' }
                ]
            }).populate('user', 'name email'); 

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        
        if (booking.user._id.toString() !== userId) {
            
             return res.status(403).json({ msg: 'User not authorized to view this booking' });
        }

        res.status(200).json(booking);

    } catch (err) {
        console.error('Error fetching booking by ID:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const session = await mongoose.startSession(); 

    try {
        session.startTransaction();

        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        
        if (booking.user.toString() !== userId) {
            await session.abortTransaction(); session.endSession();
            return res.status(403).json({ msg: 'User not authorized to cancel this booking' });
        }

        
        if (booking.status === 'Cancelled' || booking.status === 'CheckedIn') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: `Booking is already ${booking.status}` });
        }
        
        const showtime = await Showtime.findById(booking.showtime).session(session);
        if (new Date(showtime.startTime).getTime() - Date.now() < (2 * 60 * 60 * 1000)) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'Cannot cancel booking close to showtime' });
        }


        
        booking.status = 'Cancelled';
        await booking.save({ session: session });

        
        const updatedShowtime = await Showtime.findByIdAndUpdate(
            booking.showtime,
            { $pull: { bookedSeats: { $in: booking.seats } } }, 
            { new: true, session: session }
        );

        if(!updatedShowtime) {
             
             throw new Error('Failed to update showtime seats during cancellation.');
        }

        
        console.log(`Simulating refund process for booking ${bookingId}...`);

        
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ msg: 'Booking cancelled successfully', booking });

    } catch (err) {
        console.error('Error cancelling booking:', err.message);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};































































































































exports.validateBookingQR = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { bookingRefId } = req.body; 
    const staffUserId = req.user.id;
    const staffUserRole = req.user.role;

    if (!bookingRefId || bookingRefId.length !== 6) {
        return res.status(400).json({ msg: 'Invalid Booking Reference ID format' });
    }
    console.log(`[validateBookingQR] Received request for bookingRefId: ${bookingRefId}`);

    try {
        console.log(`[validateBookingQR] Finding booking by RefID: ${bookingRefId}`);
        const booking = await Booking.findOne({ bookingRefId: bookingRefId.toUpperCase() }) 
            .populate({ path: 'showtime', select: 'venue startTime movie event screenName', populate: { path: 'movie', select: 'title' } })
            .populate('user', 'name email');

        if (!booking) {
            console.log(`[validateBookingQR] Booking with RefID ${bookingRefId} not found.`);
            return res.status(404).json({ msg: 'Booking reference not found' });
        }
        
         let isAuthorized = false; if (staffUserRole === 'admin') { isAuthorized = true; } else if (staffUserRole === 'organizer' && booking.showtime?.venue) { const venue = await Venue.findById(booking.showtime.venue).select('organizer'); const organizer = await User.findById(staffUserId).select('isApproved'); if (venue && organizer && venue.organizer.toString() === staffUserId && organizer.isApproved) { isAuthorized = true; } } if (!isAuthorized) { return res.status(403).json({ msg: 'Not authorized to validate bookings for this venue' }); } if (booking.status === 'CheckedIn') { return res.status(409).json({ msg: `Booking already checked in at ${booking.checkInTime?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) || 'N/A'}` }); } if (booking.status !== 'Confirmed') { return res.status(400).json({ msg: `Booking status is '${booking.status}', cannot check in.` }); } booking.isCheckedIn = true; booking.checkInTime = new Date(); booking.checkedInBy = staffUserId; booking.status = 'CheckedIn'; await booking.save(); res.status(200).json({ success: true, message: 'Check-in Successful!', bookingDetails: { bookingRefId: booking.bookingRefId, userName: booking.user.name, movieTitle: booking.showtime?.movie?.title || booking.showtime?.event?.title || 'N/A', showtime: booking.showtime?.startTime ? dayjs(booking.showtime.startTime).format('DD MMM, h:mm A') : 'N/A', screenName: booking.showtime?.screenName || 'N/A', seats: booking.seats, checkInTime: booking.checkInTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) } });

    } catch (err) {
        console.error('[validateBookingQR] Error:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

