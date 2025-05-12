const Movie = require('../models/Movie');
const { validationResult } = require('express-validator'); 
const User = require('../models/User');





exports.getMovies = async (req, res) => {
    try {
        const query = {};
        
        const { status, genre, language, sort, page, limit } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        
        if (status === 'now_showing') { query.releaseDate = { $lte: today }; }
        else if (status === 'coming_soon') { query.releaseDate = { $gt: today }; }

        if (genre) { query.genre = { $regex: new RegExp(`^<span class="math-inline">\{genre\}</span>`, 'i') }; }

        
        if (language) {
             query.movieLanguage = { $regex: new RegExp(`^<span class="math-inline">\{language\}</span>`, 'i') }; 
        }

        
        let sortOptions = { releaseDate: -1 };
        if (sort) {
             switch (sort) {
                case 'rating_desc': sortOptions = { averageRating: -1, releaseDate: -1 }; break;
                case 'rating_asc': sortOptions = { averageRating: 1, releaseDate: -1 }; break;
                case 'releaseDate_asc': sortOptions = { releaseDate: 1 }; break;
                case 'title_asc': sortOptions = { title: 1 }; break;
                case 'title_desc': sortOptions = { title: -1 }; break;
             }
        }

        
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        const total = await Movie.countDocuments(query);

        const movies = await Movie.find(query)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limitNum)
            .select('-addedBy -__v');

        const pagination = {};
        if (endIndex < total) pagination.next = { page: pageNum + 1, limit: limitNum };
        if (startIndex > 0) pagination.prev = { page: pageNum - 1, limit: limitNum };

        res.status(200).json({ success: true, count: movies.length, total, pagination, data: movies });

    } catch (err) {
        console.error('Error fetching movies:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        res.status(200).json(movie);
    } catch (err) {
        console.error('Error fetching movie by ID:', err.message);
        
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};





exports.createMovie = async (req, res) => {
    console.log('[createMovie - Using movieLanguage] Received req.body:', JSON.stringify(req.body, null, 2));

    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    
    const {
        title, description, releaseDate, duration, movieLanguage, 
        genre, cast, crew, posterUrl, trailerUrl, censorRating, format
    } = req.body;

    
    if (!movieLanguage) {
         return res.status(400).json({ errors: [{ msg: 'movieLanguage field is missing in request body'}] });
    }

    try {
        let existingMovie = await Movie.findOne({ title });
        if (existingMovie) { return res.status(400).json({ errors: [{ msg: 'Movie with this title already exists' }] }); }
        if (req.user.role === 'organizer') {
             const organizer = await User.findById(req.user.id);
             if (!organizer?.isApproved) { return res.status(403).json({ msg: 'Organizer account not approved to add movies.' }); }
        }

        
        const movieData = {
            title, description, releaseDate, duration,
            movieLanguage, 
            genre, cast, crew, posterUrl, trailerUrl, censorRating, format,
            addedBy: req.user.id
        };
        console.log('[createMovie - Using movieLanguage] Data before Movie.create:', JSON.stringify(movieData, null, 2));

        const movie = await Movie.create(movieData);
        console.log('[createMovie - Using movieLanguage] Movie created successfully:', movie._id);
        res.status(201).json(movie);

    } catch (err) {
         console.error('[createMovie - Using movieLanguage] Error during creation:', err);
         console.error('[createMovie - Using movieLanguage] Error Message:', err.message);
         if (err.code === 11000) { return res.status(400).json({ errors: [{ msg: 'Movie with this title already exists (duplicate key).' }] });}
         if (err.name === 'ValidationError') {
             let errorMessages = Object.values(err.errors).map(e => e.message);
              return res.status(400).json({ msg: `Movie validation failed: ${errorMessages.join(', ')}` });
         }
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};




exports.updateMovie = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        
        
        
        if (movie.addedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized to update this movie' });
        }


        
        
        movie = await Movie.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true, runValidators: true } 
        );

        res.status(200).json(movie);

    } catch (err) {
        console.error('Error updating movie:', err.message);
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        

        
        
        

        await movie.remove();

        res.status(200).json({ msg: 'Movie removed successfully' });

    } catch (err) {
        console.error('Error deleting movie:', err.message);
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};




exports.validateBookingQR = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body; 
    const staffUserId = req.user.id; 
    const staffUserRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ msg: 'Invalid Booking ID format' });
    }

    const session = await mongoose.startSession(); 

    try {
        session.startTransaction();

        
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'showtime',
                select: 'venue startTime movie screenName', 
                populate: { path: 'movie', select: 'title' } 
            })
            .populate('user', 'name email') 
            .session(session);


        
        if (!booking) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ msg: 'Booking not found' });
        }

        
        let isAuthorized = false;
        if (staffUserRole === 'admin') {
            isAuthorized = true;
        } else if (staffUserRole === 'organizer') {
            
            const venue = await Venue.findById(booking.showtime.venue).session(session);
            
            const organizer = await User.findById(staffUserId).session(session);

            if (venue && venue.organizer.toString() === staffUserId && organizer?.isApproved) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            await session.abortTransaction(); session.endSession();
            return res.status(403).json({ msg: 'User not authorized to validate bookings for this venue/showtime' });
        }


        
        if (booking.status === 'CheckedIn') {
            await session.abortTransaction(); session.endSession();
            return res.status(409).json({ 
                msg: `Booking already checked in at ${booking.checkInTime?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
                bookingDetails: { /* Optionally include some details */ }
            });
        }
        if (booking.status === 'Cancelled') {
             await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'Cannot check in a cancelled booking' });
        }
         if (booking.status !== 'Confirmed') {
             await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: `Booking status is '${booking.status}', cannot check in.` });
        }

        
        const now = Date.now();
        const showtimeStart = new Date(booking.showtime.startTime).getTime();
        const checkinWindowStart = showtimeStart - (60 * 60 * 1000); 
        const checkinWindowEnd = showtimeStart + (30 * 60 * 1000); 
        if (now < checkinWindowStart || now > checkinWindowEnd) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ msg: 'Check-in is only allowed shortly before/after the showtime.' });
        }


        
        booking.isCheckedIn = true;
        booking.checkInTime = new Date();
        booking.checkedInBy = staffUserId;
        booking.status = 'CheckedIn'; 

        await booking.save({ session: session });

        
        await session.commitTransaction();
        session.endSession();


        
        res.status(200).json({
            success: true,
            message: 'Check-in Successful!',
            bookingDetails: {
                bookingId: booking._id,
                userName: booking.user.name,
                userEmail: booking.user.email,
                movieTitle: booking.showtime.movie.title,
                showtime: booking.showtime.startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                screenName: booking.showtime.screenName,
                seats: booking.seats,
                checkInTime: booking.checkInTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            }
        });


    } catch (err) {
        console.error('Error validating QR/Booking:', err.message);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};