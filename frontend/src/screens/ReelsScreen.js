import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    StatusBar,
    PanResponder,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

// Demo reels data - Eğitim videoları için örnek
const DEMO_REELS = [
    {
        id: '1',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        title: 'English Greetings 101',
        description: 'Learn the most common ways to greet people in English! 👋 #LearnEnglish #Greetings',
        level: 'beginner',
        likes: 1234,
        comments: 89,
        shares: 45,
        views: 5678,
        isLiked: false,
        isBookmarked: false,
        creator: {
            name: 'EchoMind',
            avatar: '👨‍🏫',
            verified: true,
        },
        sourceType: 'ai-generated',
    },
    {
        id: '2',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        title: 'Present Tense Tips',
        description: 'Master the present simple and continuous in just 60 seconds! ⏰ #Grammar #EnglishTips',
        level: 'elementary',
        likes: 892,
        comments: 56,
        shares: 23,
        views: 3421,
        isLiked: true,
        isBookmarked: false,
        creator: {
            name: 'Grammar Pro',
            avatar: '📚',
            verified: true,
        },
        sourceType: 'uploaded',
    },
    {
        id: '3',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        title: 'Restaurant Vocabulary',
        description: 'Order like a pro at any restaurant! 🍽️ #FoodEnglish #Vocabulary',
        level: 'intermediate',
        likes: 2156,
        comments: 134,
        shares: 78,
        views: 8934,
        isLiked: false,
        isBookmarked: true,
        creator: {
            name: 'Daily English',
            avatar: '🌟',
            verified: false,
        },
        sourceType: 'tiktok',
    },
    {
        id: '4',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        title: 'Phrasal Verbs Made Easy',
        description: 'Stop making mistakes with phrasal verbs! 🎯 #PhrasalVerbs #AdvancedEnglish',
        level: 'advanced',
        likes: 567,
        comments: 45,
        shares: 12,
        views: 2345,
        isLiked: false,
        isBookmarked: false,
        creator: {
            name: 'English Master',
            avatar: '🎓',
            verified: true,
        },
        sourceType: 'instagram',
    },
];

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

// Single Reel Item Component
const ReelItem = ({ item, isActive, onLike, onBookmark, onShare, onComment }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showHeart, setShowHeart] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(0);

    // Auto play/pause based on visibility
    useEffect(() => {
        if (isActive) {
            videoRef.current?.playAsync();
            setIsPlaying(true);
        } else {
            videoRef.current?.pauseAsync();
            setIsPlaying(false);
        }
    }, [isActive]);

    // Handle double tap to like
    const handleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // Double tap - like
            handleDoubleTapLike();
        } else {
            // Single tap - toggle play/pause
            if (isPlaying) {
                videoRef.current?.pauseAsync();
                setIsPlaying(false);
            } else {
                videoRef.current?.playAsync();
                setIsPlaying(true);
            }
        }
        lastTap.current = now;
    };

    const handleDoubleTapLike = () => {
        if (!item.isLiked) {
            onLike(item.id);
        }
        // Show heart animation
        setShowHeart(true);
        Animated.sequence([
            Animated.spring(heartScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.timing(heartScale, {
                toValue: 0,
                duration: 300,
                delay: 500,
                useNativeDriver: true,
            }),
        ]).start(() => setShowHeart(false));
    };

    const handlePlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setIsLoading(false);
            setHasError(false);
            if (status.durationMillis) {
                setProgress(status.positionMillis / status.durationMillis);
            }
        }
        if (status.didJustFinish) {
            videoRef.current?.replayAsync();
        }
        if (status.error) {
            console.log('Video playback error:', status.error);
            setHasError(true);
            setIsLoading(false);
        }
    };

    const handleVideoError = (error) => {
        console.log('Video load error:', error);
        setHasError(true);
        setIsLoading(false);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <View style={styles.reelContainer}>
            <TouchableWithoutFeedback onPress={handleTap}>
                <View style={styles.videoWrapper}>
                    <Video
                        ref={videoRef}
                        source={{ uri: item.videoUrl }}
                        style={styles.video}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        isMuted={isMuted}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        onError={handleVideoError}
                        shouldPlay={isActive}
                        onLoadStart={() => setIsLoading(true)}
                        onLoad={() => setIsLoading(false)}
                    />

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.gradientOverlay}
                    />

                    {/* Loading Indicator */}
                    {isLoading && !hasError && (
                        <View style={styles.playPauseOverlay}>
                            <ActivityIndicator size="large" color="#6c5ce7" />
                            <Text style={{ color: '#fff', marginTop: 10 }}>Yükleniyor...</Text>
                        </View>
                    )}

                    {/* Error State */}
                    {hasError && (
                        <View style={styles.playPauseOverlay}>
                            <MaterialCommunityIcons name="video-off" size={60} color="#e74c3c" />
                            <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>
                                Video yüklenemedi
                            </Text>
                            <Text style={{ color: '#999', marginTop: 5, fontSize: 12 }}>
                                {item.sourceType === 'tiktok' || item.sourceType === 'instagram'
                                    ? 'Sosyal medya videoları sınırlı olabilir'
                                    : 'URL geçersiz olabilir'}
                            </Text>
                        </View>
                    )}

                    {/* Play/Pause Icon */}
                    {!isPlaying && !isLoading && !hasError && (
                        <View style={styles.playPauseOverlay}>
                            <MaterialCommunityIcons name="play" size={80} color="rgba(255,255,255,0.7)" />
                        </View>
                    )}

                    {/* Double Tap Heart Animation */}
                    {showHeart && (
                        <Animated.View style={[styles.heartAnimation, { transform: [{ scale: heartScale }] }]}>
                            <MaterialCommunityIcons name="heart" size={120} color="#e74c3c" />
                        </Animated.View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* Bottom Info */}
            <View style={styles.bottomInfo}>
                {/* Creator Info */}
                <View style={styles.creatorRow}>
                    <View style={styles.creatorAvatar}>
                        <Text style={styles.avatarEmoji}>{item.creator.avatar}</Text>
                    </View>
                    <Text style={styles.creatorName}>{item.creator.name}</Text>
                    {item.creator.verified && (
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#3498db" />
                    )}
                    <TouchableOpacity style={styles.followButton}>
                        <Text style={styles.followText}>Follow</Text>
                    </TouchableOpacity>
                </View>

                {/* Title & Description */}
                <Text style={styles.reelTitle}>{item.title}</Text>
                <Text style={styles.reelDescription} numberOfLines={2}>{item.description}</Text>

                {/* Level Chip */}
                <View style={[styles.levelChip, { backgroundColor: getLevelColor(item.level) }]}>
                    <Text style={styles.levelText}>{item.level}</Text>
                </View>
            </View>

            {/* Right Side Actions */}
            <View style={styles.actionsColumn}>
                {/* Like */}
                <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item.id)}>
                    <MaterialCommunityIcons
                        name={item.isLiked ? "heart" : "heart-outline"}
                        size={32}
                        color={item.isLiked ? "#e74c3c" : "#fff"}
                    />
                    <Text style={styles.actionCount}>{formatNumber(item.likes)}</Text>
                </TouchableOpacity>

                {/* Comment */}
                <TouchableOpacity style={styles.actionButton} onPress={() => onComment(item.id)}>
                    <MaterialCommunityIcons name="comment-outline" size={32} color="#fff" />
                    <Text style={styles.actionCount}>{formatNumber(item.comments)}</Text>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity style={styles.actionButton} onPress={() => onShare(item.id)}>
                    <MaterialCommunityIcons name="share-outline" size={32} color="#fff" />
                    <Text style={styles.actionCount}>{formatNumber(item.shares)}</Text>
                </TouchableOpacity>

                {/* Bookmark */}
                <TouchableOpacity style={styles.actionButton} onPress={() => onBookmark(item.id)}>
                    <MaterialCommunityIcons
                        name={item.isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={32}
                        color={item.isBookmarked ? "#f39c12" : "#fff"}
                    />
                </TouchableOpacity>

                {/* Mute/Unmute */}
                <TouchableOpacity style={styles.actionButton} onPress={() => setIsMuted(!isMuted)}>
                    <MaterialCommunityIcons
                        name={isMuted ? "volume-off" : "volume-high"}
                        size={28}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
        </View>
    );
};

// Main Reels Screen
const ReelsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [reels, setReels] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    // API'dan reels çek
    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
        setLoading(true);
        try {
            console.log('ReelsScreen: Loading reels from API...');
            const response = await api.getReels({ limit: 50 });
            console.log('ReelsScreen: API response:', response.data);

            const reelsData = response.data?.data || response.data || [];

            if (Array.isArray(reelsData) && reelsData.length > 0) {
                // API'dan gelen veriyi uygun formata dönüştür
                const formattedReels = reelsData.map(reel => ({
                    id: reel._id || reel.id,
                    videoUrl: reel.videoUrl,
                    title: reel.title,
                    description: reel.description || '',
                    level: reel.level || 'intermediate',
                    likes: reel.likes || 0,
                    comments: reel.comments || 0,
                    shares: reel.shares || 0,
                    views: reel.views || 0,
                    isLiked: reel.isLiked || false,
                    isBookmarked: reel.isBookmarked || false,
                    creator: reel.creator || { name: 'EchoMind', avatar: '👨‍🏫', verified: true },
                    sourceType: reel.sourceType || 'uploaded',
                }));
                console.log('ReelsScreen: Formatted reels:', formattedReels.length);
                setReels(formattedReels);
            } else {
                console.log('ReelsScreen: No reels from API, using demo data');
                setReels(DEMO_REELS);
            }
        } catch (error) {
            console.error('ReelsScreen: Load error:', error);
            // Fallback to demo data
            setReels(DEMO_REELS);
        }
        setLoading(false);
    };

    const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50,
    };

    const handleLike = async (id) => {
        setReels(prev => prev.map(reel =>
            reel.id === id
                ? { ...reel, isLiked: !reel.isLiked, likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1 }
                : reel
        ));
        try {
            await api.likeReel(id);
        } catch (error) {
            console.log('Like error:', error);
        }
    };

    const handleBookmark = async (id) => {
        setReels(prev => prev.map(reel =>
            reel.id === id
                ? { ...reel, isBookmarked: !reel.isBookmarked }
                : reel
        ));
        try {
            await api.bookmarkReel(id);
        } catch (error) {
            console.log('Bookmark error:', error);
        }
    };

    const handleShare = (id) => {
        console.log('Share reel:', id);
    };

    const handleComment = (id) => {
        console.log('Open comments for:', id);
    };

    const renderItem = ({ item, index }) => (
        <ReelItem
            item={item}
            isActive={index === currentIndex}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onComment={handleComment}
        />
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={{ color: '#fff', marginTop: 16 }}>Yükleniyor...</Text>
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 60, marginBottom: 16 }}>🎬</Text>
                <Text style={{ color: '#fff', fontSize: 18 }}>Henüz reel yok</Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginTop: 20, padding: 12, backgroundColor: '#6c5ce7', borderRadius: 8 }}
                >
                    <Text style={{ color: '#fff' }}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Learn</Text>
                <TouchableOpacity onPress={loadReels} style={styles.searchButton}>
                    <MaterialCommunityIcons name="refresh" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Reels FlatList */}
            <FlatList
                ref={flatListRef}
                data={reels}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                    length: height,
                    offset: height * index,
                    index,
                })}
                initialNumToRender={2}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 100,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelContainer: {
        width,
        height,
        backgroundColor: '#000',
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        flex: 1,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    playPauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartAnimation: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -60,
        marginTop: -60,
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 80,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    creatorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6c5ce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarEmoji: {
        fontSize: 20,
    },
    creatorName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 6,
    },
    followButton: {
        marginLeft: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    followText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    reelTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    reelDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    levelChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    actionsColumn: {
        position: 'absolute',
        right: 12,
        bottom: 120,
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionCount: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    progressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#6c5ce7',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});

export default ReelsScreen;
