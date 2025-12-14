const express = require('express');
const router = express.Router();
const {
    startConversation,
    endConversation,
    getConversationStatus,
    getReplicas
} = require('../controllers/videoController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Tavus avatar routes
router.post('/conversation', startConversation);
router.post('/conversation/:conversationId/end', endConversation);
router.get('/conversation/:conversationId', getConversationStatus);
router.get('/replicas', getReplicas);

module.exports = router;
