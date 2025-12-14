const express = require('express');
const router = express.Router();
const {
    createVideo,
    getVideoStatus,
    getAvatars,
    getVoices
} = require('../controllers/videoController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// HeyGen video routes
router.post('/create', createVideo);
router.get('/status/:videoId', getVideoStatus);
router.get('/avatars', getAvatars);
router.get('/voices', getVoices);

module.exports = router;
