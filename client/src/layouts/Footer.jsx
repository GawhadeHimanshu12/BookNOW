import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 3, 
                px: 2, 
                mt: 'auto',
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? theme.palette.grey[800] : theme.palette.grey[900], // Dark background
                color: 'grey.500',
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="body2" align="center">
                    {'© '}
                    {new Date().getFullYear()}
                    {' '}
                    <Link color="inherit" href="https://your-website.com/"> 
                        BookNOW
                    </Link>
                    {' | Inspired by BookMyShow | For Educational Purposes Only'}
                </Typography>
            </Container>
        </Box>
    );
}

export default Footer;