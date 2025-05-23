// client/src/layouts/Footer.jsx
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
                    <Link color="inherit" href=""> 
                        BookNOW
                    </Link>
                    }
                </Typography>
                
            </Container>
        </Box>
    );
}

export default Footer;
