const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    word: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word'
    },
    type: {
        type: String,
        enum: ['quiz', 'word-learned', 'pronunciation-practice', 'daily-streak'],
        required: true
    },
    score: {
        type: Number
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
progressSchema.index({ user: 1, type: 1, completedAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);
