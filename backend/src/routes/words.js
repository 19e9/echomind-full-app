const express = require('express');
const router = express.Router();
const {
    getDailyWord,
    getWords,
    markWordLearned,
    getLearnedWords
} = require('../controllers/wordController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/daily', getDailyWord);
router.get('/learned', getLearnedWords);
router.get('/', getWords);
router.post('/:id/learned', markWordLearned);

module.exports = router;
