const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const User = require('../models/User');

// @desc    Get placement test
// @route   GET /api/quiz/placement-test
// @access  Private
exports.getPlacementTest = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            level: 'placement',
            category: 'placement-test',
            isActive: true
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Placement test not found'
            });
        }

        res.json({
            success: true,
            data: { quiz }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get placement test'
        });
    }
};

// @desc    Get quizzes by level
// @route   GET /api/quiz
// @access  Private
exports.getQuizzes = async (req, res) => {
    try {
        const userLevel = req.user.level;
        const { category, page = 1, limit = 10 } = req.query;

        const query = {
            isActive: true,
            level: userLevel
        };

        if (category) {
            query.category = category;
        }

        const quizzes = await Quiz.find(query)
            .select('title description category timeLimit passingScore')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Quiz.countDocuments(query);

        res.json({
            success: true,
            data: {
                quizzes,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get quizzes'
        });
    }
};

// @desc    Get single quiz
// @route   GET /api/quiz/:id
// @access  Private
exports.getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        res.json({
            success: true,
            data: { quiz }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get quiz'
        });
    }
};

// @desc    Submit quiz answers
// @route   POST /api/quiz/:id/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        const { answers } = req.body;

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Calculate score
        let correctCount = 0;
        const results = quiz.questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            if (isCorrect) correctCount++;

            return {
                question: question.question,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation
            };
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;

        // Calculate points earned
        const pointsEarned = passed ? Math.round(score / 10) * 10 : Math.round(score / 20) * 5;

        // Update user points
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { points: pointsEarned }
        });

        // Save progress
        await Progress.create({
            user: req.user.id,
            quiz: quiz._id,
            type: 'quiz',
            score,
            pointsEarned,
            details: {
                correctCount,
                totalQuestions: quiz.questions.length,
                category: quiz.category
            }
        });

        // Determine level if placement test
        let determinedLevel = null;
        if (quiz.category === 'placement-test') {
            if (score >= 90) determinedLevel = 'advanced';
            else if (score >= 75) determinedLevel = 'upper-intermediate';
            else if (score >= 60) determinedLevel = 'intermediate';
            else if (score >= 40) determinedLevel = 'elementary';
            else determinedLevel = 'beginner';
        }

        res.json({
            success: true,
            data: {
                score,
                passed,
                pointsEarned,
                correctCount,
                totalQuestions: quiz.questions.length,
                results,
                determinedLevel
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit quiz'
        });
    }
};
