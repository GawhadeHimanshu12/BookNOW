// client/src/components/organizer/MyVenues.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMyVenuesApi } from '../../api/organizer'; 
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton,
    CircularProgress, Alert, Chip, Tooltip, Divider, Link as MuiLink, Grid
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const MyVenues = () => {
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchMyVenues = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyVenuesApi();
            setVenues(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load your venues.');
            setVenues([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyVenues();
    }, [fetchMyVenues]);

    const handleAddNewVenue = () => {
        navigate('/organizer/venues/new'); 
        console.log("Navigate to Add New Venue page/modal");
    };

    const handleEditVenue = (venueId) => {
        navigate(`/organizer/venues/edit/${venueId}`); 
        console.log("Navigate to Edit Venue page/modal for venue:", venueId);
    };


    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">My Venues</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleAddNewVenue} 
                >
                    Add New Venue
                </Button>
            </Box>

            {venues.length === 0 && !isLoading && (
                 <Paper elevation={1} sx={{p:3, textAlign: 'center'}}>
                    <Typography color="text.secondary">You haven't added any venues yet.</Typography>
                </Paper>
            )}
            
            {venues.length > 0 && (
                 <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {venues.map((venue, index) => (
                            <React.Fragment key={venue._id}>
                                <ListItem
                                    sx={{flexWrap: 'wrap'}}
                                    secondaryAction={
                                        <Box sx={{display: 'flex', gap: 0.5, mt: {xs:1, sm:0}}}>
                                            <Tooltip title="Edit Venue">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleEditVenue(venue._id)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                    
                                        </Box>
                                    }
                                >
                                   <ListItemText
                                        primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{venue.name}</Typography>}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {venue.address?.street}, {venue.address?.city}, {venue.address?.state} {venue.address?.zipCode}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Screens: {venue.screens?.length || 0} | 
                                                    Status: <Chip label={venue.isActive ? "Active" : "Inactive"} size="small" variant="outlined" color={venue.isActive ? "success" : "default"}/>
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < venues.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default MyVenues;