const heygenService = require('../services/heygenService');
const tavusService = require('../services/tavusService');
const User = require('../models/User');

// ==================== HeyGen Video Controllers ====================

// @desc    Create a video lesson
// @route   POST /api/video/create
// @access  Private
exports.createVideo = async (req, res) => {
    try {
        const { script, avatarId, voiceId, background } = req.body;

        if (!script) {
            return res.status(400).json({
                success: false,
                message: 'Script is required'
            });
        }

        const result = await heygenService.createVideo({
            avatarId: avatarId || 'default_avatar',
            voiceId: voiceId || 'default_voice',
            script,
            background
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Create video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create video'
        });
    }
};

// @desc    Get video status
// @route   GET /api/video/status/:videoId
// @access  Private
exports.getVideoStatus = async (req, res) => {
    try {
        const { videoId } = req.params;
        const result = await heygenService.getVideoStatus(videoId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get video status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get video status'
        });
    }
};

// @desc    Get available avatars
// @route   GET /api/video/avatars
// @access  Private
exports.getAvatars = async (req, res) => {
    try {
        const avatars = await heygenService.getAvatars();

        res.json({
            success: true,
            data: { avatars }
        });
    } catch (error) {
        console.error('Get avatars error:', error);
        // Return mock data for demo
        res.json({
            success: true,
            data: {
                avatars: [
                    { id: 'teacher_1', name: 'Emma - English Teacher', preview: null },
                    { id: 'teacher_2', name: 'John - Native Speaker', preview: null },
                    { id: 'teacher_3', name: 'Sarah - Conversation Partner', preview: null }
                ]
            }
        });
    }
};

// @desc    Get available voices
// @route   GET /api/video/voices
// @access  Private
exports.getVoices = async (req, res) => {
    try {
        const voices = await heygenService.getVoices();

        res.json({
            success: true,
            data: { voices }
        });
    } catch (error) {
        console.error('Get voices error:', error);
        res.json({
            success: true,
            data: {
                voices: [
                    { id: 'voice_1', name: 'American English - Female', language: 'en-US' },
                    { id: 'voice_2', name: 'British English - Male', language: 'en-GB' },
                    { id: 'voice_3', name: 'American English - Male', language: 'en-US' }
                ]
            }
        });
    }
};

// ==================== Tavus Avatar Controllers ====================

// @desc    Start a conversation session
// @route   POST /api/avatar/conversation
// @access  Private
exports.startConversation = async (req, res) => {
    try {
        const { topic, replicaId } = req.body;
        const user = await User.findById(req.user.id);

        // Create context based on user level and topic
        const context = `You are an English language tutor helping a ${user.level || 'beginner'} level student. 
    The conversation topic is: ${topic || 'general conversation practice'}.
    Speak clearly and adjust your vocabulary to the student's level.
    Encourage the student and provide gentle corrections when needed.`;

        const result = await tavusService.createConversation({
            replicaId: replicaId || 'default_replica',
            conversationName: `EchoMind - ${topic || 'Practice Session'}`,
            customGreeting: `Hello! I am here to help you practice English. Today we will talk about ${topic || 'anything you like'}. Are you ready?`,
            context
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Start conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start conversation'
        });
    }
};

// @desc    End a conversation session
// @route   POST /api/avatar/conversation/:conversationId/end
// @access  Private
exports.endConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        await tavusService.endConversation(conversationId);

        res.json({
            success: true,
            message: 'Conversation ended successfully'
        });
    } catch (error) {
        console.error('End conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end conversation'
        });
    }
};

// @desc    Get conversation status
// @route   GET /api/avatar/conversation/:conversationId
// @access  Private
exports.getConversationStatus = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const result = await tavusService.getConversationStatus(conversationId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get conversation status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation status'
        });
    }
};

// @desc    Get available replicas (avatars)
// @route   GET /api/avatar/replicas
// @access  Private
exports.getReplicas = async (req, res) => {
    try {
        const replicas = await tavusService.getReplicas();

        res.json({
            success: true,
            data: { replicas }
        });
    } catch (error) {
        console.error('Get replicas error:', error);
        res.json({
            success: true,
            data: {
                replicas: [
                    { id: 'replica_1', name: 'Alex - Friendly Tutor' },
                    { id: 'replica_2', name: 'Maria - Patient Teacher' },
                    { id: 'replica_3', name: 'David - Native Speaker' }
                ]
            }
        });
    }
};
