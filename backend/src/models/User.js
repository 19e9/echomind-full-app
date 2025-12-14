const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'],
        default: null
    },
    levelTestCompleted: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 0
    },
    dailyStreak: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: Date,
        default: Date.now
    },
    dailyCloneCount: {
        type: Number,
        default: 0
    },
    lastCloneDate: {
        type: String,
        default: null
    },
    voiceCloneId: {
        type: String,
        default: null
    },
    dailyVoiceCloneUsage: {
        type: Number,
        default: 0
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'dark'
        },
        notifications: {
            type: Boolean,
            default: true
        },
        dailyGoal: {
            type: Number,
            default: 10
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update streak on activity
userSchema.methods.updateStreak = function () {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = new Date(this.lastActiveDate).setHours(0, 0, 0, 0);
    const dayDiff = (today - lastActive) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
        this.dailyStreak += 1;
    } else if (dayDiff > 1) {
        this.dailyStreak = 1;
    }
    this.lastActiveDate = new Date();
};

module.exports = mongoose.model('User', userSchema);
