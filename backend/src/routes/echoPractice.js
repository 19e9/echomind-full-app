const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    generateWithAI,
    getRandomSentence,
    analyzeAndCorrect,
    addSentences,
    getAllSentences,
    addWord,
    updateWord,
    deleteWord
} = require('../controllers/echoPracticeController');
const { protect, admin } = require('../middleware/auth');

// Configure multer for audio upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// User routes
router.get('/sentence', protect, getRandomSentence);
router.post('/analyze-and-correct', protect, upload.single('audio'), analyzeAndCorrect);

// Admin routes
router.post('/generate', protect, admin, generateWithAI);
router.post('/sentences', protect, admin, addSentences);
router.get('/sentences', protect, admin, getAllSentences);
router.post('/word', protect, admin, addWord);
router.put('/word/:id', protect, admin, updateWord);
router.delete('/word/:id', protect, admin, deleteWord);

module.exports = router;
