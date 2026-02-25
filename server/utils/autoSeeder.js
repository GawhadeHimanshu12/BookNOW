// server/utils/autoSeeder.js
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Venue = require('../models/Venue');
const Movie = require('../models/Movie');
const Event = require('../models/Event');
const Showtime = require('../models/Showtime');
const Review = require('../models/Review'); // Added Review Model

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// 1. Helper to find or create an Admin user
async function getAdminUser() {
    let admin = await User.findOne({ email: 'admin@booknow.com' });
    if (!admin) {
        admin = await User.create({
            name: 'System Admin',
            email: 'admin@booknow.com',
            password: 'password123', 
            role: 'admin',
            isEmailVerified: true
        });
    }
    return admin._id;
}

// 2. Helper to find or create mock Reviewers (Users)
async function getMockReviewUsers() {
    const reviewers = [
        { name: 'Rahul Sharma', email: 'rahul.s@example.com' },
        { name: 'Priya Singh', email: 'priya.singh@example.com' },
        { name: 'Amit Patel', email: 'amit.p@example.com' },
        { name: 'Neha Gupta', email: 'neha.g@example.com' },
        { name: 'Vikram Singh', email: 'vikram.s@example.com' }
    ];

    const savedReviewers = [];
    for (const reviewer of reviewers) {
        let user = await User.findOne({ email: reviewer.email });
        if (!user) {
            user = await User.create({
                ...reviewer,
                password: 'password123',
                role: 'user',
                isEmailVerified: true
            });
        }
        savedReviewers.push(user);
    }
    return savedReviewers;
}

// 3. Helper to find or create mock Venues
async function getMockVenues(adminId) {
    let venues = await Venue.find();
    if (venues.length === 0) {
        const mockScreen = {
            name: 'Screen 1',
            capacity: 50,
            seatLayout: {
                rows: [
                    { rowId: 'A', seats: [{ seatNumber: '1', type: 'VIP' }, { seatNumber: '2', type: 'VIP' }] },
                    { rowId: 'B', seats: [{ seatNumber: '1', type: 'Normal' }, { seatNumber: '2', type: 'Normal' }, { seatNumber: '3', type: 'Normal' }] }
                ]
            }
        };

        const venue1 = await Venue.create({
            name: 'PVR Nexus Mall',
            address: { street: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', zipCode: '560095' },
            facilities: ['Parking', 'Food Court'],
            screens: [mockScreen],
            organizer: adminId
        });

        const venue2 = await Venue.create({
            name: 'Inox Marine Drive',
            address: { street: 'Nariman Point', city: 'Mumbai', state: 'Maharashtra', zipCode: '400021' },
            facilities: ['Wheelchair Access', 'Recliners'],
            screens: [mockScreen],
            organizer: adminId
        });
        venues = [venue1, venue2];
    }
    return venues;
}

// 4. Helper to Fetch Indian Movies from TMDB
async function fetchMovies(adminId) {
    if (!TMDB_API_KEY) {
        console.log("⚠️ TMDB_API_KEY not found in .env. Skipping movie fetching.");
        return [];
    }

    console.log("🎬 Fetching real Indian movies from TMDB...");
    try {
        const listRes = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&sort_by=popularity.desc&primary_release_date.gte=2023-01-01`);
        const topMovies = listRes.data.results.slice(0, 10); // Take top 10

        const savedMovies = [];

        for (const tmdbMovie of topMovies) {
            let movie = await Movie.findOne({ title: tmdbMovie.title });
            
            if (!movie) {
                const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbMovie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
                const details = detailRes.data;

                const trailer = details.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
                const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

                const cast = details.credits.cast.slice(0, 3).map(c => c.name);
                const crew = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name);

                movie = await Movie.create({
                    title: details.title,
                    description: details.overview || 'No description available.',
                    releaseDate: details.release_date || new Date(),
                    duration: details.runtime || 120,
                    movieLanguage: details.original_language === 'hi' ? 'Hindi' : (details.original_language === 'te' ? 'Telugu' : 'Indian'),
                    genre: details.genres.map(g => g.name) || ['Drama'],
                    cast: cast,
                    crew: crew,
                    posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
                    trailerUrl: trailerUrl,
                    censorRating: 'U/A',
                    format: ['2D'],
                    addedBy: adminId
                });
            }
            savedMovies.push(movie);
        }
        return savedMovies;
    } catch (error) {
        console.error("❌ Error fetching from TMDB:", error.message);
        return [];
    }
}

// 5. Helper to Generate Mock Reviews
async function generateMockReviews(movies, reviewUsers) {
    console.log("⭐ Generating mock reviews and ratings for movies...");
    const sampleComments = [
        "Absolutely amazing! The cinematography was stunning.",
        "A bit slow in the first half, but the climax was totally worth it.",
        "Not my favorite, but the acting was pretty good.",
        "Masterpiece! One of the best movies of the year.",
        "Average experience. I expected a lot more from the trailer.",
        "Brilliant direction and soundtrack!",
        "A complete waste of time. Story made no sense."
    ];

    for (const movie of movies) {
        // Only seed reviews if the movie has 0 reviews to prevent duplicating every day
        const existingReviews = await Review.countDocuments({ movie: movie._id });
        
        if (existingReviews === 0) {
            // Pick a random number of reviews (between 2 and 5) for this movie
            const numReviews = Math.floor(Math.random() * 4) + 2; 
            
            // Shuffle the reviewers array so different users review different movies
            const shuffledUsers = reviewUsers.sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numReviews);

            for (const user of selectedUsers) {
                // Generate a random rating biased towards 3, 4, and 5
                const rating = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5
                const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];

                // Use .create() so the `post('save')` hook fires and updates Movie averageRating
                await Review.create({
                    rating: rating,
                    comment: comment,
                    user: user._id,
                    movie: movie._id
                });
            }
        }
    }
    console.log("✅ Reviews and ratings updated successfully!");
}

// 6. Helper to Generate Mock Events
async function generateMockEvents(adminId, venues) {
    const eventTitles = ['Zakir Khan Live', 'Abhishek Upmanyu: Toxic', 'Bassjackers India Tour', 'Sunburn Arena'];
    const savedEvents = [];

    for (let i = 0; i < eventTitles.length; i++) {
        let event = await Event.findOne({ title: eventTitles[i] });
        if (!event) {
            event = await Event.create({
                title: eventTitles[i],
                description: 'Experience an unforgettable night full of energy and entertainment!',
                category: eventTitles[i].includes('Zakir') || eventTitles[i].includes('Abhishek') ? 'Comedy' : 'Music',
                eventLanguage: 'Hindi/English',
                venue: venues[i % venues.length]._id,
                address: venues[i % venues.length].address,
                startDate: new Date(Date.now() + (Math.random() * 10) * 24 * 60 * 60 * 1000), 
                imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1000',
                tags: ['Live', 'Trending'],
                status: 'Scheduled',
                organizer: adminId
            });
        }
        savedEvents.push(event);
    }
    return savedEvents;
}

// 7. Generate Showtimes for the next 14 days
async function generateShowtimes(movies, events, venues) {
    console.log("🕒 Generating Showtimes for next 14 days...");
    
    // Clean up past showtimes to save DB space
    await Showtime.deleteMany({ startTime: { $lt: new Date() } });

    const today = new Date();
    const priceTiers = [
        { seatType: 'Normal', price: 250 },
        { seatType: 'VIP', price: 500 }
    ];

    for (let i = 0; i < 14; i++) {
        // Create a date for 'today + i days'
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(18, 0, 0, 0); // 6:00 PM

        // Schedule movies
        for (const movie of movies) {
            const venue = venues[Math.floor(Math.random() * venues.length)];
            const screen = venue.screens[0]; 

            const existing = await Showtime.findOne({ movie: movie._id, venue: venue._id, startTime: targetDate });
            
            if (!existing) {
                await Showtime.create({
                    movie: movie._id,
                    venue: venue._id,
                    screenId: screen._id,
                    screenName: screen.name,
                    startTime: targetDate,
                    endTime: new Date(targetDate.getTime() + movie.duration * 60000),
                    totalSeats: screen.capacity,
                    priceTiers: priceTiers,
                    isActive: true
                });
            }
        }
    }
    console.log("✅ Showtimes scheduled successfully!");
}

// MAIN EXECUTION FUNCTION
const runAutoSeeder = async () => {
    try {
        console.log("-----------------------------------------");
        console.log("🔄 Running Automated Seeder Task...");
        const adminId = await getAdminUser();
        const reviewUsers = await getMockReviewUsers(); // Create fake users for reviews
        const venues = await getMockVenues(adminId);
        
        const movies = await fetchMovies(adminId);
        if (movies.length > 0) {
            await generateMockReviews(movies, reviewUsers); // Generate reviews!
        }

        const events = await generateMockEvents(adminId, venues);
        
        if (movies.length > 0 || events.length > 0) {
            await generateShowtimes(movies, events, venues);
        }
        
        console.log("✅ Auto Seeder Task Completed.");
        console.log("-----------------------------------------");
    } catch (err) {
        console.error("❌ Auto Seeder Failed:", err);
    }
};

// --- SCHEDULE THE CRON JOB ---
// This runs every day at 00:00 (Midnight)
cron.schedule('0 0 * * *', () => {
    runAutoSeeder();
});

module.exports = runAutoSeeder;