import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import {
    Text,
    Surface,
    Button,
    TextInput,
    Switch,
    Divider,
    Avatar,
    IconButton,
    Portal,
    Modal,
    ActivityIndicator
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { user, updateUser, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Preferences
    const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
    const [dailyGoal, setDailyGoal] = useState(user?.preferences?.dailyGoal?.toString() || '10');

    const stats = [
        { label: 'Points', value: user?.points || 0, icon: '⭐' },
        { label: 'Streak', value: `${user?.dailyStreak || 0} days`, icon: '🔥' },
        { label: 'Level', value: user?.level?.replace('-', ' ') || 'Not set', icon: '📊' },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const response = await api.getProfile();
            if (response.data?.user) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.log('Refresh failed');
        }
        setRefreshing(false);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) return;

        setLoading(true);
        try {
            const response = await api.updateProfile({
                name: editName,
                email: editEmail
            });
            if (response.data?.user) {
                await updateUser(response.data.user);
            }
            setEditModalVisible(false);
        } catch (error) {
            console.log('Update failed:', error.message);
        }
        setLoading(false);
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.updateProfile({
                currentPassword,
                newPassword
            });
            setPasswordModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert('Password changed successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to change password');
        }
        setLoading(false);
    };

    const handleUpdatePreferences = async (key, value) => {
        try {
            await api.updateProfile({
                preferences: { [key]: value }
            });
            await updateUser({
                preferences: { ...user?.preferences, [key]: value }
            });
        } catch (error) {
            console.log('Preference update failed');
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />
                }
            >
                {/* Profile Header */}
                <LinearGradient
                    colors={['#6c5ce7', '#a29bfe', '#74b9ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.profileHeader}>
                        <Avatar.Text
                            size={80}
                            label={user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            style={styles.avatar}
                        />
                        <Text variant="headlineSmall" style={styles.userName}>
                            {user?.name || 'User'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.userEmail}>
                            {user?.email || 'email@example.com'}
                        </Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <Surface key={index} style={styles.statCard} elevation={2}>
                            <Text style={styles.statIcon}>{stat.icon}</Text>
                            <Text variant="titleLarge" style={styles.statValue}>{stat.value}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
                        </Surface>
                    ))}
                </View>

                {/* Account Settings */}
                <Surface style={styles.sectionCard} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Account</Text>

                    <Surface style={styles.menuItem} elevation={0}>
                        <View style={styles.menuItemContent}>
                            <IconButton icon="account-edit" iconColor="#6c5ce7" size={24} />
                            <Text style={styles.menuItemText}>Edit Profile</Text>
                        </View>
                        <IconButton
                            icon="chevron-right"
                            iconColor="#a29bfe"
                            onPress={() => {
                                setEditName(user?.name || '');
                                setEditEmail(user?.email || '');
                                setEditModalVisible(true);
                            }}
                        />
                    </Surface>

                    <Surface style={styles.menuItem} elevation={0}>
                        <View style={styles.menuItemContent}>
                            <IconButton icon="lock-reset" iconColor="#6c5ce7" size={24} />
                            <Text style={styles.menuItemText}>Change Password</Text>
                        </View>
                        <IconButton
                            icon="chevron-right"
                            iconColor="#a29bfe"
                            onPress={() => setPasswordModalVisible(true)}
                        />
                    </Surface>
                </Surface>

                {/* Preferences */}
                <Surface style={styles.sectionCard} elevation={2}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <IconButton icon="bell" iconColor="#6c5ce7" size={24} />
                            <Text style={styles.preferenceText}>Push Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={(value) => {
                                setNotifications(value);
                                handleUpdatePreferences('notifications', value);
                            }}
                            color="#6c5ce7"
                        />
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <IconButton icon="target" iconColor="#6c5ce7" size={24} />
                            <Text style={styles.preferenceText}>Daily Goal (minutes)</Text>
                        </View>
                        <TextInput
                            value={dailyGoal}
                            onChangeText={(value) => setDailyGoal(value)}
                            onBlur={() => handleUpdatePreferences('dailyGoal', parseInt(dailyGoal) || 10)}
                            keyboardType="number-pad"
                            style={styles.goalInput}
                            mode="outlined"
                        />
                    </View>
                </Surface>

                {/* Admin Section */}
                {user?.role === 'admin' && (
                    <Surface style={styles.sectionCard} elevation={2}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>👑 Admin</Text>

                        <Button
                            mode="contained"
                            icon="account-group"
                            onPress={() => navigation.navigate('UserManagement')}
                            style={styles.adminButton}
                        >
                            User Management
                        </Button>

                        <Button
                            mode="contained"
                            icon="bell-ring"
                            onPress={() => navigation.navigate('SendNotification')}
                            style={[styles.adminButton, { backgroundColor: '#00cec9' }]}
                        >
                            Send Notification
                        </Button>

                        <Button
                            mode="contained"
                            icon="book-alphabet"
                            onPress={() => navigation.navigate('WordManagement')}
                            style={[styles.adminButton, { backgroundColor: '#00b894' }]}
                        >
                            Word Management
                        </Button>

                        <Button
                            mode="contained"
                            icon="movie-open"
                            onPress={() => navigation.navigate('ReelManagement')}
                            style={[styles.adminButton, { backgroundColor: '#fd79a8' }]}
                        >
                            Reel Management
                        </Button>
                    </Surface>
                )}

                {/* Logout */}
                <Button
                    mode="outlined"
                    icon="logout"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    textColor="#e74c3c"
                >
                    Logout
                </Button>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Portal>
                <Modal
                    visible={editModalVisible}
                    onDismiss={() => setEditModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Edit Profile</Text>

                    <TextInput
                        label="Name"
                        value={editName}
                        onChangeText={setEditName}
                        mode="outlined"
                        style={styles.modalInput}
                    />

                    <TextInput
                        label="Email"
                        value={editEmail}
                        onChangeText={setEditEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.modalInput}
                    />

                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setEditModalVisible(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSaveProfile}
                            loading={loading}
                            style={styles.modalButton}
                        >
                            Save
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Change Password Modal */}
            <Portal>
                <Modal
                    visible={passwordModalVisible}
                    onDismiss={() => setPasswordModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Change Password</Text>

                    <TextInput
                        label="Current Password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.modalInput}
                    />

                    <TextInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.modalInput}
                    />

                    <TextInput
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="outlined"
                        secureTextEntry
                        style={styles.modalInput}
                    />

                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setPasswordModalVisible(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleChangePassword}
                            loading={loading}
                            style={styles.modalButton}
                        >
                            Change
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
    scrollContent: {
        paddingBottom: 40,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileHeader: {
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    userEmail: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    roleText: {
        color: '#fff',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: -30,
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: (width - 60) / 3,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#a29bfe',
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0f3460',
        borderRadius: 12,
        marginBottom: 12,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        color: '#fff',
        fontSize: 16,
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    preferenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    preferenceText: {
        color: '#fff',
        fontSize: 16,
    },
    goalInput: {
        width: 70,
        height: 40,
        backgroundColor: '#0f3460',
    },
    adminButton: {
        marginBottom: 12,
        borderRadius: 12,
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 10,
        borderColor: '#e74c3c',
        borderRadius: 12,
    },
    modalContainer: {
        backgroundColor: '#16213e',
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    modalTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        marginBottom: 16,
        backgroundColor: '#0f3460',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 0.48,
        borderRadius: 12,
    },
});

export default ProfileScreen;
