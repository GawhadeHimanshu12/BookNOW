const City = require('../models/City');
const mongoose = require('mongoose');

exports.getActiveCities = async (req, res) => {
     try {
        const cities = await City.find({ isActive: true }).select('name state').sort({ name: 1 }); // Only return name/state
        res.status(200).json(cities);
    } catch (err) {
        console.error('Error fetching active cities:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};