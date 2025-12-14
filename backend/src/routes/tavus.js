const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createConversation, endConversation } = require('../controllers/tavusController');

// Tavus conversation routes
router.post('/create-conversation', protect, createConversation);
router.post('/end-conversation', protect, endConversation);

module.exports = router;
