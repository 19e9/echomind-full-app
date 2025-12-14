const axios = require('axios');

class TavusService {
    constructor() {
        this.apiKey = process.env.TAVUS_API_KEY;
        this.baseUrl = 'https://tavusapi.com/v2';
    }

    /**
     * Create a conversational avatar session
     * @param {object} options - Session options
     * @returns {Promise<object>} - Session details
     */
    async createConversation(options) {
        try {
            const {
                replicaId,
                conversationName,
                customGreeting,
                context
            } = options;

            const response = await axios.post(
                `${this.baseUrl}/conversations`,
                {
                    replica_id: replicaId,
                    conversation_name: conversationName || 'EchoMind Practice Session',
                    custom_greeting: customGreeting || 'Hello! I\'m here to help you practice English. Let\'s have a conversation!',
                    properties: {
                        max_call_duration: 600, // 10 minutes
                        enable_recording: false,
                        language: 'english',
                        context: context || 'You are an English language tutor helping a student practice conversational English.'
                    }
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                conversationId: response.data.conversation_id,
                conversationUrl: response.data.conversation_url,
                status: response.data.status
            };
        } catch (error) {
            console.error('Tavus create conversation error:', error.response?.data || error.message);
            throw new Error('Failed to create conversation');
        }
    }

    /**
     * End a conversation
     * @param {string} conversationId - Conversation ID
     */
    async endConversation(conversationId) {
        try {
            await axios.post(
                `${this.baseUrl}/conversations/${conversationId}/end`,
                {},
                {
                    headers: { 'x-api-key': this.apiKey }
                }
            );
            return true;
        } catch (error) {
            console.error('Tavus end conversation error:', error.response?.data || error.message);
            throw new Error('Failed to end conversation');
        }
    }

    /**
     * Get conversation status
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<object>}
     */
    async getConversationStatus(conversationId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/conversations/${conversationId}`,
                {
                    headers: { 'x-api-key': this.apiKey }
                }
            );

            return {
                conversationId: response.data.conversation_id,
                status: response.data.status,
                duration: response.data.call_duration
            };
        } catch (error) {
            console.error('Tavus get status error:', error.response?.data || error.message);
            throw new Error('Failed to get conversation status');
        }
    }

    /**
     * Get available replicas (avatars)
     * @returns {Promise<Array>}
     */
    async getReplicas() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/replicas`,
                {
                    headers: { 'x-api-key': this.apiKey }
                }
            );
            return response.data.replicas || [];
        } catch (error) {
            console.error('Tavus get replicas error:', error.response?.data || error.message);
            throw new Error('Failed to get replicas');
        }
    }
}

module.exports = new TavusService();
