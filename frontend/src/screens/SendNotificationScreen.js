import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
    Text,
    Surface,
    Button,
    TextInput,
    Chip,
    RadioButton,
    ActivityIndicator
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const SendNotificationScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('info');
    const [targetType, setTargetType] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);

    const notificationTypes = [
        { value: 'info', label: '💡 Info', color: '#3498db' },
        { value: 'success', label: '✅ Success', color: '#27ae60' },
        { value: 'warning', label: '⚠️ Warning', color: '#f39c12' },
        { value: 'reminder', label: '🔔 Reminder', color: '#9b59b6' },
        { value: 'achievement', label: '🏆 Achievement', color: '#e74c3c' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.getAdminUsers({ limit: 100 });
            setUsers(response.data?.users || []);
        } catch (error) {
            console.log('Failed to fetch users');
        }
        setLoadingUsers(false);
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert('Error', 'Title and body are required');
            return;
        }

        if (targetType === 'selected' && selectedUsers.length === 0) {
            Alert.alert('Error', 'Please select at least one user');
            return;
        }

        setLoading(true);
        try {
            // Save to backend
            await api.sendNotification({
                title,
                body,
                type,
                isGlobal: targetType === 'all',
                targetUserIds: targetType === 'selected' ? selectedUsers : []
            });

            // Also trigger local notification for demo
            const notificationService = require('../services/notificationService').default;
            await notificationService.sendLocalNotification(title, body, { type });

            Alert.alert(
                'Success',
                `Notification sent to ${targetType === 'all' ? 'all users' : selectedUsers.length + ' user(s)'}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send notification');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient
                    colors={['#00cec9', '#81ecec']}
                    style={styles.header}
                >
                    <Text variant="headlineSmall" style={styles.headerTitle}>
                        🔔 Send Notification
                    </Text>
                    <Text variant="bodyMedium" style={styles.headerSubtitle}>
                        Notify your users about important updates
                    </Text>
                </LinearGradient>

                {/* Notification Content */}
                <Surface style={styles.section} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Content</Text>

                    <TextInput
                        label="Title"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        maxLength={100}
                    />

                    <TextInput
                        label="Message"
                        value={body}
                        onChangeText={setBody}
                        mode="outlined"
                        style={styles.input}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />
                </Surface>

                {/* Notification Type */}
                <Surface style={styles.section} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Type</Text>

                    <View style={styles.typeContainer}>
                        {notificationTypes.map(item => (
                            <Chip
                                key={item.value}
                                selected={type === item.value}
                                onPress={() => setType(item.value)}
                                style={[
                                    styles.typeChip,
                                    type === item.value && { backgroundColor: item.color }
                                ]}
                                textStyle={styles.typeChipText}
                            >
                                {item.label}
                            </Chip>
                        ))}
                    </View>
                </Surface>

                {/* Target Users */}
                <Surface style={styles.section} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Recipients</Text>

                    <RadioButton.Group onValueChange={setTargetType} value={targetType}>
                        <RadioButton.Item
                            label="All Users"
                            value="all"
                            labelStyle={styles.radioLabel}
                            color="#6c5ce7"
                        />
                        <RadioButton.Item
                            label="Selected Users"
                            value="selected"
                            labelStyle={styles.radioLabel}
                            color="#6c5ce7"
                        />
                    </RadioButton.Group>

                    {targetType === 'selected' && (
                        <View style={styles.userList}>
                            {loadingUsers ? (
                                <ActivityIndicator color="#6c5ce7" />
                            ) : (
                                <View style={styles.userChips}>
                                    {users.map(user => (
                                        <Chip
                                            key={user._id}
                                            selected={selectedUsers.includes(user._id)}
                                            onPress={() => toggleUserSelection(user._id)}
                                            style={[
                                                styles.userChip,
                                                selectedUsers.includes(user._id) && styles.userChipSelected
                                            ]}
                                            textStyle={styles.userChipText}
                                        >
                                            {user.name}
                                        </Chip>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </Surface>

                {/* Send Button */}
                <Button
                    mode="contained"
                    icon="send"
                    onPress={handleSend}
                    loading={loading}
                    disabled={loading}
                    style={styles.sendButton}
                    contentStyle={styles.sendButtonContent}
                >
                    Send Notification
                </Button>
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
        paddingBottom: 40,
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
    section: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 20,
        margin: 20,
        marginBottom: 0,
    },
    sectionTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#0f3460',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeChip: {
        backgroundColor: '#0f3460',
        marginBottom: 8,
    },
    typeChipText: {
        color: '#fff',
    },
    radioLabel: {
        color: '#fff',
    },
    userList: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#0f3460',
        borderRadius: 12,
    },
    userChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    userChip: {
        backgroundColor: '#16213e',
    },
    userChipSelected: {
        backgroundColor: '#6c5ce7',
    },
    userChipText: {
        color: '#fff',
        fontSize: 12,
    },
    sendButton: {
        margin: 20,
        borderRadius: 12,
        backgroundColor: '#00cec9',
    },
    sendButtonContent: {
        paddingVertical: 8,
    },
});

export default SendNotificationScreen;
