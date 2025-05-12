
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getMyVenuesApi } from '../../api/organizer';
import { getMoviesApi } from '../../api/movies';
import { createShowtimeApi, getShowtimeByIdApi, updateShowtimeApi } from '../../api/showtimes';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Autocomplete, FormHelperText, Divider, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';


const KNOWN_SEAT_TYPES = ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair']; 

const initialShowtimeState = {
    movie: null,
    event: null,
    venue: '',
    screenId: '',
    startTime: null,
    priceTiers: [], 
    isActive: true,
};

const OrganizerShowtimeFormPage = ({ mode = 'create' }) => {
    const navigate = useNavigate();
    const { showtimeId } = useParams();
    const location = useLocation();

    const [showtimeData, setShowtimeData] = useState(initialShowtimeState);
    const [myVenues, setMyVenues] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const [availableScreens, setAvailableScreens] = useState([]);
    const [uniqueSeatTypesInLayout, setUniqueSeatTypesInLayout] = useState([]); 

    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [formError, setFormError] = useState(null);
    const [pageTitle, setPageTitle] = useState('Add New Showtime');

    const fetchDropdownDataAndExistingShowtime = useCallback(async () => {
        setIsLoadingInitialData(true);
        setFormError(null);
        try {
            const [venuesRes, moviesRes] = await Promise.all([
                getMyVenuesApi(),
                getMoviesApi({ limit: 1000, sort: 'title_asc', select: 'title,_id' })
            ]);
            const fetchedVenues = Array.isArray(venuesRes) ? venuesRes : [];
            const fetchedMovies = moviesRes.data && Array.isArray(moviesRes.data) ? moviesRes.data : [];
            setMyVenues(fetchedVenues);
            setAllMovies(fetchedMovies);

            let currentVenueId = '';
            let currentScreenId = ''; 
            const queryParams = new URLSearchParams(location.search);
            const preSelectedVenueIdFromQuery = queryParams.get('venueId');

            if (mode === 'edit' && showtimeId) {
                setPageTitle('Edit Showtime');
                const existingShowtime = await getShowtimeByIdApi(showtimeId);
                const selectedMovieObject = fetchedMovies.find(m => m._id === existingShowtime.movie?._id) || null;
                setShowtimeData({
                    movie: selectedMovieObject,
                    event: null, 
                    venue: existingShowtime.venue?._id || '',
                    screenId: existingShowtime.screenId || '',
                    startTime: existingShowtime.startTime ? dayjs(existingShowtime.startTime) : null,
                    
                    priceTiers: Array.isArray(existingShowtime.priceTiers) ? existingShowtime.priceTiers : [],
                    isActive: existingShowtime.isActive !== undefined ? existingShowtime.isActive : true,
                });
                currentVenueId = existingShowtime.venue?._id;
                currentScreenId = existingShowtime.screenId; 
            } else {
                setPageTitle('Add New Showtime');
                if (preSelectedVenueIdFromQuery && fetchedVenues.some(v => v._id === preSelectedVenueIdFromQuery)) {
                    setShowtimeData(prev => ({ ...initialShowtimeState, venue: preSelectedVenueIdFromQuery }));
                    currentVenueId = preSelectedVenueIdFromQuery;
                } else {
                    setShowtimeData(initialShowtimeState);
                }
            }

            if (currentVenueId) {
                const selectedVenueDetails = fetchedVenues.find(v => v._id === currentVenueId);
                setAvailableScreens(selectedVenueDetails?.screens || []);
                if (currentScreenId && selectedVenueDetails) { 
                    const selectedScreen = selectedVenueDetails.screens.find(s => s._id === currentScreenId);
                    if (selectedScreen?.seatLayout?.rows) {
                        const types = new Set();
                        selectedScreen.seatLayout.rows.forEach(row => row.seats.forEach(seat => types.add(seat.type || 'Normal')));
                        setUniqueSeatTypesInLayout(Array.from(types).filter(type => type !== 'Unavailable'));
                    }
                }
            }
        } catch (err) {
            setFormError(err.message || "Failed to load required data for the form.");
        } finally {
            setIsLoadingInitialData(false);
        }
    }, [mode, showtimeId, location.search]);

    useEffect(() => {
        fetchDropdownDataAndExistingShowtime();
    }, [fetchDropdownDataAndExistingShowtime]);

    
    useEffect(() => {
        setUniqueSeatTypesInLayout([]); 
        if (showtimeData.venue && myVenues.length > 0) {
            const selectedVenueDetails = myVenues.find(v => v._id === showtimeData.venue);
            setAvailableScreens(selectedVenueDetails?.screens || []);
            
            if (showtimeData.screenId && selectedVenueDetails) {
                const selectedScreen = selectedVenueDetails.screens.find(s => s._id === showtimeData.screenId);
                if (selectedScreen?.seatLayout?.rows) {
                    const types = new Set();
                    selectedScreen.seatLayout.rows.forEach(row => 
                        row.seats.forEach(seat => types.add(seat.type || 'Normal'))
                    );
                    const filteredTypes = Array.from(types).filter(type => type !== 'Unavailable');
                    setUniqueSeatTypesInLayout(filteredTypes);
                    
                    
                    if (mode === 'create' || (mode === 'edit' && !showtimeData.priceTiers.length && filteredTypes.length > 0)) {
                        setShowtimeData(prev => ({
                            ...prev,
                            priceTiers: filteredTypes.map(type => ({ seatType: type, price: '' }))
                        }));
                    }
                }
            } else { 
                 if (mode === 'create') setShowtimeData(prev => ({ ...prev, screenId: '', priceTiers: [] }));
                 else setShowtimeData(prev => ({ ...prev, priceTiers: [] })); 
            }
        } else { 
            setAvailableScreens([]);
            if (mode === 'create') setShowtimeData(prev => ({ ...prev, screenId: '', priceTiers: [] }));
            else setShowtimeData(prev => ({ ...prev, priceTiers: [] }));
        }
    }, [showtimeData.venue, showtimeData.screenId, myVenues, mode]);


    const handleFieldChange = (e) => { /* ... (same as before) ... */ 
        const { name, value, type, checked } = e.target;
        setFormError(null);
        setShowtimeData(prev => ({
            ...prev,
            [name]: type === 'checkbox' || type === 'switch' ? checked : value
        }));
    };
    const handleAutocompleteChange = (name, newValue) => { /* ... (same as before) ... */ 
        setFormError(null);
        setShowtimeData(prev => ({
            ...prev,
            [name]: newValue,
            ...(name === 'movie' && newValue && { event: null }),
            ...(name === 'event' && newValue && { movie: null }),
        }));
    };
    const handleDateTimeChange = (newValue) => { /* ... (same as before) ... */ 
        setFormError(null);
        setShowtimeData(prev => ({ ...prev, startTime: newValue }));
    };

    const handlePriceTierChange = (index, newPrice) => {
        setFormError(null);
        const updatedPriceTiers = [...showtimeData.priceTiers];
        const priceValue = newPrice.trim() === '' ? '' : parseFloat(newPrice);
        if (priceValue === '' || (!isNaN(priceValue) && priceValue >= 0)) {
             updatedPriceTiers[index].price = priceValue === '' ? '' : priceValue;
             setShowtimeData(prev => ({ ...prev, priceTiers: updatedPriceTiers }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoadingForm(true);
        setFormError(null);

        if (!showtimeData.movie && !showtimeData.event) {
            setFormError("Please select a Movie (or an Event, if enabled)."); setIsLoadingForm(false); return;
        }
        if (!showtimeData.venue || !showtimeData.screenId || !showtimeData.startTime) {
            setFormError("Venue, Screen, and Start Time are required fields."); setIsLoadingForm(false); return;
        }
        if (!showtimeData.priceTiers || showtimeData.priceTiers.length === 0) {
            setFormError("At least one price tier must be defined. Please set prices for the available seat types."); setIsLoadingForm(false); return;
        }
        
        let invalidPriceTier = false;
        const processedPriceTiers = showtimeData.priceTiers.map(tier => {
            const price = parseFloat(tier.price);
            if (isNaN(price) || price < 0 || String(tier.price).trim() === '') {
                invalidPriceTier = true;
            }
            return { seatType: tier.seatType, price: price };
        });

        if (invalidPriceTier) {
            setFormError("All listed seat types must have a valid, non-negative price.");
            setIsLoadingForm(false);
            return;
        }

        const payload = {
            movie: showtimeData.movie?._id || undefined,
            event: showtimeData.event?._id || undefined,
            venue: showtimeData.venue,
            screenId: showtimeData.screenId,
            startTime: showtimeData.startTime ? dayjs(showtimeData.startTime).toISOString() : null,
            priceTiers: processedPriceTiers, 
            isActive: showtimeData.isActive,
        };
        
        delete payload.price; 

        console.log("Submitting Showtime Payload (Tiered Pricing):", payload);

        try {
            if (mode === 'edit') {
                await updateShowtimeApi(showtimeId, payload);
            } else {
                await createShowtimeApi(payload);
            }
            navigate('/organizer?tab=showtimes');
        } catch (err) {
            const apiError = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || err.message || 'Operation failed.');
            setFormError(apiError);
        } finally {
            setIsLoadingForm(false);
        }
    };

    
    if (isLoadingInitialData) {
        return (
            <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress color="error" size={50} /> <Typography sx={{mt: 2}}>Loading Form Data...</Typography>
            </Container>
        );
    }
    
    if (formError && (!myVenues.length || !allMovies.length) && !showtimeId) { 
         return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                 <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
                 <Button variant="outlined" onClick={() => navigate('/organizer?tab=showtimes')}>Back to Showtimes List</Button>
            </Container>
        );
    }


    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}> {/* Changed to md for a bit more space */}
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                    {pageTitle}
                </Typography>
                {formError && (!isLoadingInitialData) && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={2.5}>

                        {/* Section 1: Item Selection (Movie/Event) */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" component="p" gutterBottom sx={{ fontWeight: 'medium' }}>Item Selection</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}> {/* Movie Autocomplete full width */}
                                    <Autocomplete
                                        options={allMovies}
                                        getOptionLabel={(option) => option.title || ""}
                                        value={showtimeData.movie}
                                        onChange={(event, newValue) => handleAutocompleteChange('movie', newValue)}
                                        isOptionEqualToValue={(option, value) => option._id === value?._id}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Select Movie *" variant="outlined" 
                                                       error={!!(formError && (!showtimeData.movie && !showtimeData.event))} />
                                        )}
                                        disabled={!!showtimeData.event || isLoadingForm || isLoadingInitialData}
                                    />
                                    <FormHelperText error={!!(formError && (!showtimeData.movie && !showtimeData.event))}>
                                        {(formError && (!showtimeData.movie && !showtimeData.event)) ? "Movie or Event is required" : "Search and select a movie."}
                                    </FormHelperText>
                                </Grid>
                                {/* Event selection can be added similarly if needed */}
                            </Grid>
                        </Grid>

                        {/* Section 2: Venue & Screen */}
                        <Grid item xs={12} sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle1" component="p" gutterBottom sx={{ fontWeight: 'medium' }}>Venue & Screen</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required error={!!(formError && !showtimeData.venue)}>
                                        <InputLabel>Venue *</InputLabel>
                                        <Select name="venue" label="Venue *" value={showtimeData.venue} onChange={handleFieldChange} disabled={isLoadingForm || isLoadingInitialData}>
                                            <MenuItem value=""><em>Select venue</em></MenuItem>
                                            {myVenues.map(venue => ( <MenuItem key={venue._id} value={venue._id}>{venue.name} ({venue.address?.city})</MenuItem> ))}
                                        </Select>
                                        { (formError && !showtimeData.venue) && <FormHelperText error>Venue is required.</FormHelperText>}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required disabled={!showtimeData.venue || availableScreens.length === 0 || isLoadingForm || isLoadingInitialData} error={!!(formError && !showtimeData.screenId)}>
                                        <InputLabel>Screen *</InputLabel>
                                        <Select name="screenId" label="Screen *" value={showtimeData.screenId} onChange={handleFieldChange}>
                                            <MenuItem value=""><em>{showtimeData.venue ? (availableScreens.length > 0 ? 'Select screen' : 'No screens') : 'Select venue first'}</em></MenuItem>
                                            {availableScreens.map(screen => ( <MenuItem key={screen._id} value={screen._id}>{screen.name} (Cap: {screen.capacity})</MenuItem> ))}
                                        </Select>
                                        { (formError && !showtimeData.screenId) && <FormHelperText error>Screen is required.</FormHelperText>}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Section 3: Timing */}
                        <Grid item xs={12} sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle1" component="p" gutterBottom sx={{ fontWeight: 'medium' }}>Timing</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <DateTimePicker
                                label="Start Date & Time *"
                                value={showtimeData.startTime}
                                onChange={handleDateTimeChange}
                                slotProps={{ textField: { fullWidth: true, required: true, error:!!(formError && !showtimeData.startTime) } }}
                                disablePast minutesStep={15} ampmInClock
                                disabled={isLoadingForm || isLoadingInitialData}
                            />
                        </Grid>
                        
                        {/* Section 4: Pricing (Tiered) */}
                        <Grid item xs={12} sx={{ mt: 1.5 }}>
                            <Typography variant="subtitle1" component="p" gutterBottom sx={{ fontWeight: 'medium' }}>Pricing (INR)</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {uniqueSeatTypesInLayout.length === 0 && showtimeData.screenId &&
                                <Alert severity="warning" sx={{mb:1}}>No specific seat types found in the selected screen's layout. Please define a default price or update the venue's screen layout.</Alert>
                            }
                            {uniqueSeatTypesInLayout.map((seatType, index) => {
                                const tierIndex = showtimeData.priceTiers.findIndex(pt => pt.seatType === seatType);
                                const priceValue = tierIndex !== -1 ? showtimeData.priceTiers[tierIndex].price : '';
                                return (
                                    <TextField
                                        key={seatType}
                                        label={`Price for ${seatType} Seats *`}
                                        type="number"
                                        value={priceValue}
                                        onChange={(e) => handlePriceTierChange(tierIndex !== -1 ? tierIndex : showtimeData.priceTiers.length, e.target.value, seatType)} 
                                        fullWidth
                                        required
                                        inputProps={{ min: 0, step: "10" }}
                                        sx={{ mb: 2 }}
                                        error={!!(formError && (priceValue === '' || parseFloat(priceValue) < 0))}
                                        disabled={isLoadingForm || isLoadingInitialData}
                                        helperText={ (formError && (priceValue === '' || parseFloat(priceValue) < 0)) ? "Valid price required" : ""}
                                    />
                                );
                            })}
                             {uniqueSeatTypesInLayout.length > 0 && showtimeData.priceTiers.length !== uniqueSeatTypesInLayout.length && mode === 'create' &&
                                <Typography variant="caption" color="textSecondary">Initializing prices for detected seat types. Please fill them in.</Typography>
                            }
                            {/* Fallback if no seat types are detected but screen is selected, provide a default price field */}
                            {uniqueSeatTypesInLayout.length === 0 && showtimeData.screenId && (
                                <TextField
                                    label="Default Price (INR) *"
                                    type="number"
                                    value={showtimeData.priceTiers.find(pt => pt.seatType === 'Default')?.price || ''}
                                    onChange={(e) => {
                                        const newPrice = e.target.value;
                                        const defaultTierIndex = showtimeData.priceTiers.findIndex(pt => pt.seatType === 'Default');
                                        const updatedTiers = [...showtimeData.priceTiers];
                                        if (defaultTierIndex !== -1) {
                                            updatedTiers[defaultTierIndex].price = newPrice.trim() === '' ? '' : parseFloat(newPrice);
                                        } else {
                                            updatedTiers.push({ seatType: 'Default', price: newPrice.trim() === '' ? '' : parseFloat(newPrice) });
                                        }
                                        setShowtimeData(prev => ({...prev, priceTiers: updatedTiers.filter(t => t.price !== '' || t.seatType === 'Default')})); 
                                    }}
                                    fullWidth required inputProps={{ min: 0, step: "10" }}
                                    error={!!(formError && (!showtimeData.priceTiers.find(pt => pt.seatType === 'Default') || String(showtimeData.priceTiers.find(pt => pt.seatType === 'Default')?.price).trim() === '' || parseFloat(showtimeData.priceTiers.find(pt => pt.seatType === 'Default')?.price) < 0))}
                                    disabled={isLoadingForm || isLoadingInitialData}
                                    helperText="Enter a default price if no seat types are defined in screen layout."
                                />
                            )}
                        </Grid>
                        
                        {/* Section 5: Status */}
                        <Grid item xs={12} sx={{ mt: 1.5 }}>
                             <FormControlLabel
                                control={<Switch checked={showtimeData.isActive} onChange={(e) => setShowtimeData(prev => ({...prev, isActive: e.target.checked}))} name="isActive" disabled={isLoadingForm || isLoadingInitialData} />}
                                label="Showtime is Active (Visible for booking)"
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button onClick={() => navigate('/organizer?tab=showtimes')} variant="outlined" size="large" disabled={isLoadingForm || isLoadingInitialData}>Cancel</Button>
                            <Button type="submit" variant="contained" color="success" size="large" disabled={isLoadingForm || isLoadingInitialData}>
                                {isLoadingForm ? <CircularProgress size={24} color="inherit" /> : (mode === 'edit' ? 'Save Showtime' : 'Create Showtime')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default OrganizerShowtimeFormPage;