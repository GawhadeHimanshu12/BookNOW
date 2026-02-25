// client/src/components/ReviewForm.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Rating, CircularProgress, Alert } from '@mui/material';
import { createReviewApi } from '../api/reviews'; 

const ReviewForm = ({ movieId, onSubmitSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating before submitting.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newReview = await createReviewApi(movieId, { rating, comment });
            
            if (onSubmitSuccess) {
                onSubmitSuccess(newReview);
            }
            setRating(0);
            setComment('');

        } catch (err) {
            setError(err.msg || err.message || 'Failed to submit review.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Write a Review</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography component="legend" sx={{ mr: 2 }}>Your Rating*:</Typography>
                <Rating
                    name="rating"
                    value={rating}
                    precision={0.5}
                    onChange={(event, newValue) => {
                        setRating(newValue || 0);
                        setError(null); 
                    }}
                />
            </Box>
            
            <TextField
                label="Your Review (Optional)"
                multiline
                rows={4}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
            />
            
            <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                disabled={isLoading || rating === 0}
            >
                {isLoading ? <CircularProgress size={24} /> : 'Submit Review'}
            </Button>
        </Box>
    );
};

export default ReviewForm;