// client/src/components/Seat.jsx
import React from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ChairIcon from '@mui/icons-material/Chair';
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined'; 
import EventSeatIcon from '@mui/icons-material/EventSeat';
import AccessibleIcon from '@mui/icons-material/Accessible'; 
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal'; 
import BlockIcon from '@mui/icons-material/Block';

const Seat = ({ seatData, isSelected, onSelect }) => {
    const { identifier = 'N/A', type = 'Normal', isBooked = false } = seatData || {};

    let seatIcon;
    let seatColor = 'success'; 
    let isDisabled = false;
    let tooltipTitle = `Seat ${identifier} (${type})`;

    if (isBooked) {
        seatIcon = <BlockIcon />;
        seatColor = 'disabled';
        isDisabled = true;
        tooltipTitle = `Seat ${identifier} (Booked)`;
    } else if (isSelected) {
        seatIcon = <EventSeatIcon />;
        seatColor = 'error';
        tooltipTitle = `Seat ${identifier} (Selected)`;
    } else {
        switch (type?.toLowerCase()) {
            case 'premium':
            case 'vip':
            case 'recliner':
                seatIcon = <AirlineSeatReclineNormalIcon />;
                seatColor = 'warning';
                break;
            case 'wheelchair':
                seatIcon = <AccessibleIcon />;
                seatColor = 'info';
                break;
            case 'unavailable':
                 seatIcon = <ChairIcon sx={{ opacity: 0.3 }}/>;
                 seatColor = 'disabled';
                 isDisabled = true;
                 tooltipTitle = `Seat ${identifier} (Unavailable)`;
                 break;
            default: 
                seatIcon = <ChairOutlinedIcon />;
                seatColor = 'success';
                break;
        }
    }

    const handleClick = () => {
        if (!isDisabled && onSelect) {
            onSelect(identifier);
        }
    };

    return (
        <Tooltip title={tooltipTitle} placement="top" arrow>
            <span>
                <Button
                    variant="text"
                    color={seatColor}
                    disabled={isDisabled}
                    onClick={handleClick}
                    aria-label={tooltipTitle}
                    sx={{
                        minWidth: 'auto', p: 0.5, lineHeight: 1, borderRadius: '4px',
                        transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
                        '&:hover:not(:disabled)': {
                           transform: 'scale(1.15)',
                           bgcolor: 'action.hover'
                        }
                    }}
                >
                    {seatIcon}
                </Button>
            </span>
        </Tooltip>
    );
};

export default Seat;