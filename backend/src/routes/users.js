const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getStats,
    updateLevel
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getStats);
router.put('/level', updateLevel);

module.exports = router;
