const User = require('../models/User'); 


exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); 
    } else {
        res.status(403).json({ msg: 'Access denied. Admin role required.' }); 
    }
};


exports.isOrganizerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
        
        
        
        next(); 
    } else {
        res.status(403).json({ msg: 'Access denied. Organizer or Admin role required.' }); 
    }
};


exports.isOrganizer = async (req, res, next) => {
    
    if (!req.user || req.user.role !== 'organizer') {
        return res.status(403).json({ msg: 'Access denied. Organizer role required.' });
    }

    
    
    try {
        const organizer = await User.findById(req.user.id).select('isApproved');
        if (!organizer) {
            return res.status(401).json({ msg: 'Organizer not found, authorization denied.' });
        }
        if (!organizer.isApproved) {
            return res.status(403).json({ msg: 'Access denied. Organizer account not approved.' });
        }
        
        next(); 
    } catch (error) {
        console.error("Error checking organizer approval status:", error);
        res.status(500).json({ msg: 'Server error during authorization check.' });
    }
};