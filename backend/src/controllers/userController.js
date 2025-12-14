const User = require('../models/User');
const Progress = require('../models/Progress');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, preferences } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, preferences },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Get progress data
        const totalQuizzes = await Progress.countDocuments({
            user: req.user.id,
            type: 'quiz'
        });

        const wordsLearned = await Progress.countDocuments({
            user: req.user.id,
            type: 'word-learned'
        });

        const pronunciationPractices = await Progress.countDocuments({
            user: req.user.id,
            type: 'pronunciation-practice'
        });

        // Get recent activity
        const recentActivity = await Progress.find({ user: req.user.id })
            .sort({ completedAt: -1 })
            .limit(10)
            .populate('quiz', 'title')
            .populate('word', 'word');

        res.json({
            success: true,
            data: {
                points: user.points,
                dailyStreak: user.dailyStreak,
                level: user.level,
                totalQuizzes,
                wordsLearned,
                pronunciationPractices,
                recentActivity
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get stats'
        });
    }
};

// @desc    Update user level after placement test
// @route   PUT /api/users/level
// @access  Private
exports.updateLevel = async (req, res) => {
    try {
        const { level, testScore } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                level,
                levelTestCompleted: true,
                points: req.user.points + 100 // Bonus points for completing test
            },
            { new: true }
        );

        // Record progress
        await Progress.create({
            user: req.user.id,
            type: 'quiz',
            score: testScore,
            pointsEarned: 100,
            details: { type: 'placement-test', level }
        });

        res.json({
            success: true,
            message: 'Level updated successfully',
            data: {
                level: user.level,
                points: user.points
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update level'
        });
    }
};
