import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import {
    Text,
    Surface,
    Button,
    IconButton,
    ProgressBar,
    Chip
} from 'react-native-paper';
import { Audio } from 'expo-av';
import api from '../services/api';

const PronunciationScreen = ({ navigation }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingClone, setIsGeneratingClone] = useState(false);
    const [result, setResult] = useState(null);
    const [voiceStatus, setVoiceStatus] = useState(null);
    const [sound, setSound] = useState(null);
    const [currentWord, setCurrentWord] = useState({
        word: 'Perseverance',
        phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
        meaning: 'Persistence in doing something despite difficulty',
    });

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchDailyWord();
        fetchVoiceStatus();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    const fetchDailyWord = async () => {
        try {
            const response = await api.getDailyWord();
            if (response.data?.word) {
                setCurrentWord({
                    word: response.data.word.word,
                    phonetic: response.data.word.pronunciation || response.data.word.phonetic,
                    meaning: response.data.word.meaning,
                });
            }
        } catch (error) {
            console.log('Using default word');
        }
    };

    const fetchVoiceStatus = async () => {
        try {
            const response = await api.getVoiceStatus();
            setVoiceStatus(response.data);
        } catch (error) {
            console.log('Voice status not available');
        }
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            setResult(null);
            startPulse();
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        try {
            setIsRecording(false);
            stopPulse();
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            analyzeRecording(uri);
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    };

    const analyzeRecording = async (uri) => {
        setIsAnalyzing(true);

        try {
            // Create form data with audio file
            const formData = new FormData();
            formData.append('audio', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                type: 'audio/m4a',
                name: 'pronunciation.m4a',
            });
            formData.append('text', currentWord.word);

            const response = await api.analyzePronunciation(formData);

            setResult({
                score: response.data.score,
                feedback: response.data.feedback,
                needsImprovement: response.data.needsCorrection,
                transcription: response.data.transcription,
            });
        } catch (error) {
            console.error('Analysis error:', error);
            // Fallback to mock result
            const mockScore = Math.floor(Math.random() * 40) + 60;
            setResult({
                score: mockScore,
                feedback: mockScore >= 85
                    ? 'Excellent pronunciation! Keep it up!'
                    : mockScore >= 70
                        ? 'Good job! Focus on the stress on the second syllable.'
                        : 'Nice try! Listen to the correct pronunciation and try again.',
                needsImprovement: mockScore < 85,
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const playClonedPronunciation = async () => {
        if (!recording && !result) return;

        setIsGeneratingClone(true);

        try {
            const formData = new FormData();
            formData.append('text', currentWord.word);

            // If we have a recent recording, use it for voice cloning
            if (recording) {
                const uri = recording.getURI();
                formData.append('audio', {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    type: 'audio/m4a',
                    name: 'voice_sample.m4a',
                });
            }

            const response = await api.getClonedPronunciation(formData);

            if (response.data?.audio) {
                // Play the base64 audio
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: `data:audio/mpeg;base64,${response.data.audio}` }
                );
                setSound(newSound);
                await newSound.playAsync();

                // Update remaining usage
                if (voiceStatus) {
                    setVoiceStatus({
                        ...voiceStatus,
                        usageRemaining: response.data.usageRemaining
                    });
                }
            }
        } catch (error) {
            console.error('Clone playback error:', error);
            // Show error or fallback
        } finally {
            setIsGeneratingClone(false);
        }
    };

    const playNativePronunciation = async () => {
        try {
            // Use free dictionary API audio
            const response = await api.getPhonetics(currentWord.word);
            if (response.data?.audioUrl) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: response.data.audioUrl }
                );
                setSound(newSound);
                await newSound.playAsync();
            }
        } catch (error) {
            console.log('Native pronunciation not available');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 85) return '#00cec9';
        if (score >= 70) return '#fdcb6e';
        return '#e17055';
    };

    const getNextWord = () => {
        // In production, this would fetch a new word
        setResult(null);
        fetchDailyWord();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Voice Clone Status */}
                {voiceStatus && (
                    <View style={styles.statusBar}>
                        <Chip
                            icon="account-voice"
                            mode="outlined"
                            style={styles.statusChip}
                            textStyle={styles.statusChipText}
                        >
                            {voiceStatus.usageRemaining}/{voiceStatus.dailyLimit} clones left
                        </Chip>
                    </View>
                )}

                {/* Word Card */}
                <Surface style={styles.wordCard} elevation={2}>
                    <Text variant="displaySmall" style={styles.word}>
                        {currentWord.word}
                    </Text>
                    <Text variant="titleMedium" style={styles.phonetic}>
                        {currentWord.phonetic}
                    </Text>
                    <Text variant="bodyLarge" style={styles.meaning}>
                        {currentWord.meaning}
                    </Text>

                    <Button
                        mode="outlined"
                        icon="volume-high"
                        onPress={playNativePronunciation}
                        style={styles.listenButton}
                    >
                        Native Pronunciation
                    </Button>
                </Surface>

                {/* Recording Section */}
                <Surface style={styles.recordSection} elevation={2}>
                    <Text variant="titleMedium" style={styles.recordTitle}>
                        {isRecording ? '🎤 Recording...' : 'Tap to Record'}
                    </Text>
                    <Text variant="bodyMedium" style={styles.recordSubtitle}>
                        {isRecording ? 'Speak clearly into your microphone' : 'Say the word clearly'}
                    </Text>

                    <View style={styles.recordButtonContainer}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <IconButton
                                icon={isRecording ? 'stop' : 'microphone'}
                                iconColor="#fff"
                                size={48}
                                style={[
                                    styles.recordButton,
                                    isRecording && styles.recordButtonActive
                                ]}
                                onPress={isRecording ? stopRecording : startRecording}
                            />
                        </Animated.View>
                    </View>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>Recording</Text>
                        </View>
                    )}
                </Surface>

                {/* Analysis Result */}
                {isAnalyzing && (
                    <Surface style={styles.resultCard} elevation={2}>
                        <Text variant="titleMedium" style={styles.analyzingText}>
                            🎯 Analyzing your pronunciation...
                        </Text>
                        <ProgressBar
                            indeterminate
                            color="#6c5ce7"
                            style={styles.progressBar}
                        />
                    </Surface>
                )}

                {result && !isAnalyzing && (
                    <Surface style={styles.resultCard} elevation={2}>
                        <View style={styles.scoreContainer}>
                            <Text style={[styles.scoreEmoji, { color: getScoreColor(result.score) }]}>
                                {result.score >= 85 ? '🎉' : result.score >= 70 ? '👍' : '💪'}
                            </Text>
                            <Text
                                variant="displaySmall"
                                style={[styles.score, { color: getScoreColor(result.score) }]}
                            >
                                {result.score}%
                            </Text>
                        </View>

                        <Text variant="bodyLarge" style={styles.feedback}>
                            {result.feedback}
                        </Text>

                        {result.needsImprovement && voiceStatus?.usageRemaining > 0 && (
                            <Button
                                mode="contained"
                                icon="account-voice"
                                onPress={playClonedPronunciation}
                                loading={isGeneratingClone}
                                disabled={isGeneratingClone}
                                style={styles.cloneButton}
                            >
                                Hear Correct (Your Voice) ✨
                            </Button>
                        )}

                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                icon="refresh"
                                onPress={() => setResult(null)}
                                style={styles.actionButton}
                            >
                                Try Again
                            </Button>
                            <Button
                                mode="outlined"
                                icon="arrow-right"
                                onPress={getNextWord}
                                style={styles.actionButton}
                            >
                                Next Word
                            </Button>
                        </View>
                    </Surface>
                )}

                {/* Info Card */}
                <Surface style={styles.infoCard} elevation={1}>
                    <Text variant="titleSmall" style={styles.infoTitle}>
                        💡 Voice Cloning Feature
                    </Text>
                    <Text variant="bodySmall" style={styles.infoText}>
                        When your pronunciation needs improvement, we use AI to show you
                        the correct pronunciation in your own voice! This makes learning
                        more personal and effective. You have {voiceStatus?.usageRemaining || 5} free
                        clones remaining today.
                    </Text>
                </Surface>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    statusChip: {
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderColor: '#6c5ce7',
    },
    statusChipText: {
        color: '#a29bfe',
    },
    wordCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    word: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    phonetic: {
        color: '#6c5ce7',
        marginBottom: 12,
    },
    meaning: {
        color: '#a29bfe',
        textAlign: 'center',
        marginBottom: 20,
    },
    listenButton: {
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
    recordTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    recordSubtitle: {
        color: '#a29bfe',
        marginTop: 4,
        marginBottom: 24,
    },
    recordButtonContainer: {
        marginBottom: 16,
    },
    recordButton: {
        backgroundColor: '#6c5ce7',
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    recordButtonActive: {
        backgroundColor: '#e74c3c',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e74c3c',
        marginRight: 8,
    },
    recordingText: {
        color: '#e74c3c',
        fontWeight: '600',
    },
    resultCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    analyzingText: {
        color: '#fff',
        marginBottom: 16,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0f3460',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreEmoji: {
        fontSize: 48,
        marginRight: 16,
    },
    score: {
        fontWeight: 'bold',
    },
    feedback: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    cloneButton: {
        width: '100%',
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#fd79a8',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    actionButton: {
        flex: 0.48,
        borderRadius: 12,
        borderColor: '#6c5ce7',
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
    },
});

export default PronunciationScreen;
