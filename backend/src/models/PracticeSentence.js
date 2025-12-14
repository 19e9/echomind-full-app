const mongoose = require('mongoose');

const practiceSentenceSchema = new mongoose.Schema({
    sentence: {
        type: String,
        required: true,
        trim: true
    },
    heygen_video_url: {
        type: String,
        default: null
    },
    audio_url: {
        type: String,
        default: null
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'],
        required: true
    },
    topic: {
        type: String,
        enum: ['grammar', 'vocabulary', 'pronunciation', 'conversation', 'business'],
        default: 'pronunciation'
    },
    phonetic: {
        type: String,
        default: null
    },
    translation: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Get random sentence by level
practiceSentenceSchema.statics.getRandomByLevel = async function (level) {
    const count = await this.countDocuments({ level });
    if (count === 0) return null;

    const random = Math.floor(Math.random() * count);
    return this.findOne({ level }).skip(random);
};

module.exports = mongoose.model('PracticeSentence', practiceSentenceSchema);
