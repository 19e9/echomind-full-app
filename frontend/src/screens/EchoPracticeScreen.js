import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import {
    Text,
    Surface,
    Button,
    ActivityIndicator,
    Chip
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, Video, ResizeMode } from 'expo-av';
import api from '../services/api';

const { width } = Dimensions.get('window');

const EchoPracticeScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [sentence, setSentence] = useState(null);
    const [remainingClones, setRemainingClones] = useState(5);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState(null);
    const [audioPlaying, setAudioPlaying] = useState(false);

    const soundRef = useRef(null);

    useEffect(() => {
        loadSentence();
        setupAudio();

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
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
            console.log('Audio setup error:', error);
        }
    };

    const loadSentence = async () => {
        setLoading(true);
        setResult(null);
        try {
            const response = await api.getPracticeSentence();
            if (response.data) {
                setSentence(response.data.sentence);
                setRemainingClones(response.data.remainingClones || 5);
            }
        } catch (error) {
            console.log('Load sentence error:', error);
            // Demo sentence
            setSentence({
                sentence: 'The weather is beautiful today.',
                phonetic: '/ðə ˈweðər ɪz ˈbjuːtɪfəl təˈdeɪ/',
                level: 'intermediate'
            });
        }
        setLoading(false);
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant microphone permission');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setResult(null);
        } catch (error) {
            console.log('Start recording error:', error);
            Alert.alert('Error', 'Could not start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            // Analyze the recording
            await analyzeRecording(uri);
        } catch (error) {
            console.log('Stop recording error:', error);
        }
    };

    const analyzeRecording = async (uri) => {
        if (!sentence) return;

        setAnalyzing(true);

        try {
            // Create form data with audio file
            const formData = new FormData();
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: 'recording.m4a'
            });
            formData.append('sentence', sentence.sentence);

            const response = await api.analyzeAndCorrect(formData);

            if (response.data) {
                setResult(response.data);
                if (response.data.remainingClones !== undefined) {
                    setRemainingClones(response.data.remainingClones);
                }
            }
        } catch (error) {
            console.log('Analyze error:', error);
            // Demo result
            setResult({
                status: 'incorrect',
                transcript: 'the weather is beautiful today',
                similarity: 85,
                feedback: 'Good attempt! Keep practicing for perfection.',
                corrected_audio_url: null
            });
        }

        setAnalyzing(false);
    };

    const playCorrectAudio = async () => {
        if (!result?.corrected_audio_url) return;

        try {
            setAudioPlaying(true);

            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: result.corrected_audio_url },
                { shouldPlay: true }
            );

            soundRef.current = sound;

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setAudioPlaying(false);
                }
            });
        } catch (error) {
            console.log('Play audio error:', error);
            setAudioPlaying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading practice...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient
                    colors={['#6c5ce7', '#a29bfe']}
                    style={styles.header}
                >
                    <View style={styles.headerRow}>
                        <Text variant="headlineSmall" style={styles.headerTitle}>
                            🔊 Echo Practice
                        </Text>
                        <Chip mode="outlined" style={styles.cloneChip} textStyle={styles.cloneChipText}>
                            {remainingClones}/5 clones left
                        </Chip>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Listen, repeat, and get feedback in your own voice
                    </Text>
                </LinearGradient>

                {/* Sentence Card */}
                <Surface style={styles.sentenceCard} elevation={3}>
                    <Text variant="headlineMedium" style={styles.sentenceText}>
                        {sentence?.sentence || 'Loading...'}
                    </Text>
                    {sentence?.phonetic && (
                        <Text style={styles.phoneticText}>{sentence.phonetic}</Text>
                    )}
                    <Chip mode="outlined" style={styles.levelChip}>
                        {sentence?.level || 'intermediate'}
                    </Chip>
                </Surface>

                {/* Recording Section */}
                <Surface style={styles.recordSection} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        {isRecording ? '🔴 Recording...' : 'Tap to Record'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {isRecording ? 'Speak the sentence clearly' : 'Say the sentence above'}
                    </Text>

                    <TouchableOpacity
                        onPress={isRecording ? stopRecording : startRecording}
                        activeOpacity={0.8}
                        disabled={analyzing}
                    >
                        <LinearGradient
                            colors={isRecording ? ['#e74c3c', '#c0392b'] : ['#6c5ce7', '#a29bfe']}
                            style={styles.recordButton}
                        >
                            <Text style={styles.recordButtonIcon}>
                                {isRecording ? '⏹️' : '🎤'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Surface>

                {/* Analyzing Indicator */}
                {analyzing && (
                    <Surface style={styles.analyzingCard} elevation={2}>
                        <ActivityIndicator size="large" color="#6c5ce7" />
                        <Text style={styles.analyzingText}>
                            Analyzing your pronunciation...
                        </Text>
                        <Text style={styles.analyzingSubtext}>
                            This may take a few seconds
                        </Text>
                    </Surface>
                )}

                {/* Result Section */}
                {result && !analyzing && (
                    <Surface
                        style={[
                            styles.resultCard,
                            result.status === 'correct' ? styles.resultCorrect : styles.resultIncorrect
                        ]}
                        elevation={2}
                    >
                        <Text style={styles.resultIcon}>
                            {result.status === 'correct' ? '🎉' : '💡'}
                        </Text>
                        <Text variant="titleLarge" style={styles.resultTitle}>
                            {result.status === 'correct' ? 'Excellent!' : 'Keep Practicing!'}
                        </Text>
                        <Text style={styles.resultFeedback}>{result.feedback}</Text>

                        {result.similarity !== undefined && (
                            <View style={styles.similarityContainer}>
                                <Text style={styles.similarityLabel}>Accuracy</Text>
                                <Text style={styles.similarityValue}>{result.similarity}%</Text>
                            </View>
                        )}

                        {result.transcript && (
                            <View style={styles.transcriptContainer}>
                                <Text style={styles.transcriptLabel}>You said:</Text>
                                <Text style={styles.transcriptText}>"{result.transcript}"</Text>
                            </View>
                        )}

                        {result.corrected_audio_url && (
                            <Button
                                mode="contained"
                                icon={audioPlaying ? 'pause' : 'play'}
                                onPress={playCorrectAudio}
                                style={styles.playButton}
                                loading={audioPlaying}
                            >
                                {audioPlaying ? 'Playing...' : 'Hear Your Voice'}
                            </Button>
                        )}
                    </Surface>
                )}

                {/* Next Button */}
                <Button
                    mode="outlined"
                    icon="refresh"
                    onPress={loadSentence}
                    style={styles.nextButton}
                    disabled={isRecording || analyzing}
                >
                    Next Sentence
                </Button>

                {/* Voice Cloning Info */}
                <Surface style={styles.infoCard} elevation={1}>
                    <Text style={styles.infoTitle}>💡 Voice Cloning Feature</Text>
                    <Text style={styles.infoText}>
                        When your pronunciation needs improvement, we use AI to show you the
                        correct pronunciation in your own voice! This makes learning more
                        personal and effective. You have {remainingClones} free clones remaining today.
                    </Text>
                </Surface>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#a29bfe',
        marginTop: 16,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cloneChip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cloneChipText: {
        color: '#fff',
        fontSize: 11,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
    },
    sentenceCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        margin: 20,
        alignItems: 'center',
    },
    sentenceText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 36,
    },
    phoneticText: {
        color: '#6c5ce7',
        marginTop: 12,
        fontSize: 16,
    },
    levelChip: {
        marginTop: 16,
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderColor: '#6c5ce7',
    },
    recordSection: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 20,
        alignItems: 'center',
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
    recordButtonIcon: {
        fontSize: 40,
    },
    analyzingCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 30,
        margin: 20,
        alignItems: 'center',
    },
    analyzingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    analyzingSubtext: {
        color: '#a29bfe',
        marginTop: 8,
    },
    resultCard: {
        borderRadius: 20,
        padding: 24,
        margin: 20,
        alignItems: 'center',
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
        fontSize: 48,
        marginBottom: 12,
    },
    resultTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    resultFeedback: {
        color: '#a29bfe',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    similarityContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    similarityLabel: {
        color: '#a29bfe',
        fontSize: 12,
    },
    similarityValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    transcriptContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        width: '100%',
    },
    transcriptLabel: {
        color: '#a29bfe',
        fontSize: 12,
        marginBottom: 4,
    },
    transcriptText: {
        color: '#fff',
        fontStyle: 'italic',
    },
    playButton: {
        marginTop: 20,
        borderRadius: 12,
        backgroundColor: '#6c5ce7',
    },
    nextButton: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        borderColor: '#6c5ce7',
    },
    infoCard: {
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderRadius: 16,
        padding: 20,
        margin: 20,
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
        lineHeight: 22,
    },
});

export default EchoPracticeScreen;
