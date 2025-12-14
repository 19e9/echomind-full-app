const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: 100
    },
    body: {
        type: String,
        required: [true, 'Body is required'],
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'reminder', 'achievement'],
        default: 'info'
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isGlobal: {
        type: Boolean,
        default: false
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetUsers: 1 });
notificationSchema.index({ isGlobal: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
