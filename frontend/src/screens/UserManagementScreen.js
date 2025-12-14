import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Dimensions } from 'react-native';
import {
    Text,
    Surface,
    Button,
    TextInput,
    IconButton,
    Chip,
    Portal,
    Modal,
    FAB,
    ActivityIndicator,
    Searchbar,
    Menu,
    Divider
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const { width } = Dimensions.get('window');

const UserManagementScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState('user');
    const [formLevel, setFormLevel] = useState('');
    const [roleMenuVisible, setRoleMenuVisible] = useState(false);
    const [levelMenuVisible, setLevelMenuVisible] = useState(false);

    const levels = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (search = '') => {
        try {
            const response = await api.getAdminUsers({ search });
            setUsers(response.data?.users || []);
        } catch (error) {
            console.log('Failed to fetch users:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsers(searchQuery);
    }, [searchQuery]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        fetchUsers(query);
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedUser(null);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole('user');
        setFormLevel('');
        setModalVisible(true);
    };

    const openEditModal = (user) => {
        setIsEditing(true);
        setSelectedUser(user);
        setFormName(user.name);
        setFormEmail(user.email);
        setFormPassword('');
        setFormRole(user.role);
        setFormLevel(user.level || '');
        setModalVisible(true);
    };

    const handleSaveUser = async () => {
        if (!formName || !formEmail) {
            Alert.alert('Error', 'Name and email are required');
            return;
        }

        if (!isEditing && !formPassword) {
            Alert.alert('Error', 'Password is required for new users');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await api.updateAdminUser(selectedUser._id, {
                    name: formName,
                    email: formEmail,
                    role: formRole,
                    level: formLevel || null
                });
            } else {
                await api.createAdminUser({
                    name: formName,
                    email: formEmail,
                    password: formPassword,
                    role: formRole,
                    level: formLevel || null
                });
            }
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Operation failed');
        }
        setLoading(false);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            await api.deleteAdminUser(selectedUser._id);
            setDeleteModalVisible(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Delete failed');
        }
        setLoading(false);
    };

    const confirmDelete = (user) => {
        setSelectedUser(user);
        setDeleteModalVisible(true);
    };

    const renderUserCard = ({ item }) => (
        <Surface style={styles.userCard} elevation={2}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text variant="titleMedium" style={styles.userName}>{item.name}</Text>
                    <Text variant="bodySmall" style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.badges}>
                        <Chip
                            mode="outlined"
                            style={[styles.badge, item.role === 'admin' && styles.adminBadge]}
                            textStyle={styles.badgeText}
                        >
                            {item.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </Chip>
                        {item.level && (
                            <Chip mode="outlined" style={styles.levelBadge} textStyle={styles.badgeText}>
                                {item.level}
                            </Chip>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <IconButton
                    icon="pencil"
                    iconColor="#6c5ce7"
                    size={20}
                    onPress={() => openEditModal(item)}
                />
                <IconButton
                    icon="delete"
                    iconColor="#e74c3c"
                    size={20}
                    onPress={() => confirmDelete(item)}
                />
            </View>
        </Surface>
    );

    if (loading && users.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#6c5ce7', '#a29bfe']}
                style={styles.header}
            >
                <Text variant="headlineSmall" style={styles.headerTitle}>
                    👥 User Management
                </Text>
                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                    {users.length} users total
                </Text>
            </LinearGradient>

            {/* Search */}
            <Searchbar
                placeholder="Search users..."
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor="#6c5ce7"
            />

            {/* User List */}
            <FlatList
                data={users}
                renderItem={renderUserCard}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No users found</Text>
                    </View>
                }
            />

            {/* FAB */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={openCreateModal}
                color="#fff"
            />

            {/* Create/Edit Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>
                        {isEditing ? 'Edit User' : 'Create User'}
                    </Text>

                    <TextInput
                        label="Name"
                        value={formName}
                        onChangeText={setFormName}
                        mode="outlined"
                        style={styles.modalInput}
                    />

                    <TextInput
                        label="Email"
                        value={formEmail}
                        onChangeText={setFormEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.modalInput}
                    />

                    {!isEditing && (
                        <TextInput
                            label="Password"
                            value={formPassword}
                            onChangeText={setFormPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.modalInput}
                        />
                    )}

                    <Menu
                        visible={roleMenuVisible}
                        onDismiss={() => setRoleMenuVisible(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setRoleMenuVisible(true)}
                                style={styles.dropdownButton}
                            >
                                Role: {formRole}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => { setFormRole('user'); setRoleMenuVisible(false); }} title="User" />
                        <Menu.Item onPress={() => { setFormRole('admin'); setRoleMenuVisible(false); }} title="Admin" />
                    </Menu>

                    <Menu
                        visible={levelMenuVisible}
                        onDismiss={() => setLevelMenuVisible(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setLevelMenuVisible(true)}
                                style={styles.dropdownButton}
                            >
                                Level: {formLevel || 'Not set'}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => { setFormLevel(''); setLevelMenuVisible(false); }} title="Not set" />
                        {levels.map(level => (
                            <Menu.Item
                                key={level}
                                onPress={() => { setFormLevel(level); setLevelMenuVisible(false); }}
                                title={level}
                            />
                        ))}
                    </Menu>

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
                            onPress={handleSaveUser}
                            loading={loading}
                            style={styles.modalButton}
                        >
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Delete Confirmation Modal */}
            <Portal>
                <Modal
                    visible={deleteModalVisible}
                    onDismiss={() => setDeleteModalVisible(false)}
                    contentContainerStyle={styles.deleteModalContainer}
                >
                    <Text variant="titleLarge" style={styles.deleteTitle}>⚠️ Delete User</Text>
                    <Text style={styles.deleteText}>
                        Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
                    </Text>
                    <View style={styles.modalButtons}>
                        <Button
                            mode="outlined"
                            onPress={() => setDeleteModalVisible(false)}
                            style={styles.modalButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleDeleteUser}
                            loading={loading}
                            buttonColor="#e74c3c"
                            style={styles.modalButton}
                        >
                            Delete
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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
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
    searchBar: {
        margin: 20,
        backgroundColor: '#16213e',
        borderRadius: 12,
    },
    searchInput: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    userCard: {
        backgroundColor: '#16213e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6c5ce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontWeight: '600',
    },
    userEmail: {
        color: '#a29bfe',
        marginTop: 2,
    },
    badges: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    badge: {
        backgroundColor: 'rgba(108, 92, 231, 0.2)',
        borderColor: '#6c5ce7',
    },
    adminBadge: {
        backgroundColor: 'rgba(253, 203, 110, 0.2)',
        borderColor: '#fdcb6e',
    },
    levelBadge: {
        backgroundColor: 'rgba(0, 206, 201, 0.2)',
        borderColor: '#00cec9',
    },
    badgeText: {
        fontSize: 10,
        color: '#fff',
    },
    actions: {
        flexDirection: 'row',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#a29bfe',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#6c5ce7',
        borderRadius: 30,
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
    dropdownButton: {
        marginBottom: 16,
        borderRadius: 8,
        borderColor: '#6c5ce7',
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
    deleteModalContainer: {
        backgroundColor: '#16213e',
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    deleteTitle: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    deleteText: {
        color: '#a29bfe',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
});

export default UserManagementScreen;
