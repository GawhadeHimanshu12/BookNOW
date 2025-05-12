const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const dayjs = require('dayjs');


const checkVenueAccess = async (venueId, userId, userRole, session) => {
    const venueQuery = Venue.findById(venueId);
    if (session) venueQuery.session(session);
    const venue = await venueQuery;

    if (!venue) return { authorized: false, error: 'Venue not found for access check.', status: 404 };
    if (userRole === 'admin' || venue.organizer.toString() === userId) {
        return { authorized: true, venue };
    }
    return { authorized: false, error: 'User not authorized to manage this venue.', status: 403 };
};


































































exports.getShowtimes = async (req, res) => {
    const { movieId, eventId, venueId, date, sort } = req.query;
    console.log('[getShowtimes] Received query params:', req.query); 

    const query = { isActive: true };
    if (movieId) { /* validation */ query.movie = movieId; }
    if (eventId) { /* validation */ query.event = eventId; }
    if (venueId) { /* validation */ query.venue = venueId; }

    if (date) {
        console.log(`[getShowtimes] Processing date filter for: ${date}`); 
        try {
            const dateStringForConstructor = `${date}T00:00:00.000Z`;
            console.log(`[getShowtimes] Date string for constructor: ${dateStringForConstructor}`); 
            const startDate = new Date(dateStringForConstructor);
            
            console.log(`[getShowtimes] Constructed startDate object:`, startDate);
            console.log(`[getShowtimes] Is startDate valid (isNaN check)? ${isNaN(startDate.getTime())}`);
            

            
            if (isNaN(startDate.getTime())) {
                 throw new Error(`Constructed date object is invalid from input: ${date}`);
            }

            const endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 1);
            query.startTime = { $gte: startDate, $lt: endDate };

        } catch (e) {
             console.error(`[getShowtimes] Error processing date '${date}':`, e.message); 
             return res.status(400).json({ msg: `Invalid date format or processing error for ${date}. Use YYYY-MM-DD.` });
        }
    } else {
         query.startTime = { $gte: new Date() };
         console.log('[getShowtimes] No date provided, filtering for future shows from:', query.startTime.$gte);
    }

    
    
    try {
         let sortOptions = { startTime: 1 };
         
         const page = parseInt(req.query.page, 10) || 1;
         const limit = parseInt(req.query.limit, 10) || 20;
         const startIndex = (page - 1) * limit;
         const endIndex = page * limit;
         const total = await Showtime.countDocuments(query);

         console.log(`[getShowtimes] Executing DB query with query: ${JSON.stringify(query)}, sort: ${JSON.stringify(sortOptions)}`); 
         const showtimes = await Showtime.find(query)
            .populate('movie', 'title duration posterUrl averageRating')
           
            .populate('venue', 'name address.city')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

          
          const pagination = {};
          if (endIndex < total) pagination.next = { page: page + 1, limit };
          if (startIndex > 0) pagination.prev = { page: page - 1, limit };
          res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: showtimes });

    } catch (err) {
         console.error('[getShowtimes] Error executing Showtime query:', err); 
         res.status(500).json({ msg: 'Server error during showtime query' });
    }
};






































exports.getShowtimeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
        }
        
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie', 'title posterUrl duration description movieLanguage genre cast censorRating format')
            .populate('event', 'title category startDate imageUrl')
            .populate({ 
                path: 'venue',
                select: 'name address screens facilities', 
                populate: { path: 'organizer', select: 'organizationName name' }
             });

        if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });
        
        console.log("[getShowtimeById] Fetched Showtime with priceTiers:", showtime.priceTiers);
        res.status(200).json(showtime);
    } catch (err) {
        console.error('Error fetching showtime by ID:', err.message);
        res.status(500).json({ msg: 'Server error fetching showtime', error: err.message });
    }
};



































































        

































































































































































        






























































exports.createShowtime = async (req, res) => {
    console.log('[createShowtime] Received request body:', req.body);
    const {
        movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId,
        startTime, priceTiers: rawPriceTiers, isActive
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log('[createShowtime] Transaction started.');

        const venueAccess = await checkVenueAccess(venueId, userId, userRole, session);
        if (!venueAccess.authorized) {
            await session.abortTransaction();
            return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
        }
        const targetVenue = venueAccess.venue;
        if (!targetVenue || !targetVenue.screens || targetVenue.screens.length === 0) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Venue not found or has no screens.' });
        }
        const targetScreen = targetVenue.screens.id(screenId);
        if (!targetScreen) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Screen not found.' });
        }
        console.log(`[createShowtime] Found Screen: ${targetScreen.name} with capacity ${targetScreen.capacity}`);

        let calculatedEndTime;
        const parsedStartTime = dayjs(startTime).toDate();
        const startTimeMs = dayjs(startTime).valueOf();
        const bufferMs = 15 * 60 * 1000;
        let movieRefForShowtime = undefined;
        let eventRefForShowtime = undefined;

        if (movieIdFromReq) {
            const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
            if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
                await session.abortTransaction();
                return res.status(400).json({ msg: `Movie not found or has invalid duration.` });
            }
            calculatedEndTime = new Date(startTimeMs + (targetMovie.duration * 60000) + bufferMs);
            movieRefForShowtime = movieIdFromReq;
            console.log(`[createShowtime] Movie: ${targetMovie.title}, EndTime: ${calculatedEndTime}`);
        } else if (eventIdFromReq) {
            const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
            if (!targetEvent) {
                await session.abortTransaction(); return res.status(404).json({ msg: `Event not found.` });
            }
            calculatedEndTime = targetEvent.endDate ? dayjs(targetEvent.endDate).toDate() : new Date(startTimeMs + (120 * 60000) + bufferMs);
            eventRefForShowtime = eventIdFromReq;
            console.log(`[createShowtime] Event: ${targetEvent.title}, EndTime: ${calculatedEndTime}`);
        }
        if (!calculatedEndTime && (movieIdFromReq || eventIdFromReq)) {
            await session.abortTransaction(); return res.status(500).json({ msg: 'Internal error: Could not determine endTime.' });
        }

        const newShowtimeData = {
            movie: movieRefForShowtime, event: eventRefForShowtime, venue: venueId, screenId,
            screenName: targetScreen.name, startTime: parsedStartTime, endTime: calculatedEndTime,
            totalSeats: targetScreen.capacity, priceTiers: rawPriceTiers, 
            bookedSeats: [], isActive: isActive !== undefined ? isActive : true,
        };
        console.log('[createShowtime] Prepared newShowtimeData for model:', newShowtimeData);

        const existingShowtime = await Showtime.findOne({
            venue: venueId, screenId: screenId,
            $or: [{ startTime: { $lt: newShowtimeData.endTime }, endTime: { $gt: newShowtimeData.startTime } }]
        }).session(session);
        if (existingShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: `This showtime overlaps with an existing showtime on screen "${targetScreen.name}".` });
        }
        console.log('[createShowtime] No overlap detected.');

        const showtime = new Showtime(newShowtimeData);
        await showtime.save({ session: session });
        console.log('[createShowtime] Showtime saved successfully with ID:', showtime._id);

        await session.commitTransaction();
        console.log('[createShowtime] Transaction committed.');

        let query = Showtime.findById(showtime._id).populate('venue', 'name');
        if (showtime.movie) query = query.populate('movie', 'title duration');
        else if (showtime.event) query = query.populate('event', 'title');
        const populatedShowtimeResponse = await query.exec();

        if (!populatedShowtimeResponse) return res.status(404).json({ msg: "Showtime created but couldn't be retrieved." });
        res.status(201).json(populatedShowtimeResponse);
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('[createShowtime] Error caught:', err);
        if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        res.status(500).json({ msg: 'Server error creating showtime', error: err.message, path: err.path });
    } finally {
        if (session) await session.endSession();
        console.log('[createShowtime] Session ended.');
    }
};



























































exports.updateShowtime = async (req, res) => {
    const showtimeId = req.params.id;
    const { 
        movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId, 
        startTime, priceTiers: rawPriceTiers, isActive 
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log(`[updateShowtime] Transaction started for ${showtimeId}`);

        const showtimeToUpdate = await Showtime.findById(showtimeId).session(session);
        if (!showtimeToUpdate) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Showtime not found' });
        }

        const venueAccess = await checkVenueAccess(showtimeToUpdate.venue.toString(), userId, userRole, session);
        if (!venueAccess.authorized) {
            await session.abortTransaction(); return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
        }
        
        const updateFields = {};
        let requiresRecalculation = false;
        let newTargetScreen = null;
        let newTargetVenue = null;

        
        if (venueId && venueId !== showtimeToUpdate.venue.toString()) {
            const newVenueAccessCheck = await checkVenueAccess(venueId, userId, userRole, session); 
            if (!newVenueAccessCheck.authorized) {
                await session.abortTransaction(); return res.status(newVenueAccessCheck.status || 403).json({ msg: newVenueAccessCheck.error });
            }
            newTargetVenue = newVenueAccessCheck.venue;
            updateFields.venue = venueId;
            requiresRecalculation = true; 
            
            if (!screenId) { await session.abortTransaction(); return res.status(400).json({msg: "ScreenId is required when changing venue."}); }
        }
        const currentVenueForScreen = newTargetVenue || venueAccess.venue; 

        if (screenId && screenId !== showtimeToUpdate.screenId.toString()) {
            if (!currentVenueForScreen || !currentVenueForScreen.screens) {
                 await session.abortTransaction(); return res.status(404).json({ msg: 'Venue details for screen selection not found.' });
            }
            newTargetScreen = currentVenueForScreen.screens.id(screenId);
            if (!newTargetScreen) {
                await session.abortTransaction(); return res.status(404).json({ msg: 'New screen not found in the specified venue.' });
            }
            updateFields.screenId = screenId;
            updateFields.screenName = newTargetScreen.name;
            updateFields.totalSeats = newTargetScreen.capacity;
            requiresRecalculation = true;
        }

        
        const finalTargetScreen = newTargetScreen || currentVenueForScreen.screens.id(showtimeToUpdate.screenId);


        if (movieIdFromReq && movieIdFromReq !== showtimeToUpdate.movie?.toString()) {
            const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
            if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
                await session.abortTransaction(); return res.status(400).json({ msg: 'New movie not found or has invalid duration.' });
            }
            updateFields.movie = movieIdFromReq;
            updateFields.event = null; 
            showtimeToUpdate.movie = targetMovie; 
            showtimeToUpdate.event = null;
            requiresRecalculation = true;
        } else if (movieIdFromReq === null && showtimeToUpdate.movie) { 
            updateFields.movie = null;
            requiresRecalculation = true;
        }
        
        if (eventIdFromReq && eventIdFromReq !== showtimeToUpdate.event?.toString()) {
            const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
            if (!targetEvent) { await session.abortTransaction(); return res.status(404).json({ msg: `New event not found.` });}
            updateFields.event = eventIdFromReq;
            updateFields.movie = null;
            showtimeToUpdate.event = targetEvent;
            showtimeToUpdate.movie = null;
            requiresRecalculation = true;
        } else if (eventIdFromReq === null && showtimeToUpdate.event) { 
            updateFields.event = null;
            requiresRecalculation = true;
        }


        if (startTime) {
            updateFields.startTime = dayjs(startTime).toDate();
            requiresRecalculation = true;
        }
        if (rawPriceTiers) updateFields.priceTiers = rawPriceTiers; 
        if (isActive !== undefined) updateFields.isActive = isActive;


        if (requiresRecalculation) {
            const currentStartTime = updateFields.startTime || showtimeToUpdate.startTime;
            const currentStartTimeMs = dayjs(currentStartTime).valueOf();
            const bufferMs = 15 * 60 * 1000;
            
            
            const itemForDuration = updateFields.movie ? await Movie.findById(updateFields.movie).select('duration').session(session) : 
                                    (updateFields.event === null && showtimeToUpdate.movie && !movieIdFromReq) ? await Movie.findById(showtimeToUpdate.movie).select('duration').session(session) : null; 
            const eventForDuration = updateFields.event ? await Event.findById(updateFields.event).select('endDate').session(session) :
                                     (updateFields.movie === null && showtimeToUpdate.event && !eventIdFromReq) ? await Event.findById(showtimeToUpdate.event).select('endDate').session(session) : null;


            if (itemForDuration && typeof itemForDuration.duration === 'number') {
                updateFields.endTime = new Date(currentStartTimeMs + (itemForDuration.duration * 60000) + bufferMs);
            } else if (eventForDuration) {
                updateFields.endTime = eventForDuration.endDate ? dayjs(eventForDuration.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
            } else if ((updateFields.movie===null && !updateFields.event && !showtimeToUpdate.event) || (updateFields.event===null && !updateFields.movie && !showtimeToUpdate.movie)) {
                
                 await session.abortTransaction(); return res.status(400).json({ msg: 'Showtime must be linked to a movie or an event after update.' });
            } else {
                
                const fallbackMovie = showtimeToUpdate.movie && !updateFields.event ? await Movie.findById(showtimeToUpdate.movie._id).select('duration').session(session) : null;
                const fallbackEvent = showtimeToUpdate.event && !updateFields.movie ? await Event.findById(showtimeToUpdate.event._id).select('endDate').session(session) : null;
                if (fallbackMovie && typeof fallbackMovie.duration === 'number') {
                     updateFields.endTime = new Date(currentStartTimeMs + (fallbackMovie.duration * 60000) + bufferMs);
                } else if (fallbackEvent) {
                     updateFields.endTime = fallbackEvent.endDate ? dayjs(fallbackEvent.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
                } else {
                     console.warn("[updateShowtime] Could not reliably recalculate endTime. Check item linkage.");
                     
                     if(!updateFields.startTime) updateFields.endTime = showtimeToUpdate.endTime;
                     else { await session.abortTransaction(); return res.status(400).json({msg: "Could not determine endTime after update."})}
                }
            }
        }
        
        
        const checkStartTime = updateFields.startTime || showtimeToUpdate.startTime;
        const checkEndTime = updateFields.endTime || showtimeToUpdate.endTime;
        const checkVenue = updateFields.venue || showtimeToUpdate.venue.toString();
        const checkScreen = updateFields.screenId || showtimeToUpdate.screenId.toString();

        const existingOverlap = await Showtime.findOne({
            _id: { $ne: showtimeId }, 
            venue: checkVenue, screenId: checkScreen,
            $or: [ { startTime: { $lt: checkEndTime }, endTime: { $gt: checkStartTime } } ]
        }).session(session);
        if (existingOverlap) {
            await session.abortTransaction(); return res.status(409).json({ msg: 'Updated showtime overlaps with another showtime.' });
        }

        const updatedShowtime = await Showtime.findByIdAndUpdate(showtimeId, { $set: updateFields }, { new: true, runValidators: true, session: session });
        if (!updatedShowtime) { await session.abortTransaction(); return res.status(404).json({ msg: "Showtime update failed or showtime not found." });}
        
        await session.commitTransaction();
        console.log(`[updateShowtime] Transaction committed for ${showtimeId}`);

        let popQuery = Showtime.findById(updatedShowtime._id).populate('venue', 'name');
        if (updatedShowtime.movie) popQuery = popQuery.populate('movie', 'title duration');
        else if (updatedShowtime.event) popQuery = popQuery.populate('event', 'title');
        const populatedResponse = await popQuery.exec();

        res.status(200).json(populatedResponse || updatedShowtime);

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error(`Error updating showtime ${showtimeId}:`, err);
        if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        res.status(500).json({ msg: `Server error updating showtime: ${err.message}` });
    } finally {
        if(session) await session.endSession();
        console.log(`[updateShowtime] Session ended for ${showtimeId}`);
    }
};





















































exports.deleteShowtime = async (req, res) => { /* ... existing code ... */ };


exports.getShowtimeSeatmap = async (req, res) => { /* ... existing code ... */ };


exports.getShowtimes = async (req, res) => {
    const { movieId, eventId, venueId, date, sort } = req.query;
    const query = { isActive: true };
    if (movieId) query.movie = movieId;
    if (eventId) query.event = eventId;
    if (venueId) query.venue = venueId;

    if (date) {
        try {
            const startDate = dayjs(date).startOf('day').toDate();
            const endDate = dayjs(date).endOf('day').toDate();
            query.startTime = { $gte: startDate, $lt: endDate }; 
        } catch (e) { console.warn("Invalid date format for public showtime filter:", date); }
    } else {
         query.startTime = { $gte: dayjs().startOf('day').toDate() }; 
    }

    let sortOptions = { startTime: 1 };
    if (sort === 'price_asc' && false) { /* TODO: Sorting by price is complex with tiers. Maybe sort by lowest tier? */ }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    try {
        const total = await Showtime.countDocuments(query);
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title duration posterUrl averageRating')
            .populate('event', 'title category imageUrl')
            .populate('venue', 'name address.city')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean(); 

        
        const processedShowtimes = showtimes.map(st => {
            let displayPriceInfo = "N/A";
            if (st.priceTiers && st.priceTiers.length > 0) {
                const prices = st.priceTiers.map(t => t.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                if (minPrice === maxPrice) displayPriceInfo = `Rs. ${minPrice.toFixed(2)}`;
                else displayPriceInfo = `Rs. ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
            }
            return { ...st, displayPriceInfo };
        });

        const pagination = {};
        if ((startIndex + limit) < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: processedShowtimes });
    } catch (err) {
        console.error('Error fetching showtimes (public):', err);
        res.status(500).json({ msg: 'Server error fetching showtimes', error: err.message });
    }
};















































exports.getShowtimeSeatmap = async (req, res) => {
    const showtimeId = req.params.id;
    console.log(`[getShowtimeSeatmap] Request received for ID: ${showtimeId}`); 

    try {
        if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
        }

        
        console.log('[getShowtimeSeatmap] Finding showtime...');
        const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive');
        if (!showtime || !showtime.isActive) {
            console.log(`[getShowtimeSeatmap] Showtime ${showtimeId} not found or inactive.`);
            return res.status(404).json({ msg: 'Showtime not found or is inactive' });
        }
        console.log('[getShowtimeSeatmap] Found showtime.');

        
        console.log(`[getShowtimeSeatmap] Finding venue: ${showtime.venue}`);
        const venue = await Venue.findById(showtime.venue).select('screens name'); 
        if (!venue) {
            console.log(`[getShowtimeSeatmap] Venue ${showtime.venue} not found.`);
            return res.status(404).json({ msg: 'Venue associated with showtime not found' });
        }
        console.log(`[getShowtimeSeatmap] Found venue: ${venue.name}`);

        
        console.log(`[getShowtimeSeatmap] Finding screen: ${showtime.screenId} within venue ${venue._id}`);
        const screen = venue.screens.id(showtime.screenId); 
        if (!screen || !screen.seatLayout || !Array.isArray(screen.seatLayout.rows)) { 
            console.log(`[getShowtimeSeatmap] Screen ${showtime.screenId} or its seatLayout/rows not found/valid.`);
            return res.status(404).json({ msg: 'Screen layout not found or invalid for this showtime' });
        }
        console.log(`[getShowtimeSeatmap] Found screen: ${screen.name}`);

        
        console.log('[getShowtimeSeatmap] Constructing seat map response...');
        
        const seatMap = {
            showtimeId: showtime._id,
            screenId: screen._id,
            screenName: screen.name,
            
            layout: {
                rows: screen.seatLayout.rows.map(row => ({
                    
                    rowId: row?.rowId || 'N/A', 
                    seats: Array.isArray(row?.seats) ? row.seats.map(seat => {
                        
                        if (!seat || !seat.seatNumber) return null; 
                        const seatIdentifier = `${row.rowId}${seat.seatNumber}`;
                        return {
                            seatNumber: seat.seatNumber,
                            type: seat.type || 'Normal', 
                            identifier: seatIdentifier,
                            isBooked: showtime.bookedSeats.includes(seatIdentifier)
                        };
                    }).filter(seat => seat !== null) : [] 
                }))
            }
        };
        

        console.log('[getShowtimeSeatmap] Sending seat map response.');
        res.status(200).json(seatMap); 

    } catch (err) {
        
        console.error('Error fetching showtime seatmap:', err.message); 
        console.error(err.stack); 
        res.status(500).json({ msg: 'Server error' });
    }
};


module.exports = {
    createShowtime: exports.createShowtime,
    getShowtimes: exports.getShowtimes,
    getShowtimeById: exports.getShowtimeById,
    updateShowtime: exports.updateShowtime,
    deleteShowtime: exports.deleteShowtime,
    getShowtimeSeatmap: exports.getShowtimeSeatmap
}