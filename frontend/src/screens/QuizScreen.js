import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
    Text,
    Surface,
    Button,
    RadioButton,
    ProgressBar,
    ActivityIndicator
} from 'react-native-paper';
import api from '../services/api';

const QuizScreen = ({ navigation, route }) => {
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            // Mock quiz data for demo
            const mockQuiz = {
                _id: 'daily-quiz',
                title: 'Daily Grammar Challenge',
                description: 'Test your grammar skills',
                questions: [
                    {
                        question: 'Choose the correct sentence:',
                        options: [
                            'He don\'t like coffee.',
                            'He doesn\'t likes coffee.',
                            'He doesn\'t like coffee.',
                            'He not like coffee.'
                        ],
                        correctAnswer: 'He doesn\'t like coffee.',
                    },
                    {
                        question: 'What is the past tense of "swim"?',
                        options: ['swimmed', 'swam', 'swum', 'swimed'],
                        correctAnswer: 'swam',
                    },
                    {
                        question: 'I wish I ___ a car.',
                        options: ['have', 'had', 'has', 'having'],
                        correctAnswer: 'had',
                    }
                ]
            };
            setQuiz(mockQuiz);
            setAnswers(new Array(mockQuiz.questions.length).fill(''));
        } catch (error) {
            console.error('Failed to fetch quiz:', error);
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

        let correct = 0;
        quiz.questions.forEach((q, i) => {
            if (finalAnswers[i] === q.correctAnswer) correct++;
        });

        const score = Math.round((correct / quiz.questions.length) * 100);
        const points = Math.round(score / 10) * 10;

        setResult({
            score,
            points,
            correctCount: correct,
            totalQuestions: quiz.questions.length
        });
        setShowResult(true);
        setSubmitting(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        );
    }

    if (showResult) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.resultContent}>
                    <Surface style={styles.resultCard} elevation={2}>
                        <Text style={styles.resultEmoji}>
                            {result.score >= 80 ? '🏆' : result.score >= 50 ? '👍' : '💪'}
                        </Text>
                        <Text variant="headlineLarge" style={styles.resultTitle}>
                            {result.score >= 80 ? 'Excellent!' : result.score >= 50 ? 'Good Job!' : 'Keep Practicing!'}
                        </Text>
                        <Text variant="displaySmall" style={styles.scoreText}>
                            {result.score}%
                        </Text>
                        <Text variant="titleMedium" style={styles.pointsText}>
                            +{result.points} points earned
                        </Text>
                        <Text variant="bodyMedium" style={styles.statsText}>
                            {result.correctCount} out of {result.totalQuestions} correct
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.goBack()}
                            style={styles.continueButton}
                        >
                            Back to Home
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
                <View style={styles.header}>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Question {currentQuestion + 1} of {quiz?.questions.length}
                    </Text>
                </View>

                <ProgressBar
                    progress={progress}
                    color="#6c5ce7"
                    style={styles.progressBar}
                />

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
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    subtitle: {
        color: '#a29bfe',
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
    pointsText: {
        color: '#fdcb6e',
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
});

export default QuizScreen;
