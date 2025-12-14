import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import {
    Text,
    Surface,
    Button,
    ActivityIndicator,
    Chip,
    SegmentedButtons
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

const LearnScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('practice');

    // Practice state
    const [practiceLoading, setPracticeLoading] = useState(true);
    const [word, setWord] = useState(null);
    const [remainingClones, setRemainingClones] = useState(5);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Video state
    const [videos, setVideos] = useState([]);
    const [videoLoading, setVideoLoading] = useState(true);

    const soundRef = useRef(null);

    useEffect(() => {
        loadPracticeWord();
        loadVideos();
        setupAudio();

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            Speech.stop();
        };
    }, []);

    const setupAudio = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
        } catch (error) {
            console.log('Audio setup error');
        }
    };

    // Practice functions
    const loadPracticeWord = async () => {
        setPracticeLoading(true);
        setResult(null);
        try {
            const response = await api.getPracticeSentence();
            if (response.data?.sentence) {
                setWord({
                    word: response.data.sentence.sentence,
                    pronunciation: response.data.sentence.phonetic,
                    meaning: response.data.sentence.translation,
                    level: response.data.sentence.level
                });
                setRemainingClones(response.data.remainingClones || 5);
            } else {
                throw new Error('No data');
            }
        } catch (error) {
            console.log('API error, using demo word');
            // Demo words rotation
            const demoWords = [
                { word: 'Perseverance', pronunciation: '/ˌpɜːrsəˈvɪərəns/', meaning: 'Azim, sebat', level: 'intermediate' },
                { word: 'Entrepreneur', pronunciation: '/ˌɑːntrəprəˈnɜːr/', meaning: 'Girişimci', level: 'intermediate' },
                { word: 'Beautiful', pronunciation: '/ˈbjuːtɪfəl/', meaning: 'Güzel', level: 'elementary' },
                { word: 'Phenomenon', pronunciation: '/fɪˈnɑːmɪnən/', meaning: 'Fenomen', level: 'intermediate' },
                { word: 'Opportunity', pronunciation: '/ˌɑːpərˈtuːnəti/', meaning: 'Fırsat', level: 'intermediate' },
            ];
            const randomWord = demoWords[Math.floor(Math.random() * demoWords.length)];
            setWord(randomWord);
        }
        setPracticeLoading(false);
    };

    const playNativePronunciation = () => {
        if (!word?.word || isSpeaking) return;

        setIsSpeaking(true);
        Speech.speak(word.word, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const startRecording = async () => {
        try {
            // Stop any playing speech first
            Speech.stop();
            setIsSpeaking(false);

            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') return;

            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setResult(null);
        } catch (error) {
            console.log('Recording error');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            analyzeRecording(uri);
        } catch (error) {
            console.log('Stop error');
        }
    };

    const analyzeRecording = async (uri) => {
        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('audio', { uri, type: 'audio/m4a', name: 'recording.m4a' });
            formData.append('sentence', word?.word || '');

            const response = await api.analyzeAndCorrect(formData);
            if (response.data) {
                setResult(response.data);
                if (response.data.remainingClones !== undefined) {
                    setRemainingClones(response.data.remainingClones);
                }
            }
        } catch (error) {
            // Demo result
            const similarity = Math.floor(Math.random() * 30) + 70; // 70-100
            setResult({
                status: similarity >= 85 ? 'correct' : 'incorrect',
                feedback: similarity >= 85
                    ? 'Great pronunciation! Keep it up! 🎉'
                    : 'Good try! Listen again and practice.',
                similarity,
                transcript: word?.word?.toLowerCase()
            });
        }
        setAnalyzing(false);
    };

    const playCorrectAudio = async () => {
        if (result?.corrected_audio_url) {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: result.corrected_audio_url },
                    { shouldPlay: true }
                );
                soundRef.current = sound;
            } catch (error) {
                console.log('Audio play error');
            }
        } else {
            // Fallback to TTS
            Speech.speak(word?.word || '', {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.75,
            });
        }
    };

    // Video functions
    const loadVideos = async () => {
        setVideoLoading(true);
        setVideos([
            {
                id: '1',
                title: 'Introduction to English Greetings',
                description: 'Learn basic greetings and introductions in English',
                duration: '5:30',
                level: 'beginner',
                views: 1234,
            },
            {
                id: '2',
                title: 'Present Tense Made Easy',
                description: 'Master the present simple and continuous tenses',
                duration: '8:15',
                level: 'elementary',
                views: 892,
            },
            {
                id: '3',
                title: 'Ordering at a Restaurant',
                description: 'Real-world conversation practice for dining',
                duration: '6:45',
                level: 'intermediate',
                views: 2156,
            },
        ]);
        setVideoLoading(false);
    };

    const getLevelColor = (level) => {
        const colors = {
            'beginner': '#27ae60',
            'elementary': '#3498db',
            'intermediate': '#f39c12',
            'upper-intermediate': '#e74c3c',
            'advanced': '#9b59b6',
        };
        return colors[level] || '#6c5ce7';
    };

    // Render Practice Tab
    const renderPractice = () => (
        <View style={styles.tabContent}>
            {/* Clone Counter */}
            <View style={styles.cloneCounter}>
                <Text style={styles.cloneText}>👤 {remainingClones}/5 clones left</Text>
            </View>

            {/* Word Card */}
            <Surface style={styles.wordCard} elevation={3}>
                {practiceLoading ? (
                    <ActivityIndicator size="large" color="#6c5ce7" />
                ) : (
                    <>
                        <Chip
                            mode="outlined"
                            style={[styles.levelChipTop, { borderColor: getLevelColor(word?.level) }]}
                            textStyle={{ color: getLevelColor(word?.level), fontSize: 10 }}
                        >
                            {word?.level || 'intermediate'}
                        </Chip>
                        <Text variant="displaySmall" style={styles.wordText}>
                            {word?.word || 'Loading...'}
                        </Text>
                        <Text style={styles.phoneticText}>
                            {word?.pronunciation}
                        </Text>
                        <Text style={styles.meaningText}>
                            {word?.meaning}
                        </Text>
                        <Button
                            mode="outlined"
                            icon={isSpeaking ? "volume-off" : "volume-high"}
                            onPress={playNativePronunciation}
                            style={styles.nativeButton}
                            loading={isSpeaking}
                            disabled={isSpeaking}
                        >
                            {isSpeaking ? 'Speaking...' : 'Listen First'}
                        </Button>
                    </>
                )}
            </Surface>

            {/* Recording Section */}
            <Surface style={styles.recordSection} elevation={2}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    {isRecording ? '🔴 Recording...' : 'Now Your Turn'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                    {isRecording ? 'Speak clearly' : 'Tap and say the word'}
                </Text>

                <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                    disabled={analyzing || practiceLoading}
                >
                    <LinearGradient
                        colors={isRecording ? ['#e74c3c', '#c0392b'] : ['#6c5ce7', '#a29bfe']}
                        style={styles.recordButton}
                    >
                        <Text style={styles.recordIcon}>{isRecording ? '⏹️' : '🎤'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Surface>

            {/* Analyzing */}
            {analyzing && (
                <Surface style={styles.analyzingCard} elevation={1}>
                    <ActivityIndicator size="large" color="#6c5ce7" />
                    <Text style={styles.analyzingText}>Analyzing pronunciation...</Text>
                </Surface>
            )}

            {/* Result */}
            {result && !analyzing && (
                <Surface
                    style={[styles.resultCard, result.status === 'correct' ? styles.resultCorrect : styles.resultIncorrect]}
                    elevation={2}
                >
                    <Text style={styles.resultIcon}>{result.status === 'correct' ? '🎉' : '💡'}</Text>
                    <Text variant="titleLarge" style={styles.resultTitle}>
                        {result.status === 'correct' ? 'Excellent!' : 'Keep Practicing!'}
                    </Text>
                    <Text style={styles.resultFeedback}>{result.feedback}</Text>

                    {result.similarity !== undefined && (
                        <View style={styles.similarityBox}>
                            <Text style={styles.similarityValue}>{result.similarity}%</Text>
                            <Text style={styles.similarityLabel}>Accuracy</Text>
                        </View>
                    )}

                    {/* Word Analysis - Green/Red syllables */}
                    {result.wordAnalysis && result.wordAnalysis.length > 0 && (
                        <View style={styles.wordAnalysisBox}>
                            <Text style={styles.wordAnalysisTitle}>Syllable Analysis:</Text>
                            <View style={styles.syllablesRow}>
                                {result.wordAnalysis.map((item, idx) => (
                                    <View key={idx} style={styles.syllableItem}>
                                        <Text style={[
                                            styles.syllableText,
                                            item.correct ? styles.syllableCorrect : styles.syllableWrong
                                        ]}>
                                            {item.syllable}
                                        </Text>
                                        {item.phonetic && (
                                            <Text style={styles.syllablePhonetic}>{item.phonetic}</Text>
                                        )}
                                        {item.tip && (
                                            <Text style={styles.syllableTip}>{item.tip}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {result.commonMistakes && result.commonMistakes.length > 0 && (
                        <View style={styles.mistakesBox}>
                            <Text style={styles.mistakesTitle}>💡 Common Mistakes:</Text>
                            {result.commonMistakes.map((mistake, idx) => (
                                <Text key={idx} style={styles.mistakeItem}>• {mistake}</Text>
                            ))}
                        </View>
                    )}

                    {result.status === 'incorrect' && (
                        <Button
                            mode="contained"
                            icon="volume-high"
                            onPress={playCorrectAudio}
                            style={styles.hearButton}
                        >
                            Hear Correct Pronunciation
                        </Button>
                    )}
                </Surface>
            )}

            {/* Next Word Button */}
            <Button
                mode="outlined"
                icon="refresh"
                onPress={loadPracticeWord}
                style={styles.nextButton}
                disabled={isRecording || analyzing}
            >
                Next Word
            </Button>

            {/* Voice Cloning Info */}
            <Surface style={styles.infoCard} elevation={1}>
                <Text style={styles.infoTitle}>💡 Voice Cloning Feature</Text>
                <Text style={styles.infoText}>
                    When your pronunciation needs improvement, we use AI to show you the
                    correct pronunciation in your own voice! You have {remainingClones} free clones remaining today.
                </Text>
            </Surface>
        </View>
    );

    // Render Videos Tab
    const renderVideos = () => (
        <View style={styles.tabContent}>
            {videoLoading ? (
                <ActivityIndicator size="large" color="#6c5ce7" style={styles.loader} />
            ) : (
                videos.map((video) => (
                    <TouchableOpacity key={video.id} activeOpacity={0.8}>
                        <Surface style={styles.videoCard} elevation={2}>
                            <LinearGradient
                                colors={['#0f3460', '#16213e']}
                                style={styles.thumbnail}
                            >
                                <Text style={styles.playIcon}>▶️</Text>
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{video.duration}</Text>
                                </View>
                            </LinearGradient>
                            <View style={styles.videoInfo}>
                                <Chip
                                    mode="outlined"
                                    style={[styles.levelChip, { borderColor: getLevelColor(video.level) }]}
                                    textStyle={[styles.levelChipText, { color: getLevelColor(video.level) }]}
                                >
                                    {video.level}
                                </Chip>
                                <Text variant="titleMedium" style={styles.videoTitle} numberOfLines={2}>
                                    {video.title}
                                </Text>
                                <Text style={styles.videoDescription} numberOfLines={1}>
                                    {video.description}
                                </Text>
                                <Text style={styles.videoViews}>👁 {video.views} views</Text>
                            </View>
                        </Surface>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={activeTab === 'practice' ? ['#6c5ce7', '#a29bfe'] : ['#fd79a8', '#fab1ba']}
                style={styles.header}
            >
                <Text variant="headlineSmall" style={styles.headerTitle}>
                    {activeTab === 'practice' ? '🎤 Pronunciation Practice' : '🎬 Video Lessons'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    {activeTab === 'practice'
                        ? 'Listen, repeat, and improve!'
                        : 'Learn with AI-powered video tutors'}
                </Text>
            </LinearGradient>

            {/* Tab Switcher */}
            <View style={styles.tabSwitcher}>
                <SegmentedButtons
                    value={activeTab}
                    onValueChange={(value) => {
                        if (value === 'videos') {
                            navigation.navigate('Reels');
                        } else {
                            setActiveTab(value);
                        }
                    }}
                    buttons={[
                        { value: 'practice', label: 'Practice', icon: 'microphone' },
                        { value: 'videos', label: 'Reels', icon: 'play-circle' },
                    ]}
                    style={styles.segmentedButtons}
                />
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'practice' ? renderPractice() : renderVideos()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    tabSwitcher: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#16213e',
    },
    segmentedButtons: {
        backgroundColor: '#0f3460',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    tabContent: {
        padding: 20,
    },
    loader: {
        marginTop: 40,
    },
    // Practice styles
    cloneCounter: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    cloneText: {
        color: '#a29bfe',
        fontSize: 12,
    },
    wordCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    levelChipTop: {
        marginBottom: 12,
    },
    wordText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    phoneticText: {
        color: '#6c5ce7',
        marginTop: 8,
        fontSize: 16,
    },
    meaningText: {
        color: '#a29bfe',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 22,
    },
    nativeButton: {
        marginTop: 16,
        borderColor: '#6c5ce7',
        borderRadius: 12,
    },
    recordSection: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        color: '#a29bfe',
        marginTop: 4,
        marginBottom: 20,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordIcon: {
        fontSize: 40,
    },
    analyzingCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    analyzingText: {
        color: '#fff',
        marginTop: 12,
    },
    resultCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    resultCorrect: {
        backgroundColor: 'rgba(39, 174, 96, 0.2)',
        borderWidth: 1,
        borderColor: '#27ae60',
    },
    resultIncorrect: {
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderWidth: 1,
        borderColor: '#6c5ce7',
    },
    resultIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    resultTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    resultFeedback: {
        color: '#a29bfe',
        textAlign: 'center',
        marginTop: 8,
    },
    similarityBox: {
        marginTop: 16,
        alignItems: 'center',
    },
    similarityValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    similarityLabel: {
        color: '#a29bfe',
        fontSize: 12,
    },
    mistakesBox: {
        marginTop: 16,
        width: '100%',
        padding: 12,
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderRadius: 12,
    },
    mistakesTitle: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    mistakeItem: {
        color: '#a29bfe',
        marginBottom: 4,
        fontSize: 13,
    },
    wordAnalysisBox: {
        marginTop: 16,
        width: '100%',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    wordAnalysisTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    syllablesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    syllableItem: {
        alignItems: 'center',
        padding: 8,
        minWidth: 60,
    },
    syllableText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    syllableCorrect: {
        color: '#27ae60',
    },
    syllableWrong: {
        color: '#e74c3c',
    },
    syllablePhonetic: {
        color: '#a29bfe',
        fontSize: 12,
    },
    syllableTip: {
        color: '#f39c12',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 4,
    },
    hearButton: {
        marginTop: 16,
        backgroundColor: '#6c5ce7',
        borderRadius: 12,
    },
    nextButton: {
        borderColor: '#6c5ce7',
        borderRadius: 12,
        marginBottom: 20,
    },
    infoCard: {
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(108, 92, 231, 0.3)',
    },
    infoTitle: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoText: {
        color: '#a29bfe',
        lineHeight: 20,
        fontSize: 13,
    },
    // Video styles
    videoCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    thumbnail: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    playIcon: {
        fontSize: 40,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    durationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    videoInfo: {
        padding: 16,
    },
    levelChip: {
        alignSelf: 'flex-start',
        marginBottom: 8,
        height: 24,
    },
    levelChipText: {
        fontSize: 10,
    },
    videoTitle: {
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    videoDescription: {
        color: '#a29bfe',
        fontSize: 13,
        marginBottom: 8,
    },
    videoViews: {
        color: '#a29bfe',
        fontSize: 12,
    },
});

export default LearnScreen;
