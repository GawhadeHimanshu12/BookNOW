import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TheatersIcon from '@mui/icons-material/Theaters';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';


import MyVenues from '../components/organizer/MyVenues';
import OrganizerShowtimeManagement from '../components/organizer/OrganizerShowtimeManagement'; 
import MyVenueBookingsOrganizer from '../components/organizer/MyVenueBookingsOrganizer';
import OrganizerProfileSettings from '../components/organizer/OrganizerProfileSettings';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`organizer-tabpanel-${index}`}
            aria-labelledby={`organizer-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, pb: 3, px: {xs: 1, sm: 2} }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `organizer-tab-${index}`,
        'aria-controls': `organizer-tabpanel-${index}`,
    };
}

const OrganizerDashboardPage = () => {
    const [currentTab, setCurrentTab] = useState(0); 

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ py: {xs: 2, sm: 3} }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: {xs: 'center', sm:'left'}, mb: 3 }}>
                Organizer Dashboard
            </Typography>

            <Paper elevation={3} sx={{width: '100%'}}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label="Organizer dashboard tabs"
                        indicatorColor="secondary"
                        textColor="secondary"
                        variant="scrollable"
                        scrollButtons="auto" 
                        allowScrollButtonsMobile
                    >
                        <Tab icon={<TheatersIcon />} iconPosition="start" label="My Venues" {...a11yProps(0)} />
                        <Tab icon={<EventSeatIcon />} iconPosition="start" label="My Showtimes" {...a11yProps(1)} />
                        <Tab icon={<AssessmentIcon />} iconPosition="start" label="Venue Bookings" {...a11yProps(2)} />
                        <Tab icon={<SettingsIcon />} iconPosition="start" label="Profile/Settings" {...a11yProps(3)} />
                    </Tabs>
                </Box>

                <TabPanel value={currentTab} index={0}> <MyVenues /> </TabPanel>
                <TabPanel value={currentTab} index={1}> <OrganizerShowtimeManagement /> </TabPanel> {/* Use the imported component */}
                <TabPanel value={currentTab} index={2}> <MyVenueBookingsOrganizer /> </TabPanel>
                <TabPanel value={currentTab} index={3}> <OrganizerProfileSettings /> </TabPanel>
            </Paper>
        </Container>
    );
};

export default OrganizerDashboardPage;