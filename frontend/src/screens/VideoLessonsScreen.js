import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import {
    Text,
    Surface,
    Button,
    ActivityIndicator,
    Chip
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const VideoLessonsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        // Mock data for demo
        setVideos([
            {
                id: '1',
                title: 'Introduction to English Greetings',
                description: 'Learn basic greetings and introductions in English',
                duration: '5:30',
                level: 'beginner',
                thumbnail: null,
                views: 1234,
            },
            {
                id: '2',
                title: 'Present Tense Made Easy',
                description: 'Master the present simple and continuous tenses',
                duration: '8:15',
                level: 'elementary',
                thumbnail: null,
                views: 892,
            },
            {
                id: '3',
                title: 'Ordering at a Restaurant',
                description: 'Real-world conversation practice for dining',
                duration: '6:45',
                level: 'intermediate',
                thumbnail: null,
                views: 2156,
            },
            {
                id: '4',
                title: 'Business Email Writing',
                description: 'Professional email etiquette and phrases',
                duration: '10:20',
                level: 'upper-intermediate',
                thumbnail: null,
                views: 567,
            },
        ]);
        setLoading(false);
    }, []);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        );
    }

    if (selectedVideo) {
        return (
            <View style={styles.container}>
                <View style={styles.playerContainer}>
                    <View style={styles.placeholderPlayer}>
                        <Text style={styles.placeholderIcon}>🎬</Text>
                        <Text style={styles.placeholderTitle}>{selectedVideo.title}</Text>
                        <Text style={styles.placeholderText}>Video coming soon...</Text>
                    </View>
                </View>

                <ScrollView style={styles.detailsContainer}>
                    <Text variant="headlineSmall" style={styles.videoTitle}>
                        {selectedVideo.title}
                    </Text>
                    <View style={styles.videoMeta}>
                        <Chip
                            mode="outlined"
                            style={[styles.levelChip, { borderColor: getLevelColor(selectedVideo.level) }]}
                            textStyle={[styles.levelChipText, { color: getLevelColor(selectedVideo.level) }]}
                        >
                            {selectedVideo.level}
                        </Chip>
                        <Text style={styles.videoDuration}>⏱ {selectedVideo.duration}</Text>
                        <Text style={styles.videoViews}>👁 {selectedVideo.views}</Text>
                    </View>
                    <Text style={styles.videoDescription}>{selectedVideo.description}</Text>

                    <Button
                        mode="outlined"
                        icon="arrow-left"
                        onPress={() => setSelectedVideo(null)}
                        style={styles.backButton}
                    >
                        Back to Videos
                    </Button>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient
                    colors={['#fd79a8', '#fab1ba']}
                    style={styles.header}
                >
                    <Text variant="headlineSmall" style={styles.headerTitle}>
                        🎬 Video Lessons
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Learn with AI-powered video tutors
                    </Text>
                </LinearGradient>

                {/* Video List */}
                <View style={styles.videoList}>
                    {videos.map((video) => (
                        <TouchableOpacity
                            key={video.id}
                            onPress={() => setSelectedVideo(video)}
                            activeOpacity={0.8}
                        >
                            <Surface style={styles.videoCard} elevation={2}>
                                <LinearGradient
                                    colors={['#0f3460', '#16213e']}
                                    style={styles.thumbnail}
                                >
                                    <Text style={styles.thumbnailIcon}>▶️</Text>
                                    <View style={styles.durationBadge}>
                                        <Text style={styles.durationText}>{video.duration}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={styles.videoInfo}>
                                    <Chip
                                        mode="outlined"
                                        style={[styles.smallChip, { borderColor: getLevelColor(video.level) }]}
                                        textStyle={[styles.smallChipText, { color: getLevelColor(video.level) }]}
                                    >
                                        {video.level}
                                    </Chip>
                                    <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
                                        {video.title}
                                    </Text>
                                    <Text style={styles.cardDescription} numberOfLines={1}>
                                        {video.description}
                                    </Text>
                                    <Text style={styles.cardViews}>👁 {video.views} views</Text>
                                </View>
                            </Surface>
                        </TouchableOpacity>
                    ))}
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
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    videoList: {
        padding: 20,
    },
    videoCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    thumbnail: {
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    thumbnailIcon: {
        fontSize: 48,
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
    smallChip: {
        alignSelf: 'flex-start',
        marginBottom: 8,
        height: 24,
    },
    smallChipText: {
        fontSize: 10,
    },
    cardTitle: {
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDescription: {
        color: '#a29bfe',
        fontSize: 13,
        marginBottom: 8,
    },
    cardViews: {
        color: '#a29bfe',
        fontSize: 12,
    },
    playerContainer: {
        height: 240,
        backgroundColor: '#000',
    },
    placeholderPlayer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f3460',
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    placeholderText: {
        color: '#a29bfe',
        fontSize: 14,
    },
    detailsContainer: {
        flex: 1,
        padding: 20,
    },
    videoTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 12,
    },
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    levelChip: {
        height: 28,
    },
    levelChipText: {
        fontSize: 11,
    },
    videoDuration: {
        color: '#a29bfe',
        fontSize: 13,
    },
    videoViews: {
        color: '#a29bfe',
        fontSize: 13,
    },
    videoDescription: {
        color: '#a29bfe',
        lineHeight: 22,
        marginBottom: 24,
    },
    backButton: {
        borderColor: '#6c5ce7',
        borderRadius: 12,
    },
});

export default VideoLessonsScreen;
