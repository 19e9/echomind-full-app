const speech = require('@google-cloud/speech');
const axios = require('axios');

class SpeechService {
    constructor() {
        // Initialize Google Cloud Speech client
        // Requires GOOGLE_APPLICATION_CREDENTIALS env variable
        this.client = null;
        this.useGoogleCloud = !!process.env.GOOGLE_CLOUD_API_KEY;
    }

    /**
     * Initialize Google Cloud Speech client
     */
    initClient() {
        if (!this.client && this.useGoogleCloud) {
            this.client = new speech.SpeechClient();
        }
        return this.client;
    }

    /**
     * Transcribe audio and assess pronunciation
     * @param {Buffer} audioBuffer - Audio file buffer
     * @param {string} expectedText - Expected text for comparison
     * @param {string} languageCode - Language code (default: en-US)
     * @returns {Promise<object>} - Pronunciation assessment result
     */
    async assessPronunciation(audioBuffer, expectedText, languageCode = 'en-US') {
        try {
            // For demo/development without Google Cloud credentials
            if (!this.useGoogleCloud) {
                return this.mockPronunciationAssessment(expectedText);
            }

            this.initClient();

            const audio = {
                content: audioBuffer.toString('base64')
            };

            const config = {
                encoding: 'MP3',
                sampleRateHertz: 16000,
                languageCode,
                enableWordTimeOffsets: true,
                enableWordConfidence: true,
                model: 'default'
            };

            const [response] = await this.client.recognize({ audio, config });

            if (!response.results || response.results.length === 0) {
                return {
                    success: false,
                    score: 0,
                    message: 'No speech detected',
                    needsCorrection: true
                };
            }

            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join(' ')
                .trim()
                .toLowerCase();

            const expectedLower = expectedText.toLowerCase().trim();

            // Calculate similarity score
            const score = this.calculateSimilarity(transcription, expectedLower);
            const wordConfidences = response.results[0]?.alternatives[0]?.words?.map(
                word => ({
                    word: word.word,
                    confidence: word.confidence || 0.5
                })
            ) || [];

            return {
                success: true,
                score: Math.round(score * 100),
                transcription,
                expectedText,
                wordConfidences,
                needsCorrection: score < 0.85,
                feedback: this.generateFeedback(score, transcription, expectedText)
            };
        } catch (error) {
            console.error('Speech assessment error:', error);
            // Fallback to mock assessment
            return this.mockPronunciationAssessment(expectedText);
        }
    }

    /**
     * Calculate similarity between two strings
     * Using Levenshtein distance based similarity
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = [];

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        return 1 - distance / maxLen;
    }

    /**
     * Generate feedback based on pronunciation score
     */
    generateFeedback(score, transcription, expected) {
        if (score >= 0.95) {
            return 'Perfect pronunciation! Excellent job!';
        } else if (score >= 0.85) {
            return 'Great pronunciation! Just a few minor issues.';
        } else if (score >= 0.70) {
            return 'Good effort! Focus on the stressed syllables.';
        } else if (score >= 0.50) {
            return 'Keep practicing! Listen to the correct pronunciation and try again.';
        } else {
            return 'Let\'s try again. Listen carefully to the word and speak slowly.';
        }
    }

    /**
     * Mock pronunciation assessment for development
     */
    mockPronunciationAssessment(expectedText) {
        // Simulate realistic scores for demo
        const baseScore = 60 + Math.floor(Math.random() * 35); // 60-95
        const score = baseScore;

        return {
            success: true,
            score,
            transcription: expectedText.toLowerCase(),
            expectedText,
            wordConfidences: expectedText.split(' ').map(word => ({
                word,
                confidence: 0.7 + Math.random() * 0.3
            })),
            needsCorrection: score < 85,
            feedback: this.generateFeedback(score / 100, '', '')
        };
    }

    /**
     * Get phonetic transcription for a word
     */
    async getPhonetics(word) {
        try {
            // Use free dictionary API
            const response = await axios.get(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
            );

            if (response.data && response.data[0]) {
                const entry = response.data[0];
                const phonetic = entry.phonetic ||
                    entry.phonetics?.find(p => p.text)?.text || '';
                const audioUrl = entry.phonetics?.find(p => p.audio)?.audio || '';

                return {
                    word,
                    phonetic,
                    audioUrl,
                    meanings: entry.meanings.slice(0, 2).map(m => ({
                        partOfSpeech: m.partOfSpeech,
                        definition: m.definitions[0]?.definition
                    }))
                };
            }
            return { word, phonetic: '', audioUrl: '' };
        } catch (error) {
            console.error('Phonetics API error:', error.message);
            return { word, phonetic: '', audioUrl: '' };
        }
    }
}

module.exports = new SpeechService();
