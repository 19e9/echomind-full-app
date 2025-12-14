const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['multiple-choice', 'fill-blank', 'listening', 'pronunciation'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: {
        type: String
    },
    audioUrl: {
        type: String
    },
    points: {
        type: Number,
        default: 10
    }
});

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'placement'],
        required: true
    },
    category: {
        type: String,
        enum: ['grammar', 'vocabulary', 'listening', 'pronunciation', 'placement-test'],
        required: true
    },
    questions: [quizQuestionSchema],
    timeLimit: {
        type: Number,
        default: null
    },
    passingScore: {
        type: Number,
        default: 60
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
