const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getReels,
    toggleLike,
    toggleBookmark,
    trackView,
    addReel,
    deleteReel
} = require('../controllers/reelsController');

// Public routes (still need auth for user-specific data)
router.get('/', protect, getReels);

// User interaction routes
router.post('/like/:id', protect, toggleLike);
router.post('/bookmark/:id', protect, toggleBookmark);
router.post('/view/:id', protect, trackView);

// Admin routes
router.post('/', protect, admin, addReel);
router.delete('/:id', protect, admin, deleteReel);

module.exports = router;
