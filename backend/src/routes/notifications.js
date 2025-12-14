const express = require('express');
const router = express.Router();
const {
    sendNotification,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getAllNotifications,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/auth');

// Protected routes
router.use(protect);

// User routes
router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Admin routes
router.post('/send', admin, sendNotification);
router.get('/all', admin, getAllNotifications);
router.delete('/:id', admin, deleteNotification);

module.exports = router;
