// server/server.js
// Purpose: Main entry point for the backend Express application. Sets up middleware, routes, and starts the server.

// Load environment variables from .env file right at the start
require('dotenv').config();

// Import necessary packages
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import database connection function

// --- Initialize Express App ---
const app = express();

// --- Import Routers ---
const { movieReviewRouter, reviewManagementRouter } = require('./routes/reviewRoutes');

// --- Connect to Database ---
connectDB();

// --- Core Middlewares ---
// Enable CORS (Cross-Origin Resource Sharing) - Allows requests from your frontend (running on a different port)
// Configure origins specifically in production for security
app.use(cors());

// Body Parsing Middleware - Allows the server to accept and parse JSON data in request bodies
app.use(express.json({ extended: false })); // Use express.json() instead of body-parser

// --- API Routes ---
// Define a simple root route for initial testing
app.get('/', (req, res) => {
    res.json({ message: `Welcome to BookNOW API - Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` });
});

// Mount Routers for different features (We will add these in subsequent steps)
 app.use('/api/auth', require('./routes/authRoutes')); // Authentication routes (Register, Login)
 app.use('/api/movies', require('./routes/movieRoutes')); // Movie related routes
 app.use('/api/venues', require('./routes/venueRoutes')); // Venue related routes
 app.use('/api/showtimes', require('./routes/showtimeRoutes')); // Showtime related routes
 app.use('/api/bookings', require('./routes/bookingRoutes')); // Booking related routes
 app.use('/api/admin', require('./routes/adminRoutes')); // Admin specific routes
 app.use('/api/organizer', require('./routes/organizerRoutes')); // Organizer specific routes
 app.use('/api/scan', require('./routes/scanRoutes.js')); 
 app.use('/api/reviews', reviewManagementRouter);
 app.use('/api/movies/:movieId/reviews', movieReviewRouter);
 app.use('/api/events', require('./routes/eventRoutes')); 
 app.use('/api/search', require('./routes/searchRoutes'));
//  app.use('/api/webhooks', require('./routes/webhookRoutes'));
 app.use('/api/cities', require('./routes/cityRoutes'));
// --- Error Handling Middleware (Optional but Recommended - Add Later) ---
// Example: app.use(require('./middleware/errorMiddleware'));

// --- Define Port and Start Server ---
const PORT = process.env.PORT || 5000; // Use port from .env file or default to 5000

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});