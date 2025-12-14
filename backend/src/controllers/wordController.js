const Word = require('../models/Word');
const Progress = require('../models/Progress');
const User = require('../models/User');

// @desc    Get daily word
// @route   GET /api/words/daily
// @access  Private
exports.getDailyWord = async (req, res) => {
    try {
        const userLevel = req.user.level || 'beginner';

        // Get a random word for user's level
        // In production, this would be a scheduled word
        const count = await Word.countDocuments({ level: userLevel });
        const random = Math.floor(Math.random() * count);

        let word = await Word.findOne({ level: userLevel }).skip(random);

        // Fallback to sample word if DB is empty
        if (!word) {
            word = {
                word: 'Perseverance',
                meaning: 'Persistence in doing something despite difficulty or delay in achieving success',
                pronunciation: '/ˌpɜː.sɪˈvɪə.rəns/',
                phonetic: 'per-suh-VEER-uhns',
                level: 'intermediate',
                partOfSpeech: 'noun',
                exampleSentence: 'Her perseverance was rewarded when she finally passed the exam.',
                synonyms: ['persistence', 'determination', 'tenacity'],
                antonyms: ['laziness', 'inactivity']
            };
        }

        res.json({
            success: true,
            data: { word }
        });
    } catch (error) {
        console.error('Get daily word error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily word'
        });
    }
};

// @desc    Get words by level
// @route   GET /api/words
// @access  Private
exports.getWords = async (req, res) => {
    try {
        const { level, category, page = 1, limit = 20 } = req.query;
        const userLevel = level || req.user.level || 'beginner';

        const query = { level: userLevel };

        const words = await Word.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Word.countDocuments(query);

        res.json({
            success: true,
            data: {
                words,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get words error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get words'
        });
    }
};

// @desc    Mark word as learned
// @route   POST /api/words/:id/learned
// @access  Private
exports.markWordLearned = async (req, res) => {
    try {
        const word = await Word.findById(req.params.id);

        if (!word) {
            return res.status(404).json({
                success: false,
                message: 'Word not found'
            });
        }

        // Check if already learned
        const existingProgress = await Progress.findOne({
            user: req.user.id,
            word: word._id,
            type: 'word-learned'
        });

        if (existingProgress) {
            return res.json({
                success: true,
                message: 'Word already marked as learned',
                data: { alreadyLearned: true }
            });
        }

        // Record progress
        await Progress.create({
            user: req.user.id,
            word: word._id,
            type: 'word-learned',
            pointsEarned: 5
        });

        // Update user points
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { points: 5 }
        });

        res.json({
            success: true,
            message: 'Word marked as learned',
            data: { pointsEarned: 5 }
        });
    } catch (error) {
        console.error('Mark word learned error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark word as learned'
        });
    }
};

// @desc    Get learned words
// @route   GET /api/words/learned
// @access  Private
exports.getLearnedWords = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const progress = await Progress.find({
            user: req.user.id,
            type: 'word-learned'
        })
            .populate('word')
            .sort({ completedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const words = progress.map(p => p.word).filter(Boolean);
        const total = await Progress.countDocuments({
            user: req.user.id,
            type: 'word-learned'
        });

        res.json({
            success: true,
            data: {
                words,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get learned words error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get learned words'
        });
    }
};
