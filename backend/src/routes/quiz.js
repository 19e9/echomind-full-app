const express = require('express');
const router = express.Router();
const {
    getPlacementTest,
    getQuizzes,
    getQuiz,
    submitQuiz
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/placement-test', getPlacementTest);
router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.post('/:id/submit', submitQuiz);

module.exports = router;
