import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
    Text,
    Surface,
    Button,
    TextInput,
    Chip,
    ActivityIndicator,
    IconButton,
    Modal,
    Portal,
    SegmentedButtons
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const WordManagementScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [words, setWords] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [editingWord, setEditingWord] = useState(null);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [filterLevel, setFilterLevel] = useState('all');
    const [generateLevel, setGenerateLevel] = useState('intermediate');
    const [generateCount, setGenerateCount] = useState('5');

    // Form state
    const [word, setWord] = useState('');
    const [phonetic, setPhonetic] = useState('');
    const [translation, setTranslation] = useState('');
    const [level, setLevel] = useState('intermediate');

    const levels = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];

    useEffect(() => {
        loadWords();
    }, []);

    const loadWords = async () => {
        setLoading(true);
        try {
            const response = await api.getPracticeWords();
            setWords(response.data?.sentences || []);
        } catch (error) {
            console.log('Load error:', error);
            // Demo data
            setWords([
                { _id: '1', sentence: 'Hello', phonetic: '/həˈloʊ/', translation: 'Merhaba', level: 'beginner' },
                { _id: '2', sentence: 'Beautiful', phonetic: '/ˈbjuːtɪfəl/', translation: 'Güzel', level: 'elementary' },
                { _id: '3', sentence: 'Perseverance', phonetic: '/ˌpɜːrsəˈvɪərəns/', translation: 'Azim', level: 'intermediate' },
            ]);
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setEditingWord(null);
        setWord('');
        setPhonetic('');
        setTranslation('');
        setLevel('intermediate');
        setModalVisible(true);
    };

    const openEditModal = (item) => {
        setEditingWord(item);
        setWord(item.sentence);
        setPhonetic(item.phonetic || '');
        setTranslation(item.translation || '');
        setLevel(item.level || 'intermediate');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!word.trim()) {
            Alert.alert('Error', 'Word is required');
            return;
        }

        setSaving(true);
        try {
            const data = {
                sentence: word,
                phonetic,
                translation,
                level,
                topic: 'pronunciation'
            };

            if (editingWord) {
                await api.updatePracticeWord(editingWord._id, data);
                Alert.alert('Success', 'Word updated');
            } else {
                await api.addPracticeWord(data);
                Alert.alert('Success', 'Word added');
            }

            setModalVisible(false);
            loadWords();
        } catch (error) {
            Alert.alert('Error', 'Failed to save word');
        }
        setSaving(false);
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Delete Word',
            `Delete "${item.sentence}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deletePracticeWord(item._id);
                            loadWords();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete word');
                        }
                    }
                }
            ]
        );
    };

    const getLevelColor = (lvl) => {
        const colors = {
            'beginner': '#27ae60',
            'elementary': '#3498db',
            'intermediate': '#f39c12',
            'upper-intermediate': '#e74c3c',
            'advanced': '#9b59b6',
        };
        return colors[lvl] || '#6c5ce7';
    };

    const handleGenerateAI = async () => {
        setGenerating(true);
        try {
            const count = parseInt(generateCount) || 5;
            const response = await api.generateAIWords({
                level: generateLevel,
                count: Math.min(count, 10) // Max 10 per request
            });

            Alert.alert(
                'Success! 🎉',
                `Generated ${response.data?.length || count} words with AI`,
                [{ text: 'OK', onPress: () => loadWords() }]
            );
            setAiModalVisible(false);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate words');
        }
        setGenerating(false);
    };

    const filteredWords = filterLevel === 'all'
        ? words
        : words.filter(w => w.level === filterLevel);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#00b894', '#55efc4']}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="headlineSmall" style={styles.headerTitle}>
                        📚 Word Management
                    </Text>
                </View>
                <Text style={styles.headerSubtitle}>
                    {words.length} words • Add, edit, or delete practice words
                </Text>
            </LinearGradient>

            {/* Filter */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Chip
                        selected={filterLevel === 'all'}
                        onPress={() => setFilterLevel('all')}
                        style={[styles.filterChip, filterLevel === 'all' && styles.filterChipActive]}
                    >
                        All
                    </Chip>
                    {levels.map((lvl) => (
                        <Chip
                            key={lvl}
                            selected={filterLevel === lvl}
                            onPress={() => setFilterLevel(lvl)}
                            style={[
                                styles.filterChip,
                                filterLevel === lvl && { backgroundColor: getLevelColor(lvl) }
                            ]}
                        >
                            {lvl}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {/* Words List */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#00b894" style={{ marginTop: 40 }} />
                ) : (
                    filteredWords.map((item) => (
                        <Surface key={item._id} style={styles.wordCard} elevation={2}>
                            <View style={styles.wordHeader}>
                                <Chip
                                    mode="outlined"
                                    style={{ borderColor: getLevelColor(item.level) }}
                                    textStyle={{ color: getLevelColor(item.level), fontSize: 10 }}
                                >
                                    {item.level}
                                </Chip>
                                <View style={styles.wordActions}>
                                    <IconButton
                                        icon="pencil"
                                        iconColor="#f39c12"
                                        size={20}
                                        onPress={() => openEditModal(item)}
                                    />
                                    <IconButton
                                        icon="delete"
                                        iconColor="#e74c3c"
                                        size={20}
                                        onPress={() => handleDelete(item)}
                                    />
                                </View>
                            </View>
                            <Text variant="titleLarge" style={styles.wordText}>{item.sentence}</Text>
                            {item.phonetic && (
                                <Text style={styles.phoneticText}>{item.phonetic}</Text>
                            )}
                            {item.translation && (
                                <Text style={styles.translationText}>{item.translation}</Text>
                            )}
                        </Surface>
                    ))
                )}
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <Button
                    mode="contained"
                    icon="robot"
                    onPress={() => setAiModalVisible(true)}
                    style={[styles.bottomButton, { backgroundColor: '#9b59b6' }]}
                    contentStyle={styles.bottomButtonContent}
                >
                    AI Generate
                </Button>
                <Button
                    mode="contained"
                    icon="plus"
                    onPress={openAddModal}
                    style={[styles.bottomButton, { backgroundColor: '#00b894' }]}
                    contentStyle={styles.bottomButtonContent}
                >
                    Add Word
                </Button>
            </View>

            {/* AI Generate Modal */}
            <Portal>
                <Modal
                    visible={aiModalVisible}
                    onDismiss={() => setAiModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>
                        🤖 Generate Words with AI
                    </Text>

                    <Text style={styles.aiDescription}>
                        Use Qwen AI to automatically generate practice words for any level.
                    </Text>

                    <Text style={styles.levelLabel}>Select Level</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {levels.map((lvl) => (
                            <Chip
                                key={lvl}
                                selected={generateLevel === lvl}
                                onPress={() => setGenerateLevel(lvl)}
                                style={[
                                    styles.levelChip,
                                    generateLevel === lvl && { backgroundColor: getLevelColor(lvl) }
                                ]}
                            >
                                {lvl}
                            </Chip>
                        ))}
                    </ScrollView>

                    <TextInput
                        label="Number of words (1-10)"
                        value={generateCount}
                        onChangeText={setGenerateCount}
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setAiModalVisible(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            icon="creation"
                            onPress={handleGenerateAI}
                            loading={generating}
                            disabled={generating}
                            style={[styles.modalButton, { backgroundColor: '#9b59b6' }]}
                        >
                            {generating ? 'Generating...' : 'Generate'}
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Add/Edit Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>
                        {editingWord ? 'Edit Word' : 'Add Word'}
                    </Text>

                    <TextInput
                        label="Word *"
                        value={word}
                        onChangeText={setWord}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Phonetic (e.g., /həˈloʊ/)"
                        value={phonetic}
                        onChangeText={setPhonetic}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Translation (Turkish)"
                        value={translation}
                        onChangeText={setTranslation}
                        mode="outlined"
                        style={styles.input}
                    />

                    <Text style={styles.levelLabel}>Level</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {levels.map((lvl) => (
                            <Chip
                                key={lvl}
                                selected={level === lvl}
                                onPress={() => setLevel(lvl)}
                                style={[
                                    styles.levelChip,
                                    level === lvl && { backgroundColor: getLevelColor(lvl) }
                                ]}
                            >
                                {lvl}
                            </Chip>
                        ))}
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setModalVisible(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={saving}
                            style={[styles.modalButton, styles.saveButton]}
                        >
                            Save
                        </Button>
                    </View>
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
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 16,
        marginTop: 4,
    },
    filterSection: {
        backgroundColor: '#16213e',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    filterChip: {
        marginRight: 8,
        backgroundColor: '#0f3460',
    },
    filterChipActive: {
        backgroundColor: '#00b894',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    wordCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    wordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    wordActions: {
        flexDirection: 'row',
    },
    wordText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    phoneticText: {
        color: '#00b894',
        marginTop: 4,
    },
    translationText: {
        color: '#a29bfe',
        marginTop: 4,
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
    },
    bottomButton: {
        flex: 1,
        borderRadius: 12,
    },
    bottomButtonContent: {
        paddingVertical: 8,
    },
    modal: {
        backgroundColor: '#16213e',
        margin: 20,
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    aiDescription: {
        color: '#a29bfe',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#0f3460',
        marginTop: 16,
    },
    levelLabel: {
        color: '#a29bfe',
        marginBottom: 8,
    },
    levelChip: {
        marginRight: 8,
        backgroundColor: '#0f3460',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    saveButton: {
        backgroundColor: '#00b894',
    },
});

export default WordManagementScreen;
