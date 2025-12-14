const axios = require('axios');

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
    }

    /**
     * Clone a voice from an audio sample
     * @param {Buffer} audioBuffer - Audio file buffer
     * @param {string} name - Name for the cloned voice
     * @returns {Promise<{voice_id: string}>}
     */
    async cloneVoice(audioBuffer, name) {
        try {
            const FormData = require('form-data');
            const formData = new FormData();

            formData.append('name', name);
            formData.append('description', 'EchoMind user voice clone');
            formData.append('files', audioBuffer, {
                filename: 'voice_sample.mp3',
                contentType: 'audio/mpeg'
            });

            const response = await axios.post(
                `${this.baseUrl}/voices/add`,
                formData,
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        ...formData.getHeaders()
                    }
                }
            );

            return {
                voice_id: response.data.voice_id,
                name: response.data.name
            };
        } catch (error) {
            console.error('ElevenLabs clone voice error:', error.response?.data || error.message);
            throw new Error('Failed to clone voice');
        }
    }

    /**
     * Generate speech from text using a specific voice
     * @param {string} text - Text to synthesize
     * @param {string} voiceId - Voice ID to use
     * @param {object} options - Voice settings
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async textToSpeech(text, voiceId, options = {}) {
        try {
            const {
                stability = 0.5,
                similarity_boost = 0.75,
                style = 0.0,
                use_speaker_boost = true
            } = options;

            const response = await axios.post(
                `${this.baseUrl}/text-to-speech/${voiceId}`,
                {
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability,
                        similarity_boost,
                        style,
                        use_speaker_boost
                    }
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                }
            );

            return Buffer.from(response.data);
        } catch (error) {
            console.error('ElevenLabs TTS error:', error.response?.data || error.message);
            throw new Error('Failed to generate speech');
        }
    }

    /**
     * Get all available voices
     * @returns {Promise<Array>}
     */
    async getVoices() {
        try {
            const response = await axios.get(`${this.baseUrl}/voices`, {
                headers: { 'xi-api-key': this.apiKey }
            });
            return response.data.voices;
        } catch (error) {
            console.error('ElevenLabs get voices error:', error.response?.data || error.message);
            throw new Error('Failed to get voices');
        }
    }

    /**
     * Delete a cloned voice
     * @param {string} voiceId - Voice ID to delete
     */
    async deleteVoice(voiceId) {
        try {
            await axios.delete(`${this.baseUrl}/voices/${voiceId}`, {
                headers: { 'xi-api-key': this.apiKey }
            });
            return true;
        } catch (error) {
            console.error('ElevenLabs delete voice error:', error.response?.data || error.message);
            throw new Error('Failed to delete voice');
        }
    }

    /**
     * Get user subscription info (for usage limits)
     * @returns {Promise<object>}
     */
    async getSubscription() {
        try {
            const response = await axios.get(`${this.baseUrl}/user/subscription`, {
                headers: { 'xi-api-key': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error('ElevenLabs subscription error:', error.response?.data || error.message);
            throw new Error('Failed to get subscription info');
        }
    }
}

module.exports = new ElevenLabsService();
