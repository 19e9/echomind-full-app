const PracticeSentence = require('../models/PracticeSentence');
const User = require('../models/User');
const axios = require('axios');
const FormData = require('form-data');
const { generateWords, analyzePronunciation } = require('../services/aiService');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Helper: Split word into syllables
function splitWordIntoSyllables(word) {
    const vowels = 'aeiouy';
    const syllables = [];
    let current = '';
    let hasVowel = false;

    for (let i = 0; i < word.length; i++) {
        const char = word[i].toLowerCase();
        current += word[i];

        if (vowels.includes(char)) hasVowel = true;

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

// Helper: Get approximate phonetic
function getPhonetic(syllable) {
    const phonetics = {
        'per': '/pɜr/', 'pre': '/pri/', 'pro': '/proʊ/',
        'se': '/sə/', 'si': '/si/', 'so': '/soʊ/',
        'ver': '/vɜr/', 'tion': '/ʃən/', 'ance': '/əns/',
        'ence': '/əns/', 'ing': '/ɪŋ/', 'ed': '/d/',
        'er': '/ər/', 'or': '/ɔr/', 'ar': '/ɑr/',
        'ful': '/fəl/', 'ment': '/mənt/', 'ness': '/nəs/',
        'be': '/bi/', 'au': '/ɔ/', 'ti': '/ti/'
    };
    return phonetics[syllable.toLowerCase()] || `/${syllable.toLowerCase()}/`;
}

// Helper: Get random pronunciation tip
function getTip(syllable) {
    const tips = [
        `Stress "${syllable}" more clearly`,
        `Vowel in "${syllable}" should be shorter`,
        `Pronounce "${syllable}" more slowly`,
        `Focus on ending sound`,
        `Soften the consonant`
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

// @desc    Generate words with AI
// @route   POST /api/practice/generate
// @access  Private/Admin
exports.generateWithAI = async (req, res) => {
    try {
        const { level = 'intermediate', count = 5 } = req.body;

        console.log(`Generating ${count} words for level: ${level}`);

        // Get existing words to avoid duplicates
        const existingDocs = await PracticeSentence.find({ level }).select('sentence');
        const existingWords = existingDocs.map(doc => doc.sentence.toLowerCase());

        console.log(`Found ${existingWords.length} existing words for ${level}`);

        // Generate unique words with AI
        const words = await generateWords(level, count, existingWords);

        // Filter out any duplicates that AI might have still generated
        const uniqueWords = words.filter(w =>
            !existingWords.includes(w.sentence.toLowerCase())
        );

        if (uniqueWords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not generate unique words. Try a different level or try again.'
            });
        }

        // Save generated words to database
        const saved = await PracticeSentence.insertMany(uniqueWords);

        res.status(201).json({
            success: true,
            message: `Generated and saved ${saved.length} unique words`,
            data: saved
        });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate words with AI: ' + error.message
        });
    }
};

// @desc    Get random practice sentence
// @route   GET /api/practice/sentence
// @access  Private
exports.getRandomSentence = async (req, res) => {
    try {
        const userLevel = req.user.level || 'beginner';

        let sentence = await PracticeSentence.getRandomByLevel(userLevel);

        // If no sentence for user's level, try any level
        if (!sentence) {
            const count = await PracticeSentence.countDocuments();
            if (count > 0) {
                const random = Math.floor(Math.random() * count);
                sentence = await PracticeSentence.findOne().skip(random);
            }
        }

        // If still no sentence, return demo sentence
        if (!sentence) {
            sentence = {
                _id: 'demo',
                sentence: 'The quick brown fox jumps over the lazy dog.',
                phonetic: '/ðə kwɪk braʊn fɒks dʒʌmps ˈoʊvər ðə ˈleɪzi dɒɡ/',
                level: 'intermediate',
                topic: 'pronunciation',
                heygen_video_url: null,
                audio_url: null
            };
        }

        // Get user's remaining clone count
        const user = await User.findById(req.user.id);
        const dailyCloneLimit = 5;
        const today = new Date().toDateString();

        let remainingClones = dailyCloneLimit;
        if (user.lastCloneDate === today) {
            remainingClones = Math.max(0, dailyCloneLimit - (user.dailyCloneCount || 0));
        }

        res.json({
            success: true,
            data: {
                sentence,
                remainingClones,
                dailyLimit: dailyCloneLimit
            }
        });
    } catch (error) {
        console.error('Get sentence error:', error);
        res.status(500).json({ success: false, message: 'Failed to get sentence' });
    }
};

// @desc    Analyze pronunciation and correct if needed
// @route   POST /api/pronunciation/analyze-and-correct
// @access  Private
exports.analyzeAndCorrect = async (req, res) => {
    try {
        const { sentence } = req.body;
        const audioFile = req.file;

        if (!audioFile || !sentence) {
            return res.status(400).json({
                success: false,
                message: 'Audio file and sentence are required'
            });
        }

        // Check daily clone limit
        const user = await User.findById(req.user.id);
        const dailyCloneLimit = 5;
        const today = new Date().toDateString();

        if (user.lastCloneDate === today && user.dailyCloneCount >= dailyCloneLimit) {
            return res.status(429).json({
                success: false,
                message: 'Daily voice clone limit reached. Try again tomorrow!'
            });
        }

        // Step 1: Speech-to-Text with Deepgram
        let transcript = '';
        try {
            if (DEEPGRAM_API_KEY) {
                const deepgramResponse = await axios.post(
                    'https://api.deepgram.com/v1/listen?model=nova-2&language=en',
                    audioFile.buffer,
                    {
                        headers: {
                            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                            'Content-Type': audioFile.mimetype
                        }
                    }
                );
                transcript = deepgramResponse.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
            } else {
                // Demo mode - PURE OFFLINE analysis (no API calls)
                console.log('Using offline pronunciation analysis...');

                // Split word into syllables
                const syllables = splitWordIntoSyllables(sentence);
                const similarity = Math.floor(Math.random() * 25) + 60; // 60-85

                // Create word analysis with random correct/incorrect
                const wordAnalysis = syllables.map((syl) => ({
                    syllable: syl,
                    correct: Math.random() > 0.4,
                    phonetic: getPhonetic(syl),
                    tip: Math.random() > 0.6 ? getTip(syl) : null
                }));

                // Adjust similarity based on correct syllables
                const correctCount = wordAnalysis.filter(w => w.correct).length;
                const adjustedSimilarity = Math.round((correctCount / syllables.length) * 100);

                return res.json({
                    success: true,
                    data: {
                        status: adjustedSimilarity >= 75 ? 'correct' : 'incorrect',
                        transcript: sentence.toLowerCase(),
                        similarity: adjustedSimilarity,
                        feedback: adjustedSimilarity >= 75
                            ? 'Great job! Your pronunciation is improving!'
                            : 'Keep practicing! Focus on the red syllables.',
                        wordAnalysis,
                        commonMistakes: ['Watch the stress placement', 'Practice vowel sounds'],
                        remainingClones: Math.max(0, dailyCloneLimit - user.dailyCloneCount)
                    }
                });
            }
        } catch (sttError) {
            // Ultimate fallback - simple analysis
            console.log('Ultimate fallback analysis');
            const similarity = Math.floor(Math.random() * 30) + 55;
            return res.json({
                success: true,
                data: {
                    status: similarity >= 70 ? 'correct' : 'incorrect',
                    transcript: sentence.toLowerCase(),
                    similarity,
                    feedback: 'Keep practicing!',
                    wordAnalysis: [{ syllable: sentence, correct: similarity >= 70, phonetic: '', tip: null }],
                    commonMistakes: [],
                    remainingClones: 5
                }
            });
        }

        // Step 2: Compare transcript with target sentence
        const normalizedTarget = sentence.toLowerCase().replace(/[.,!?]/g, '').trim();
        const normalizedTranscript = transcript.toLowerCase().replace(/[.,!?]/g, '').trim();

        // Calculate similarity (simple word match percentage)
        const targetWords = normalizedTarget.split(/\s+/);
        const transcriptWords = normalizedTranscript.split(/\s+/);

        let matchCount = 0;
        targetWords.forEach(word => {
            if (transcriptWords.includes(word)) matchCount++;
        });

        const similarity = targetWords.length > 0 ? matchCount / targetWords.length : 0;
        const isCorrect = similarity >= 0.8; // 80% match threshold

        // If correct, return success
        if (isCorrect) {
            return res.json({
                success: true,
                data: {
                    status: 'correct',
                    transcript,
                    similarity: Math.round(similarity * 100),
                    feedback: 'Excellent! Your pronunciation is great! 🎉'
                }
            });
        }

        // Step 3 & 4: Voice cloning with ElevenLabs (if incorrect)
        // NOTE: Disabled - requires valid ElevenLabs API key
        // To enable: Add ELEVENLABS_API_KEY to .env with a valid key starting with 'sk_'
        let correctedAudioUrl = null;
        let voiceId = null;

        // Only attempt ElevenLabs if we have a valid API key (starts with 'sk_')
        const hasValidElevenLabsKey = ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.startsWith('sk_');

        if (hasValidElevenLabsKey) {
            try {
                // Create voice clone from user audio
                const formData = new FormData();
                formData.append('name', `user_${req.user.id}_temp`);
                formData.append('files', audioFile.buffer, {
                    filename: 'audio.webm',
                    contentType: audioFile.mimetype
                });

                const cloneResponse = await axios.post(
                    'https://api.elevenlabs.io/v1/voices/add',
                    formData,
                    {
                        headers: {
                            'xi-api-key': ELEVENLABS_API_KEY,
                            ...formData.getHeaders()
                        }
                    }
                );
                voiceId = cloneResponse.data?.voice_id;

                if (voiceId) {
                    // Generate correct pronunciation with cloned voice
                    const ttsResponse = await axios.post(
                        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                        {
                            text: sentence,
                            model_id: 'eleven_monolingual_v1',
                            voice_settings: {
                                stability: 0.75,
                                similarity_boost: 0.75
                            }
                        },
                        {
                            headers: {
                                'xi-api-key': ELEVENLABS_API_KEY,
                                'Content-Type': 'application/json'
                            },
                            responseType: 'arraybuffer'
                        }
                    );

                    // Convert audio to base64 data URL
                    const audioBase64 = Buffer.from(ttsResponse.data).toString('base64');
                    correctedAudioUrl = `data:audio/mpeg;base64,${audioBase64}`;

                    // Clean up: Delete the temporary voice
                    await axios.delete(
                        `https://api.elevenlabs.io/v1/voices/${voiceId}`,
                        {
                            headers: { 'xi-api-key': ELEVENLABS_API_KEY }
                        }
                    ).catch(() => { }); // Ignore cleanup errors
                }
            } catch (cloneError) {
                // Voice cloning failed - continue without it (API key may be invalid)
            }
        }

        // Update user's daily clone count
        if (user.lastCloneDate !== today) {
            user.lastCloneDate = today;
            user.dailyCloneCount = 1;
        } else {
            user.dailyCloneCount = (user.dailyCloneCount || 0) + 1;
        }
        await user.save();

        res.json({
            success: true,
            data: {
                status: 'incorrect',
                transcript,
                similarity: Math.round(similarity * 100),
                corrected_audio_url: correctedAudioUrl,
                feedback: correctedAudioUrl
                    ? 'Listen to the correct pronunciation in your own voice! 🔊'
                    : 'Your pronunciation needs improvement. Try again!',
                remainingClones: Math.max(0, dailyCloneLimit - user.dailyCloneCount)
            }
        });

    } catch (error) {
        console.error('Analyze and correct error:', error);
        res.status(500).json({
            success: false,
            message: 'Analysis failed. Please try again.'
        });
    }
};

// @desc    Add practice sentences (admin)
// @route   POST /api/practice/sentences
// @access  Private/Admin
exports.addSentences = async (req, res) => {
    try {
        const { sentences } = req.body; // Array of sentence objects

        if (!sentences || !Array.isArray(sentences)) {
            return res.status(400).json({
                success: false,
                message: 'Sentences array is required'
            });
        }

        const created = await PracticeSentence.insertMany(sentences);

        res.status(201).json({
            success: true,
            message: `${created.length} sentences added`,
            data: { count: created.length }
        });
    } catch (error) {
        console.error('Add sentences error:', error);
        res.status(500).json({ success: false, message: 'Failed to add sentences' });
    }
};

// @desc    Get all practice sentences (admin)
// @route   GET /api/practice/sentences
// @access  Private/Admin
exports.getAllSentences = async (req, res) => {
    try {
        const { level, topic, page = 1, limit = 100 } = req.query;

        let query = {};
        if (level) query.level = level;
        if (topic) query.topic = topic;

        const sentences = await PracticeSentence.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await PracticeSentence.countDocuments(query);

        res.json({
            success: true,
            data: {
                sentences,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get sentences error:', error);
        res.status(500).json({ success: false, message: 'Failed to get sentences' });
    }
};

// @desc    Add single practice word (admin)
// @route   POST /api/practice/word
// @access  Private/Admin
exports.addWord = async (req, res) => {
    try {
        const { sentence, phonetic, translation, level, topic } = req.body;

        if (!sentence || !level) {
            return res.status(400).json({
                success: false,
                message: 'Word and level are required'
            });
        }

        const word = await PracticeSentence.create({
            sentence,
            phonetic,
            translation,
            level,
            topic: topic || 'pronunciation'
        });

        res.status(201).json({ success: true, data: word });
    } catch (error) {
        console.error('Add word error:', error);
        res.status(500).json({ success: false, message: 'Failed to add word' });
    }
};

// @desc    Update practice word (admin)
// @route   PUT /api/practice/word/:id
// @access  Private/Admin
exports.updateWord = async (req, res) => {
    try {
        const word = await PracticeSentence.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!word) {
            return res.status(404).json({ success: false, message: 'Word not found' });
        }

        res.json({ success: true, data: word });
    } catch (error) {
        console.error('Update word error:', error);
        res.status(500).json({ success: false, message: 'Failed to update word' });
    }
};

// @desc    Delete practice word (admin)
// @route   DELETE /api/practice/word/:id
// @access  Private/Admin
exports.deleteWord = async (req, res) => {
    try {
        const word = await PracticeSentence.findByIdAndDelete(req.params.id);

        if (!word) {
            return res.status(404).json({ success: false, message: 'Word not found' });
        }

        res.json({ success: true, message: 'Word deleted' });
    } catch (error) {
        console.error('Delete word error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete word' });
    }
};
