const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    meaning: {
        type: String,
        required: true
    },
    pronunciation: {
        type: String,
        required: true
    },
    phonetic: {
        type: String
    },
    level: {
        type: String,
        enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'],
        required: true
    },
    partOfSpeech: {
        type: String,
        enum: ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection'],
        required: true
    },
    exampleSentence: {
        type: String,
        required: true
    },
    exampleTranslation: {
        type: String
    },
    audioUrl: {
        type: String
    },
    imageUrl: {
        type: String
    },
    synonyms: [{
        type: String
    }],
    antonyms: [{
        type: String
    }],
    tags: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Word', wordSchema);
