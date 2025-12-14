import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions
} from 'react-native';
import {
    Text,
    Surface,
    Button,
    RadioButton,
    ProgressBar,
    ActivityIndicator
} from 'react-native-paper';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const { width } = Dimensions.get('window');

const PlacementTestScreen = () => {
    const { updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPlacementTest();
    }, []);

    const fetchPlacementTest = async () => {
        try {
            // For demo, use mock data since we don't have seeded data
            const mockQuiz = {
                _id: 'placement-test',
                title: 'English Level Placement Test',
                description: 'This test will help us determine your English level',
                questions: [
                    {
                        question: 'She ___ to school every day.',
                        options: ['go', 'goes', 'going', 'went'],
                        correctAnswer: 'goes',
                        explanation: 'Third person singular uses "goes"'
                    },
                    {
                        question: 'I have been living here ___ 2018.',
                        options: ['for', 'since', 'from', 'during'],
                        correctAnswer: 'since',
                        explanation: '"Since" is used with a specific point in time'
                    },
                    {
                        question: 'If I ___ rich, I would travel the world.',
                        options: ['am', 'was', 'were', 'be'],
                        correctAnswer: 'were',
                        explanation: 'Second conditional uses "were" for all subjects'
                    },
                    {
                        question: 'The book ___ by millions of people.',
                        options: ['has read', 'has been read', 'was reading', 'is reading'],
                        correctAnswer: 'has been read',
                        explanation: 'Present perfect passive voice'
                    },
                    {
                        question: 'Neither the students nor the teacher ___ present.',
                        options: ['was', 'were', 'are', 'is'],
                        correctAnswer: 'was',
                        explanation: 'With "neither...nor", the verb agrees with the closer subject'
                    }
                ]
            };
            setQuiz(mockQuiz);
            setAnswers(new Array(mockQuiz.questions.length).fill(''));
        } catch (error) {
            console.error('Failed to fetch placement test:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = selectedAnswer;
        setAnswers(newAnswers);
        setSelectedAnswer(answers[currentQuestion + 1] || '');
        setCurrentQuestion(currentQuestion + 1);
    };

    const handlePrevious = () => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = selectedAnswer;
        setAnswers(newAnswers);
        setSelectedAnswer(answers[currentQuestion - 1] || '');
        setCurrentQuestion(currentQuestion - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const finalAnswers = [...answers];
        finalAnswers[currentQuestion] = selectedAnswer;

        // Calculate score locally for demo
        let correct = 0;
        quiz.questions.forEach((q, i) => {
            if (finalAnswers[i] === q.correctAnswer) correct++;
        });

        const score = Math.round((correct / quiz.questions.length) * 100);
        let level = 'beginner';
        if (score >= 90) level = 'advanced';
        else if (score >= 75) level = 'upper-intermediate';
        else if (score >= 60) level = 'intermediate';
        else if (score >= 40) level = 'elementary';

        setResult({
            score,
            level,
            correctCount: correct,
            totalQuestions: quiz.questions.length
        });
        setShowResult(true);
        setSubmitting(false);
    };

    const handleContinue = async () => {
        try {
            // Try to update level on backend
            await api.updateLevel({ level: result.level, testScore: result.score });
        } catch (error) {
            console.log('API updateLevel failed, continuing with local update');
        }
        // Always update local user state to proceed
        await updateUser({ level: result.level, levelTestCompleted: true });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading placement test...</Text>
            </View>
        );
    }

    if (showResult) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.resultContent}>
                    <Surface style={styles.resultCard} elevation={2}>
                        <Text style={styles.resultEmoji}>
                            {result.score >= 60 ? '🎉' : '💪'}
                        </Text>
                        <Text variant="headlineLarge" style={styles.resultTitle}>
                            Test Complete!
                        </Text>
                        <Text variant="displaySmall" style={styles.scoreText}>
                            {result.score}%
                        </Text>
                        <Text variant="titleMedium" style={styles.levelText}>
                            Your Level: {result.level.replace('-', ' ').toUpperCase()}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statsText}>
                            {result.correctCount} out of {result.totalQuestions} correct
                        </Text>
                        <Button
                            mode="contained"
                            onPress={handleContinue}
                            style={styles.continueButton}
                            contentStyle={styles.buttonContent}
                        >
                            Start Learning
                        </Button>
                    </Surface>
                </ScrollView>
            </View>
        );
    }

    const question = quiz?.questions[currentQuestion];
    const progress = (currentQuestion + 1) / quiz?.questions.length;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.title}>
                        📝 Placement Test
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Question {currentQuestion + 1} of {quiz?.questions.length}
                    </Text>
                </View>

                {/* Progress */}
                <ProgressBar
                    progress={progress}
                    color="#6c5ce7"
                    style={styles.progressBar}
                />

                {/* Question Card */}
                <Surface style={styles.questionCard} elevation={2}>
                    <Text variant="titleLarge" style={styles.questionText}>
                        {question?.question}
                    </Text>

                    <RadioButton.Group
                        onValueChange={setSelectedAnswer}
                        value={selectedAnswer}
                    >
                        {question?.options.map((option, index) => (
                            <Surface
                                key={index}
                                style={[
                                    styles.optionCard,
                                    selectedAnswer === option && styles.optionSelected
                                ]}
                                elevation={1}
                            >
                                <RadioButton.Item
                                    label={option}
                                    value={option}
                                    labelStyle={styles.optionLabel}
                                    color="#6c5ce7"
                                />
                            </Surface>
                        ))}
                    </RadioButton.Group>
                </Surface>

                {/* Navigation */}
                <View style={styles.navigation}>
                    <Button
                        mode="outlined"
                        onPress={handlePrevious}
                        disabled={currentQuestion === 0}
                        style={styles.navButton}
                    >
                        Previous
                    </Button>

                    {currentQuestion === quiz?.questions.length - 1 ? (
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            disabled={!selectedAnswer}
                            loading={submitting}
                            style={styles.navButton}
                        >
                            Submit
                        </Button>
                    ) : (
                        <Button
                            mode="contained"
                            onPress={handleNext}
                            disabled={!selectedAnswer}
                            style={styles.navButton}
                        >
                            Next
                        </Button>
                    )}
                </View>
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
    content: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#a29bfe',
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0f3460',
        marginBottom: 24,
    },
    questionCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
    },
    questionText: {
        color: '#fff',
        fontWeight: '600',
        marginBottom: 24,
        lineHeight: 32,
    },
    optionCard: {
        backgroundColor: '#0f3460',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
    },
    optionLabel: {
        color: '#fff',
        fontSize: 16,
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    navButton: {
        flex: 0.48,
        borderRadius: 12,
    },
    resultContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: '#16213e',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    resultEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    resultTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    scoreText: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    levelText: {
        color: '#a29bfe',
        marginBottom: 8,
    },
    statsText: {
        color: '#a29bfe',
        marginBottom: 32,
    },
    continueButton: {
        width: '100%',
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});

export default PlacementTestScreen;
