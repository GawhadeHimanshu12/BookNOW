// server/controllers/userController.js

const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching profile:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


exports.updateUserProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, organizationName } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (email && email.toLowerCase() !== user.email) {
            const exists = await User.findOne({ email: email.toLowerCase() });
            if (exists) return res.status(400).json({ errors: [{ msg: 'Email already in use' }] });
            user.email = email.toLowerCase();
        }

        if (name) user.name = name;
        
        if (user.role === 'organizer' && organizationName) {
            user.organizationName = organizationName;
        }

        await user.save();
        
        res.status(200).json({ 
            success: true, 
            msg: 'Profile updated successfully', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide both current and new passwords' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.password) {
            return res.status(400).json({ msg: 'You used a social login. Please reset your password via email.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};