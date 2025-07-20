require('dotenv').config();


const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 
const app = express();
const { movieReviewRouter, reviewManagementRouter } = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();

app.use(cors());
app.use(express.json({ extended: false }));
app.get('/', (req, res) => {
    res.json({ message: `Welcome to BookNOW API - Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}` });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/showtimes', require('./routes/showtimeRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/organizer', require('./routes/organizerRoutes'));
app.use('/api/scan', require('./routes/scanRoutes.js')); 
app.use('/api/events', require('./routes/eventRoutes')); 
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/reviews', reviewManagementRouter);
app.use('/api/movies/:movieId/reviews', movieReviewRouter); 
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});