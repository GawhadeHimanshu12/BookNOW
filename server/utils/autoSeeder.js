const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');

const User = require('../models/User');
const Venue = require('../models/Venue');
const Movie = require('../models/Movie');
const Event = require('../models/Event');
const Showtime = require('../models/Showtime');
const Review = require('../models/Review');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME;
const DEFAULT_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'TempUser@123';

async function getAdminUser() {
    if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD || !DEFAULT_ADMIN_NAME) {
        throw new Error('Missing admin environment variables');
    }

    let admin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (!admin) {
        admin = await User.create({
            name: DEFAULT_ADMIN_NAME,
            email: DEFAULT_ADMIN_EMAIL,
            password: DEFAULT_ADMIN_PASSWORD,
            role: 'admin',
            isEmailVerified: true
        });
    }

    return admin._id;
}

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
                password: DEFAULT_USER_PASSWORD,
                role: 'user',
                isEmailVerified: true
            });
        }
        savedReviewers.push(user);
    }

    return savedReviewers;
}

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

async function fetchMovies(adminId) {
    if (!TMDB_API_KEY) {
        return [];
    }

    try {
        const listRes = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN&sort_by=popularity.desc&primary_release_date.gte=2023-01-01`);
        const topMovies = listRes.data.results.slice(0, 10);
        const savedMovies = [];

        for (const tmdbMovie of topMovies) {
            let movie = await Movie.findOne({ tmdbId: tmdbMovie.id });

            if (!movie) {
                const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbMovie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
                const details = detailRes.data;

                const trailer = details.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
                const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

                const cast = details.credits.cast.slice(0, 3).map(c => c.name);
                const crew = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name);

                movie = await Movie.create({
                    tmdbId: details.id,
                    title: details.title,
                    description: details.overview || 'No description available.',
                    releaseDate: details.release_date || new Date(),
                    duration: details.runtime || 120,
                    movieLanguage: details.original_language === 'hi' ? 'Hindi' : (details.original_language === 'te' ? 'Telugu' : 'Indian'),
                    genre: details.genres.map(g => g.name) || ['Drama'],
                    cast,
                    crew,
                    posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
                    trailerUrl,
                    censorRating: 'U/A',
                    format: ['2D'],
                    addedBy: adminId
                });
            }

            savedMovies.push(movie);
        }

        return savedMovies;
    } catch {
        return [];
    }
}

async function generateMockReviews(movies, reviewUsers) {
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
        const existingReviews = await Review.countDocuments({ movie: movie._id });

        if (existingReviews === 0) {
            const numReviews = Math.floor(Math.random() * 4) + 2;
            const shuffledUsers = [...reviewUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numReviews);

            for (const user of selectedUsers) {
                const rating = Math.floor(Math.random() * 3) + 3;
                const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];

                await Review.create({
                    rating,
                    comment,
                    user: user._id,
                    movie: movie._id
                });
            }
        }
    }
}

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

async function generateShowtimes(movies, events, venues) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    await Showtime.deleteMany({ startTime: { $lt: todayStart } });

    const today = new Date();
    const priceTiers = [
        { seatType: 'Normal', price: 250 },
        { seatType: 'VIP', price: 500 }
    ];

    for (let i = 0; i < 14; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(18, 0, 0, 0);

        for (const movie of movies) {
            const venue = venues[Math.floor(Math.random() * venues.length)];
            const screen = venue.screens[0];

            const existing = await Showtime.findOne({
                movie: movie._id,
                venue: venue._id,
                startTime: targetDate
            });

            if (!existing) {
                await Showtime.create({
                    movie: movie._id,
                    venue: venue._id,
                    screenId: screen._id,
                    screenName: screen.name,
                    startTime: targetDate,
                    endTime: new Date(targetDate.getTime() + movie.duration * 60000),
                    totalSeats: screen.capacity,
                    priceTiers,
                    isActive: true
                });
            }
        }
    }
}

const runAutoSeeder = async () => {
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_AUTO_SEED) {
        return;
    }

    const adminId = await getAdminUser();
    const reviewUsers = await getMockReviewUsers();
    const venues = await getMockVenues(adminId);

    const movies = await fetchMovies(adminId);
    if (movies.length > 0) {
        await generateMockReviews(movies, reviewUsers);
    }

    const events = await generateMockEvents(adminId, venues);

    if (movies.length > 0 || events.length > 0) {
        await generateShowtimes(movies, events, venues);
    }
};

cron.schedule('0 0 * * *', runAutoSeeder, { timezone: 'Asia/Kolkata' });

module.exports = runAutoSeeder;