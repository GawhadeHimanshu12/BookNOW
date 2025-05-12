import React, { useState, useEffect } from 'react';
import { getMyBookingsApi } from '../api/bookings'; 
import { useAuth } from '../contexts/AuthContext'; 
import dayjs from 'dayjs'; 
import { Link as RouterLink } from 'react-router-dom'; 


import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

const MyBookingsPage = () => {
    
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    
    useEffect(() => {
        
        if (!isAuthLoading && isAuthenticated) {
            const fetchBookings = async () => {
                console.log("[MyBookingsPage] Auth confirmed, fetching bookings...");
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getMyBookingsApi(); 
                    
                    const sortedBookings = data.sort((a, b) =>
                        dayjs(b.showtime?.startTime || 0).valueOf() - dayjs(a.showtime?.startTime || 0).valueOf()
                    );
                    setBookings(sortedBookings);
                    console.log("[MyBookingsPage] Bookings fetched and sorted:", sortedBookings.length);
                } catch (err) {
                    console.error("[MyBookingsPage] Error fetching bookings:", err);
                    setError(err.message || 'Failed to load your bookings.');
                    setBookings([]); 
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBookings();
        } else if (!isAuthLoading && !isAuthenticated) {
            
            console.log("[MyBookingsPage] User not authenticated.");
            setError("Please login to view your bookings.");
            setIsLoading(false);
            setBookings([]);
        }
        
    }, [isAuthenticated, isAuthLoading]); 

    
    const getStatusChipColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'success';
            case 'checkedin': return 'primary';
            case 'paymentpending': return 'warning';
            case 'cancelled':
            case 'paymentfailed': return 'error';
            default: return 'default';
        }
    };

    

    
    if (isLoading || isAuthLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }

    
    if (error) {
        return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
                My Bookings
            </Typography>

            {/* Show message if no bookings are found */}
            {bookings.length === 0 ? (
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't made any bookings yet.</Typography>
                    <Button component={RouterLink} to="/" variant="contained" color="error" sx={{ mt: 2 }}>
                        Book Tickets Now
                    </Button>
                </Paper>
            ) : (
                
                <Paper elevation={1}>
                    <List disablePadding>
                        {bookings.map((booking, index) => {
                            
                            const show = booking.showtime;
                            const itemTitle = show?.movie?.title || show?.event?.title || 'Item Title Unavailable';
                            const itemPoster = show?.movie?.posterUrl; 
                            const venueName = show?.venue?.name || 'Venue N/A';
                            const screenName = show?.screenName || 'N/A';
                            const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'Time N/A';
                            const seats = booking.seats?.join(', ') || 'N/A';
                            
                            const displayBookingId = booking.bookingRefId || booking._id;

                            return (
                                <React.Fragment key={booking._id}>
                                    <ListItem sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' }, 
                                        alignItems: 'flex-start',
                                        py: 2.5, 
                                        px: { xs: 1.5, sm: 2.5 } 
                                    }}>
                                        {/* Optional Poster Image */}
                                        {itemPoster && (
                                            <Box sx={{
                                                width: { xs: '100%', sm: 80, md: 100 }, 
                                                height: { xs: 150, sm: 120, md: 150 }, 
                                                mr: { sm: 2.5 },
                                                mb: { xs: 2, sm: 0 },
                                                flexShrink: 0,
                                                bgcolor: 'grey.200', 
                                                borderRadius: 1,
                                                overflow: 'hidden'
                                            }}>
                                                <img
                                                    src={itemPoster}
                                                    alt={itemTitle}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    
                                                    onError={(e) => { e.target.style.display='none'; /* Hide broken image */ }}
                                                />
                                            </Box>
                                        )}

                                        {/* Booking Details Text */}
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6" component="span" sx={{ fontWeight: 'medium', display: 'block', mb: 0.5 }}>
                                                    {itemTitle}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary" display="block" sx={{fontWeight: 'bold', mb: 0.5}}>
                                                        Ref ID: {displayBookingId}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Venue: {venueName}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Screen: {screenName} | Seats: {seats}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Date: {startTime}</Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary" display="block">Booked on: {dayjs(booking.bookingTime).format('DD MMM YYYY')}</Typography>
                                                    <Typography component="span" variant="body2" color="text.primary" display="block" sx={{mt: 1}}>
                                                        Amount Paid: Rs. {booking.totalAmount?.toFixed(2)}
                                                        {booking.discountAmount > 0 && ` (Saved Rs. ${booking.discountAmount.toFixed(2)})`}
                                                    </Typography>
                                                </>
                                            }
                                            sx={{ mb: { xs: 2, sm: 0 } }} 
                                        />

                                        {/* Status and Actions */}
                                        <Box sx={{
                                            mt: { xs: 1, sm: 0 },
                                            ml: { sm: 2 },
                                            textAlign: { xs: 'left', sm: 'right' },
                                            flexShrink: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: {xs: 'flex-start', sm: 'flex-end'}
                                        }}>
                                            <Chip
                                                label={booking.status || 'Unknown'}
                                                color={getStatusChipColor(booking.status)}
                                                size="small"
                                                sx={{ mb: 1, width: 'fit-content' }} 
                                            />
                                            {/* Link to confirmation page to view QR code */}
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                component={RouterLink}
                                                to={`/booking-confirmation/${booking._id}`}
                                                sx={{display: 'block', width: '100%', mb: 1}}
                                            >
                                                View Details / QR
                                            </Button>
                                            {/* Optional Cancel Button Logic */}
                                            {/* {booking.status === 'Confirmed' && (
                                                <Button variant="text" color="error" size="small" sx={{display: 'block', width: '100%'}}>
                                                    Cancel Booking
                                                </Button>
                                            )} */}
                                        </Box>
                                    </ListItem>
                                    {/* Add Divider between items */}
                                    {index < bookings.length - 1 && <Divider component="li" variant="middle"/>}
                                </React.Fragment>
                            )
                        })}
                    </List>
                </Paper>
            )}
        </Container>
    );
};

export default MyBookingsPage;
