const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    analyzePronunciation,
    getClonedCorrectPronunciation,
    getPhonetics,
    getVoiceStatus,
    deleteVoiceClone
} = require('../controllers/pronunciationController');
const { protect } = require('../middleware/auth');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/m4a'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid audio file type'), false);
        }
    }
});

// All routes are protected
router.use(protect);

// Analyze pronunciation from audio
router.post('/analyze', upload.single('audio'), analyzePronunciation);

// Get correct pronunciation with cloned voice
router.post('/clone-correct', upload.single('audio'), getClonedCorrectPronunciation);

// Get phonetics for a word
router.get('/phonetics/:word', getPhonetics);

// Get voice clone status
router.get('/voice-status', getVoiceStatus);

// Delete voice clone
router.delete('/voice-clone', deleteVoiceClone);

module.exports = router;
