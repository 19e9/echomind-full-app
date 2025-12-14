const speechService = require('../services/speechService');
const elevenLabsService = require('../services/elevenLabsService');
const User = require('../models/User');
const Progress = require('../models/Progress');
const path = require('path');
const fs = require('fs').promises;

// Daily voice clone limit per user
const DAILY_CLONE_LIMIT = 5;

// @desc    Analyze pronunciation
// @route   POST /api/pronunciation/analyze
// @access  Private
exports.analyzePronunciation = async (req, res) => {
    try {
        const { text } = req.body;
        const audioFile = req.file;

        if (!audioFile || !text) {
            return res.status(400).json({
                success: false,
                message: 'Audio file and text are required'
            });
        }

        // Analyze pronunciation
        const result = await speechService.assessPronunciation(
            audioFile.buffer,
            text
        );

        // Record progress
        await Progress.create({
            user: req.user.id,
            type: 'pronunciation-practice',
            score: result.score,
            pointsEarned: Math.floor(result.score / 10),
            details: {
                word: text,
                needsCorrection: result.needsCorrection
            }
        });

        // Update user points
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { points: Math.floor(result.score / 10) }
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Pronunciation analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze pronunciation'
        });
    }
};

// @desc    Get correct pronunciation with user's cloned voice
// @route   POST /api/pronunciation/clone-correct
// @access  Private
exports.getClonedCorrectPronunciation = async (req, res) => {
    try {
        const { text } = req.body;
        const audioFile = req.file;
        const user = await User.findById(req.user.id);

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        // Check daily limit
        const today = new Date().setHours(0, 0, 0, 0);
        const lastReset = new Date(user.lastActiveDate).setHours(0, 0, 0, 0);

        if (today > lastReset) {
            user.dailyVoiceCloneUsage = 0;
        }

        if (user.dailyVoiceCloneUsage >= DAILY_CLONE_LIMIT) {
            return res.status(429).json({
                success: false,
                message: `Daily voice clone limit (${DAILY_CLONE_LIMIT}) reached. Try again tomorrow!`
            });
        }

        let voiceId = user.voiceCloneId;

        // Clone voice if not exists and audio provided
        if (!voiceId && audioFile) {
            const cloneResult = await elevenLabsService.cloneVoice(
                audioFile.buffer,
                `echomind_user_${user._id}`
            );
            voiceId = cloneResult.voice_id;
            user.voiceCloneId = voiceId;
        }

        if (!voiceId) {
            return res.status(400).json({
                success: false,
                message: 'No voice clone available. Please provide an audio sample.'
            });
        }

        // Generate correct pronunciation with cloned voice
        const audioBuffer = await elevenLabsService.textToSpeech(text, voiceId, {
            stability: 0.7,
            similarity_boost: 0.8
        });

        // Update usage
        user.dailyVoiceCloneUsage += 1;
        await user.save();

        // Return audio as base64
        res.json({
            success: true,
            data: {
                audio: audioBuffer.toString('base64'),
                contentType: 'audio/mpeg',
                usageRemaining: DAILY_CLONE_LIMIT - user.dailyVoiceCloneUsage,
                text
            }
        });
    } catch (error) {
        console.error('Voice clone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate cloned pronunciation'
        });
    }
};

// @desc    Get phonetics for a word
// @route   GET /api/pronunciation/phonetics/:word
// @access  Private
exports.getPhonetics = async (req, res) => {
    try {
        const { word } = req.params;
        const phonetics = await speechService.getPhonetics(word);

        res.json({
            success: true,
            data: phonetics
        });
    } catch (error) {
        console.error('Phonetics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get phonetics'
        });
    }
};

// @desc    Get user's voice clone status
// @route   GET /api/pronunciation/voice-status
// @access  Private
exports.getVoiceStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const today = new Date().setHours(0, 0, 0, 0);
        const lastReset = new Date(user.lastActiveDate).setHours(0, 0, 0, 0);

        let usageRemaining = DAILY_CLONE_LIMIT - user.dailyVoiceCloneUsage;
        if (today > lastReset) {
            usageRemaining = DAILY_CLONE_LIMIT;
        }

        res.json({
            success: true,
            data: {
                hasVoiceClone: !!user.voiceCloneId,
                usageRemaining,
                dailyLimit: DAILY_CLONE_LIMIT
            }
        });
    } catch (error) {
        console.error('Voice status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get voice status'
        });
    }
};

// @desc    Delete user's voice clone
// @route   DELETE /api/pronunciation/voice-clone
// @access  Private
exports.deleteVoiceClone = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.voiceCloneId) {
            await elevenLabsService.deleteVoice(user.voiceCloneId);
            user.voiceCloneId = null;
            await user.save();
        }

        res.json({
            success: true,
            message: 'Voice clone deleted successfully'
        });
    } catch (error) {
        console.error('Delete voice clone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete voice clone'
        });
    }
};
