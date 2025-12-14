import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, ProgressBar, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user, updateUser } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [dailyWord, setDailyWord] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [wordRes, notifRes] = await Promise.all([
                api.getDailyWord().catch(() => null),
                api.getNotifications({ unreadOnly: 'true' }).catch(() => null)
            ]);

            if (wordRes?.data?.word) setDailyWord(wordRes.data.word);
            if (notifRes?.data?.unreadCount) setUnreadNotifications(notifRes.data.unreadCount);
        } catch (error) {
            console.log('Fetch data error');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const features = [
        {
            id: 'pronunciation',
            title: 'Pronunciation',
            subtitle: 'Practice speaking',
            icon: '🎤',
            gradient: ['#6c5ce7', '#a29bfe'],
            screen: 'Learn'
        },
        {
            id: 'quiz',
            title: 'Daily Quiz',
            subtitle: 'Test your skills',
            icon: '📝',
            gradient: ['#00cec9', '#81ecec'],
            screen: 'Quiz'
        },
        {
            id: 'videos',
            title: 'Video Lessons',
            subtitle: 'Watch & learn',
            icon: '🎬',
            gradient: ['#fd79a8', '#fab1ba'],
            screen: 'Videos'
        },
        {
            id: 'avatar',
            title: 'Avatar Chat',
            subtitle: 'AI conversation',
            icon: '👤',
            gradient: ['#fdcb6e', '#ffeaa7'],
            screen: 'Avatar'
        },
    ];

    const dailyProgress = Math.min((user?.points || 0) / 100, 1);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#6c5ce7', '#a29bfe', '#74b9ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text variant="titleMedium" style={styles.greeting}>
                                Welcome back,
                            </Text>
                            <Text variant="headlineSmall" style={styles.userName}>
                                {user?.name || 'Learner'} 👋
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Text style={styles.notificationIcon}>🔔</Text>
                            {unreadNotifications > 0 && (
                                <Badge size={18} style={styles.badge}>{unreadNotifications}</Badge>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.points || 0}</Text>
                            <Text style={styles.statLabel}>Points</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.dailyStreak || 0}</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.level?.charAt(0).toUpperCase() || 'N/A'}</Text>
                            <Text style={styles.statLabel}>Level</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Daily Progress */}
                <Surface style={styles.progressCard} elevation={2}>
                    <View style={styles.progressHeader}>
                        <Text variant="titleMedium" style={styles.progressTitle}>Today's Progress</Text>
                        <Text style={styles.progressPercent}>{Math.round(dailyProgress * 100)}%</Text>
                    </View>
                    <ProgressBar progress={dailyProgress} color="#6c5ce7" style={styles.progressBar} />
                    <Text variant="bodySmall" style={styles.progressSubtext}>
                        {user?.points || 0} / 100 daily points
                    </Text>
                </Surface>

                {/* Daily Word */}
                {dailyWord && (
                    <Surface style={styles.wordCard} elevation={2}>
                        <View style={styles.wordHeader}>
                            <Text style={styles.wordIcon}>📚</Text>
                            <Text variant="titleMedium" style={styles.wordTitle}>Word of the Day</Text>
                        </View>
                        <Text variant="headlineSmall" style={styles.word}>{dailyWord.word}</Text>
                        <Text style={styles.phonetic}>{dailyWord.pronunciation || dailyWord.phonetic}</Text>
                        <Text style={styles.meaning}>{dailyWord.meaning}</Text>
                    </Surface>
                )}

                {/* Feature Cards */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Continue Learning</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={styles.featureCardWrapper}
                            onPress={() => navigation.navigate(feature.screen)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={feature.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.featureCard}
                            >
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Actions */}
                <Surface style={styles.quickActions} elevation={2}>
                    <Text variant="titleMedium" style={styles.quickTitle}>Quick Actions</Text>
                    <View style={styles.actionButtons}>
                        <Button
                            mode="contained"
                            icon="play"
                            onPress={() => navigation.navigate('Learn')}
                            style={styles.actionButton}
                            labelStyle={styles.actionButtonLabel}
                        >
                            Start Practice
                        </Button>
                        <Button
                            mode="outlined"
                            icon="trophy"
                            onPress={() => navigation.navigate('Quiz')}
                            style={styles.actionButtonOutline}
                            labelStyle={styles.actionButtonLabelOutline}
                        >
                            Take Quiz
                        </Button>
                    </View>
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
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    notificationButton: {
        position: 'relative',
    },
    notificationIcon: {
        fontSize: 28,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#e74c3c',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 20,
        margin: 20,
        marginTop: -20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    progressPercent: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        fontSize: 18,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0f3460',
    },
    progressSubtext: {
        color: '#a29bfe',
        marginTop: 8,
    },
    wordCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    wordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    wordIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    wordTitle: {
        color: '#a29bfe',
    },
    word: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    phonetic: {
        color: '#6c5ce7',
        marginBottom: 8,
    },
    meaning: {
        color: '#a29bfe',
        lineHeight: 22,
    },
    sectionTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        justifyContent: 'space-between',
    },
    featureCardWrapper: {
        width: (width - 48) / 2,
        marginHorizontal: 4,
        marginBottom: 16,
    },
    featureCard: {
        borderRadius: 20,
        padding: 20,
        height: 130,
        justifyContent: 'flex-end',
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    featureTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    featureSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    quickActions: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
    },
    quickTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 0.48,
        borderRadius: 12,
    },
    actionButtonOutline: {
        flex: 0.48,
        borderRadius: 12,
        borderColor: '#6c5ce7',
    },
    actionButtonLabel: {
        fontSize: 12,
    },
    actionButtonLabelOutline: {
        fontSize: 12,
        color: '#6c5ce7',
    },
});

export default HomeScreen;
