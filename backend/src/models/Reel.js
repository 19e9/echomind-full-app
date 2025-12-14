const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'],
        default: 'intermediate'
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    bookmarkedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        name: { type: String, default: 'EchoMind' },
        avatar: { type: String, default: '👨‍🏫' },
        verified: { type: Boolean, default: true }
    },
    sourceType: {
        type: String,
        enum: ['ai-generated', 'uploaded', 'tiktok', 'instagram', 'youtube'],
        default: 'uploaded'
    },
    sourceUrl: {
        type: String,
        default: ''
    },
    aiPrompt: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
reelSchema.index({ isActive: 1, createdAt: -1 });
reelSchema.index({ level: 1 });

module.exports = mongoose.model('Reel', reelSchema);
