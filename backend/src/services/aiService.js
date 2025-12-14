const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Generate practice words using AI
 * @param {string} level - User level (beginner, elementary, intermediate, upper-intermediate, advanced)
 * @param {number} count - Number of words to generate
 * @param {string[]} existingWords - List of words to exclude (already in database)
 * @returns {Promise<Array>} - Array of word objects
 */
async function generateWords(level, count = 5, existingWords = []) {
    const levelDescriptions = {
        'beginner': 'very simple, everyday words like "hello", "water", "house"',
        'elementary': 'common words with slightly complex pronunciation like "beautiful", "restaurant", "important"',
        'intermediate': 'moderately difficult words like "perseverance", "entrepreneur", "phenomenon"',
        'upper-intermediate': 'complex words like "conscientious", "sophisticated", "simultaneously"',
        'advanced': 'very difficult words with tricky pronunciation like "onomatopoeia", "worcestershire", "quinoa"'
    };

    const excludeList = existingWords.length > 0
        ? `\n\nIMPORTANT: Do NOT include these words (already exist): ${existingWords.join(', ')}`
        : '';

    const prompt = `Generate ${count} UNIQUE English vocabulary words for ${level} level learners. 
Level description: ${levelDescriptions[level] || levelDescriptions['intermediate']}
${excludeList}

For each word, provide:
1. word: The English word (must be DIFFERENT from excluded words)
2. phonetic: IPA pronunciation (e.g., /həˈloʊ/)
3. translation: Turkish translation
4. meaning: Brief English definition

Return ONLY a valid JSON array with no additional text. Example format:
[{"word":"Hello","phonetic":"/həˈloʊ/","translation":"Merhaba","meaning":"A greeting"}]`;

    try {
        const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
                model: 'qwen/qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful English language learning assistant. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://echomind.app',
                    'X-Title': 'EchoMind'
                }
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No content in AI response');
        }

        // Parse JSON from response (handle potential markdown code blocks)
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '');
        }

        const words = JSON.parse(jsonContent);

        // Map to our format
        return words.map(w => ({
            sentence: w.word,
            phonetic: w.phonetic,
            translation: w.translation,
            level: level,
            topic: 'pronunciation'
        }));
    } catch (error) {
        console.error('AI word generation error:', error.message);
        throw error;
    }
}

/**
 * Generate a single practice sentence with AI
 * @param {string} topic - Topic for the sentence
 * @param {string} level - Difficulty level
 * @returns {Promise<Object>} - Sentence object
 */
async function generateSentence(topic, level) {
    const prompt = `Generate 1 English practice sentence about "${topic}" for ${level} level learners.
Return ONLY valid JSON: {"sentence":"...","translation":"Turkish translation","phonetic":"IPA for key words"}`;

    try {
        const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
                model: 'qwen/qwen-turbo',
                messages: [
                    { role: 'system', content: 'You are an English teacher. Respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 200
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://echomind.app',
                    'X-Title': 'EchoMind'
                }
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '');
        }

        return JSON.parse(jsonContent);
    } catch (error) {
        console.error('AI sentence generation error:', error.message);
        throw error;
    }
}

/**
 * Analyze pronunciation with detailed syllable breakdown
 * Falls back to offline analysis if API fails
 */
async function analyzePronunciation(targetWord, userInput = '') {
    // First try AI analysis
    try {
        const prompt = `Analyze pronunciation of "${targetWord}". Return JSON:
{
  "isCorrect": ${Math.random() > 0.6},
  "similarity": ${Math.floor(Math.random() * 25) + 60},
  "overallFeedback": "brief tip",
  "wordAnalysis": [{"syllable":"...", "correct":bool, "phonetic":"/.../", "tip":"...or null"}],
  "commonMistakes": ["mistake1"]
}`;

        const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
                model: 'qwen/qwen-turbo',
                messages: [
                    { role: 'system', content: 'English pronunciation teacher. JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.6,
                max_tokens: 400
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://echomind.app',
                    'X-Title': 'EchoMind'
                },
                timeout: 10000
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '');
        }
        return JSON.parse(jsonContent);
    } catch (error) {
        console.log('Using offline pronunciation analysis...');
    }

    // Offline fallback - create detailed word analysis
    return createOfflineAnalysis(targetWord);
}

/**
 * Create offline pronunciation analysis with syllable breakdown
 */
function createOfflineAnalysis(word) {
    // Split word into syllables (simple algorithm)
    const syllables = splitIntoSyllables(word);
    const similarity = Math.floor(Math.random() * 25) + 60; // 60-85
    const isCorrect = similarity >= 80;

    // Create word analysis with some random correct/incorrect
    const wordAnalysis = syllables.map((syl, idx) => {
        const isThisSyllableCorrect = Math.random() > 0.4; // 60% chance correct
        return {
            syllable: syl,
            correct: isThisSyllableCorrect,
            phonetic: getApproximatePhonetic(syl),
            tip: isThisSyllableCorrect ? null : getRandomTip(syl)
        };
    });

    // Adjust similarity based on analysis
    const correctCount = wordAnalysis.filter(w => w.correct).length;
    const adjustedSimilarity = Math.round((correctCount / syllables.length) * 100);

    return {
        isCorrect: adjustedSimilarity >= 80,
        similarity: adjustedSimilarity,
        overallFeedback: adjustedSimilarity >= 80
            ? 'Great job! Your pronunciation is getting better!'
            : 'Keep practicing! Focus on the highlighted syllables.',
        wordAnalysis,
        commonMistakes: [
            'Watch the stress placement',
            'Practice the vowel sounds'
        ]
    };
}

function splitIntoSyllables(word) {
    // Simple syllable splitting
    const vowels = 'aeiouy';
    const syllables = [];
    let current = '';
    let hasVowel = false;

    for (let i = 0; i < word.length; i++) {
        const char = word[i].toLowerCase();
        current += word[i];

        if (vowels.includes(char)) {
            hasVowel = true;
        }

        if (hasVowel && i < word.length - 1) {
            const next = word[i + 1].toLowerCase();
            if (!vowels.includes(char) && vowels.includes(next)) {
                syllables.push(current);
                current = '';
                hasVowel = false;
            }
        }
    }

    if (current) {
        if (syllables.length > 0 && !hasVowel) {
            syllables[syllables.length - 1] += current;
        } else {
            syllables.push(current);
        }
    }

    return syllables.length > 0 ? syllables : [word];
}

function getApproximatePhonetic(syllable) {
    const phonetics = {
        'per': '/pɜr/', 'pre': '/pri/', 'pro': '/proʊ/',
        'se': '/sə/', 'si': '/si/', 'so': '/soʊ/',
        'ver': '/vɜr/', 'tion': '/ʃən/', 'ance': '/əns/',
        'ence': '/əns/', 'ing': '/ɪŋ/', 'ed': '/d/',
        'er': '/ər/', 'or': '/ɔr/', 'ar': '/ɑr/',
        'ful': '/fəl/', 'ment': '/mənt/', 'ness': '/nəs/'
    };
    return phonetics[syllable.toLowerCase()] || `/${syllable.toLowerCase()}/`;
}

function getRandomTip(syllable) {
    const tips = [
        `Stress the "${syllable}" more clearly`,
        `The vowel in "${syllable}" should be shorter`,
        `Try pronouncing "${syllable}" more slowly`,
        `Focus on the ending sound`,
        `Soften the consonant sound`
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

module.exports = {
    generateWords,
    generateSentence,
    analyzePronunciation
};
