import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    FlatList,
    Dimensions,
    Linking
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    Surface,
    IconButton,
    ActivityIndicator,
    Chip,
    Modal,
    Portal,
    Divider
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const LEVEL_OPTIONS = [
    { label: 'Beginner', value: 'beginner', color: '#27ae60' },
    { label: 'Elementary', value: 'elementary', color: '#3498db' },
    { label: 'Intermediate', value: 'intermediate', color: '#f39c12' },
    { label: 'Upper-Int.', value: 'upper-intermediate', color: '#e74c3c' },
    { label: 'Advanced', value: 'advanced', color: '#9b59b6' },
];

const SOURCE_TYPES = [
    { label: 'YouTube', value: 'youtube', icon: 'youtube', color: '#ff0000' },
    { label: 'TikTok', value: 'tiktok', icon: 'music-note', color: '#000' },
    { label: 'Instagram', value: 'instagram', icon: 'instagram', color: '#e1306c' },
    { label: 'Direct URL', value: 'uploaded', icon: 'link', color: '#6c5ce7' },
];

const ReelManagementScreen = ({ navigation }) => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [level, setLevel] = useState('intermediate');
    const [sourceType, setSourceType] = useState('uploaded');

    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
        try {
            console.log('Loading reels...');
            const response = await api.getReels({ limit: 50 });
            console.log('Reels response:', response.data);

            // Backend { data: [...] } veya direkt [...] dönebilir
            const reelsData = response.data?.data || response.data || [];
            console.log('Reels data:', reelsData);
            setReels(Array.isArray(reelsData) ? reelsData : []);
        } catch (error) {
            console.error('Load reels error:', error);
            console.error('Error response:', error.response?.data);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setLevel('intermediate');
        setSourceType('uploaded');
    };

    const detectSourceType = (url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        return 'uploaded';
    };

    const handleUrlChange = (url) => {
        setVideoUrl(url);
        const detected = detectSourceType(url);
        setSourceType(detected);
    };

    const handleAddReel = async () => {
        console.log('handleAddReel called');
        console.log('Title:', title);
        console.log('VideoUrl:', videoUrl);

        if (!title.trim()) {
            Alert.alert('Hata', 'Başlık gereklidir');
            return;
        }
        if (!videoUrl.trim()) {
            Alert.alert('Hata', 'Video URL gereklidir');
            return;
        }

        setSaving(true);
        try {
            console.log('Sending request to add reel...');
            const response = await api.addReel({
                title: title.trim(),
                description: description.trim(),
                videoUrl: videoUrl.trim(),
                level,
                sourceType,
                sourceUrl: videoUrl.trim()
            });

            console.log('Response:', response.data);

            // Backend direkt reel objesi veya { success: true, data: reel } dönebilir
            if (response.data?.success || response.data?._id || response.data?.data?._id) {
                Alert.alert('Başarılı', 'Reel eklendi!');
                resetForm();
                setModalVisible(false);
                loadReels();
            } else {
                Alert.alert('Hata', response.data?.message || 'Beklenmeyen hata');
            }
        } catch (error) {
            console.error('Add reel error:', error);
            console.error('Error response:', error.response?.data);
            Alert.alert('Hata', error.response?.data?.message || 'Reel eklenemedi: ' + error.message);
        }
        setSaving(false);
    };

    const handleDeleteReel = (id, title) => {
        Alert.alert(
            'Reel Sil',
            `"${title}" silinsin mi?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteReel(id);
                            setReels(prev => prev.filter(r => r._id !== id));
                        } catch (error) {
                            Alert.alert('Hata', 'Silinemedi');
                        }
                    }
                }
            ]
        );
    };

    const getLevelColor = (lvl) => {
        return LEVEL_OPTIONS.find(l => l.value === lvl)?.color || '#6c5ce7';
    };

    const getSourceIcon = (type) => {
        return SOURCE_TYPES.find(s => s.value === type)?.icon || 'link';
    };

    const renderReelItem = ({ item }) => (
        <Surface style={styles.reelCard} elevation={2}>
            <View style={styles.reelHeader}>
                <View style={styles.reelInfo}>
                    <Text style={styles.reelTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.reelMeta}>
                        <Chip
                            mode="flat"
                            compact
                            style={[styles.levelChip, { backgroundColor: getLevelColor(item.level) }]}
                            textStyle={styles.levelChipText}
                        >
                            {item.level}
                        </Chip>
                        <MaterialCommunityIcons
                            name={getSourceIcon(item.sourceType)}
                            size={16}
                            color="#a29bfe"
                            style={{ marginLeft: 8 }}
                        />
                        <Text style={styles.statsText}>👁 {item.views} • ❤️ {item.likes}</Text>
                    </View>
                </View>
                <IconButton
                    icon="delete"
                    iconColor="#e74c3c"
                    size={20}
                    onPress={() => handleDeleteReel(item._id, item.title)}
                />
            </View>
            <Text style={styles.reelUrl} numberOfLines={1}>{item.videoUrl}</Text>
        </Surface>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#6c5ce7', '#a29bfe']} style={styles.header}>
                <View style={styles.headerRow}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => navigation.goBack()}
                    />
                    <Text style={styles.headerTitle}>🎬 Reel Yönetimi</Text>
                    <IconButton
                        icon="plus"
                        iconColor="#fff"
                        size={24}
                        onPress={() => setModalVisible(true)}
                    />
                </View>
                <Text style={styles.headerSubtitle}>
                    {reels.length} reel • Video URL'i girerek ekle
                </Text>
            </LinearGradient>

            {/* Reel List */}
            {loading ? (
                <ActivityIndicator size="large" color="#6c5ce7" style={styles.loader} />
            ) : (
                <FlatList
                    data={reels}
                    keyExtractor={(item) => item._id}
                    renderItem={renderReelItem}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        loadReels();
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🎬</Text>
                            <Text style={styles.emptyText}>Henüz reel yok</Text>
                            <Button
                                mode="contained"
                                onPress={() => setModalVisible(true)}
                                style={styles.addButton}
                            >
                                İlk Reel'i Ekle
                            </Button>
                        </View>
                    }
                />
            )}

            {/* Add Reel Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>🎬 Yeni Reel Ekle</Text>

                        {/* Video URL */}
                        <TextInput
                            label="Video URL *"
                            value={videoUrl}
                            onChangeText={handleUrlChange}
                            mode="outlined"
                            style={styles.input}
                            placeholder="YouTube, TikTok, Instagram veya direkt video linki"
                            placeholderTextColor="#666"
                            outlineColor="#6c5ce7"
                            activeOutlineColor="#a29bfe"
                            textColor="#fff"
                            left={<TextInput.Icon icon="link" color="#a29bfe" />}
                        />

                        {/* Detected Source */}
                        <View style={styles.sourceRow}>
                            <Text style={styles.sourceLabel}>Platform:</Text>
                            <View style={styles.sourceChips}>
                                {SOURCE_TYPES.map((src) => (
                                    <TouchableOpacity
                                        key={src.value}
                                        onPress={() => setSourceType(src.value)}
                                        style={[
                                            styles.sourceChip,
                                            sourceType === src.value && styles.sourceChipActive
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={src.icon}
                                            size={16}
                                            color={sourceType === src.value ? '#fff' : '#a29bfe'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Title */}
                        <TextInput
                            label="Başlık *"
                            value={title}
                            onChangeText={setTitle}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#6c5ce7"
                            activeOutlineColor="#a29bfe"
                            textColor="#fff"
                        />

                        {/* Description */}
                        <TextInput
                            label="Açıklama"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={2}
                            outlineColor="#6c5ce7"
                            activeOutlineColor="#a29bfe"
                            textColor="#fff"
                        />

                        {/* Level */}
                        <Text style={styles.levelLabel}>Seviye:</Text>
                        <View style={styles.levelRow}>
                            {LEVEL_OPTIONS.map((lvl) => (
                                <TouchableOpacity
                                    key={lvl.value}
                                    onPress={() => setLevel(lvl.value)}
                                    style={[
                                        styles.levelOption,
                                        level === lvl.value && { backgroundColor: lvl.color }
                                    ]}
                                >
                                    <Text style={[
                                        styles.levelOptionText,
                                        level === lvl.value && { color: '#fff' }
                                    ]}>
                                        {lvl.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Divider style={styles.divider} />

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    resetForm();
                                    setModalVisible(false);
                                }}
                                style={styles.cancelButton}
                                textColor="#a29bfe"
                            >
                                İptal
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleAddReel}
                                loading={saving}
                                disabled={saving}
                                style={styles.saveButton}
                                buttonColor="#6c5ce7"
                            >
                                Ekle
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 4,
    },
    loader: {
        marginTop: 40,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    reelCard: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    reelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reelInfo: {
        flex: 1,
    },
    reelTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    reelMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelChip: {
        height: 22,
    },
    levelChipText: {
        color: '#fff',
        fontSize: 10,
    },
    statsText: {
        color: '#a29bfe',
        fontSize: 12,
        marginLeft: 8,
    },
    reelUrl: {
        color: '#666',
        fontSize: 11,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        color: '#a29bfe',
        fontSize: 16,
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#6c5ce7',
    },
    modalContainer: {
        backgroundColor: '#16213e',
        margin: 20,
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#1a1a2e',
        marginBottom: 12,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sourceLabel: {
        color: '#a29bfe',
        marginRight: 12,
    },
    sourceChips: {
        flexDirection: 'row',
        gap: 8,
    },
    sourceChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceChipActive: {
        backgroundColor: '#6c5ce7',
    },
    levelLabel: {
        color: '#a29bfe',
        marginBottom: 8,
    },
    levelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    levelOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
    },
    levelOptionText: {
        color: '#a29bfe',
        fontSize: 12,
    },
    divider: {
        backgroundColor: '#333',
        marginVertical: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        marginRight: 8,
        borderColor: '#6c5ce7',
    },
    saveButton: {
        flex: 1,
        marginLeft: 8,
    },
});

export default ReelManagementScreen;
