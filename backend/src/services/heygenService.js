const axios = require('axios');

class HeyGenService {
    constructor() {
        this.apiKey = process.env.HEYGEN_API_KEY;
        this.baseUrl = 'https://api.heygen.com/v2';
    }

    /**
     * Create a video from a template
     * @param {object} options - Video options
     * @returns {Promise<object>} - Video generation result
     */
    async createVideo(options) {
        try {
            const {
                templateId,
                avatarId,
                voiceId,
                script,
                background
            } = options;

            const response = await axios.post(
                `${this.baseUrl}/video/generate`,
                {
                    video_inputs: [{
                        character: {
                            type: 'avatar',
                            avatar_id: avatarId,
                            avatar_style: 'normal'
                        },
                        voice: {
                            type: 'text',
                            input_text: script,
                            voice_id: voiceId
                        },
                        background: background || {
                            type: 'color',
                            value: '#1a1a2e'
                        }
                    }],
                    dimension: {
                        width: 1920,
                        height: 1080
                    }
                },
                {
                    headers: {
                        'X-Api-Key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                videoId: response.data.data.video_id,
                status: 'processing'
            };
        } catch (error) {
            console.error('HeyGen create video error:', error.response?.data || error.message);
            throw new Error('Failed to create video');
        }
    }

    /**
     * Get video status
     * @param {string} videoId - Video ID
     * @returns {Promise<object>} - Video status
     */
    async getVideoStatus(videoId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/video_status.get?video_id=${videoId}`,
                {
                    headers: { 'X-Api-Key': this.apiKey }
                }
            );

            return {
                status: response.data.data.status,
                videoUrl: response.data.data.video_url,
                thumbnailUrl: response.data.data.thumbnail_url,
                duration: response.data.data.duration
            };
        } catch (error) {
            console.error('HeyGen get status error:', error.response?.data || error.message);
            throw new Error('Failed to get video status');
        }
    }

    /**
     * Get available avatars
     * @returns {Promise<Array>}
     */
    async getAvatars() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/avatars`,
                {
                    headers: { 'X-Api-Key': this.apiKey }
                }
            );
            return response.data.data.avatars;
        } catch (error) {
            console.error('HeyGen get avatars error:', error.response?.data || error.message);
            throw new Error('Failed to get avatars');
        }
    }

    /**
     * Get available voices
     * @returns {Promise<Array>}
     */
    async getVoices() {
        try {
            const response = await axios.get(
                `${this.baseUrl}/voices`,
                {
                    headers: { 'X-Api-Key': this.apiKey }
                }
            );
            return response.data.data.voices;
        } catch (error) {
            console.error('HeyGen get voices error:', error.response?.data || error.message);
            throw new Error('Failed to get voices');
        }
    }
}

module.exports = new HeyGenService();
