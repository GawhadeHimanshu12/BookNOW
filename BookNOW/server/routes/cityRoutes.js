const express = require('express');
const { getActiveCities } = require('../controllers/cityController');

const router = express.Router();




router.get('/', getActiveCities);

module.exports = router;