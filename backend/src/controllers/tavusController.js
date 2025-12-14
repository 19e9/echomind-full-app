const axios = require('axios');

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID || 'r79e1c033f';
const TAVUS_PERSONA_ID = process.env.TAVUS_PERSONA_ID;

// @desc    Create Tavus conversation
// @route   POST /api/tavus/create-conversation
// @access  Private
exports.createConversation = async (req, res) => {
    try {
        const { context, greeting } = req.body;

        if (!TAVUS_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Tavus API key not configured'
            });
        }

        // Prepare conversation data
        const conversationData = {
            replica_id: TAVUS_REPLICA_ID,
            conversation_name: `EchoMind Session - ${Date.now()}`,
            conversational_context: context || 'You are a helpful English conversation partner.',
            custom_greeting: greeting || 'Hello! How can I help you today?',
            properties: {
                max_call_duration: 1800, // 30 minutes max
                participant_left_timeout: 60,
                enable_recording: false,
                apply_greenscreen: false,
                language: 'english'
            }
        };

        // Add persona_id if available
        if (TAVUS_PERSONA_ID) {
            conversationData.persona_id = TAVUS_PERSONA_ID;
        }

        console.log('Creating Tavus conversation...');

        const response = await axios.post(
            'https://tavusapi.com/v2/conversations',
            conversationData,
            {
                headers: {
                    'x-api-key': TAVUS_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.data?.conversation_url) {
            console.log('Tavus conversation created successfully');
            res.json({
                success: true,
                conversation_url: response.data.conversation_url,
                conversation_id: response.data.conversation_id
            });
        } else {
            throw new Error('No conversation_url in response');
        }
    } catch (error) {
        console.error('Tavus API error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('- Message:', error.message);
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to create conversation',
            details: error.response?.data
        });
    }
};

// @desc    End Tavus conversation
// @route   POST /api/tavus/end-conversation
// @access  Private
exports.endConversation = async (req, res) => {
    try {
        const { conversation_id } = req.body;

        if (!conversation_id) {
            return res.status(400).json({
                success: false,
                message: 'conversation_id is required'
            });
        }

        // Tavus doesn't have a specific end endpoint, 
        // conversation ends when participant leaves
        res.json({
            success: true,
            message: 'Conversation ended'
        });
    } catch (error) {
        console.error('End conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end conversation'
        });
    }
};
