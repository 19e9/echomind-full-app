import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading, error, clearError } = useAuthStore();

    const handleRegister = async () => {
        if (!name || !email || !password) return;
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        await register(name, email, password);
    };

    return (
        <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="displaySmall" style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your English learning journey</Text>
                    </View>

                    {/* Form Card */}
                    <Surface style={styles.card} elevation={4}>
                        {error && (
                            <Surface style={styles.errorBox} elevation={0}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </Surface>
                        )}

                        <TextInput
                            label="Full Name"
                            value={name}
                            onChangeText={(t) => { setName(t); clearError(); }}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account" />}
                            outlineColor="#0f3460"
                            activeOutlineColor="#6c5ce7"
                        />

                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={(t) => { setEmail(t); clearError(); }}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            left={<TextInput.Icon icon="email" />}
                            outlineColor="#0f3460"
                            activeOutlineColor="#6c5ce7"
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={(t) => { setPassword(t); clearError(); }}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            left={<TextInput.Icon icon="lock" />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            outlineColor="#0f3460"
                            activeOutlineColor="#6c5ce7"
                        />

                        <TextInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            left={<TextInput.Icon icon="lock-check" />}
                            outlineColor="#0f3460"
                            activeOutlineColor="#6c5ce7"
                        />

                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={isLoading}
                            disabled={isLoading || !name || !email || !password}
                            style={styles.registerButton}
                            contentStyle={styles.buttonContent}
                        >
                            Create Account
                        </Button>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Already have an account?</Text>
                            <Button
                                mode="text"
                                onPress={() => navigation.navigate('Login')}
                                textColor="#6c5ce7"
                            >
                                Sign In
                            </Button>
                        </View>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#a29bfe',
        marginTop: 8,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#16213e',
        borderRadius: 24,
        padding: 28,
    },
    errorBox: {
        backgroundColor: 'rgba(231, 76, 60, 0.15)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#0f3460',
    },
    registerButton: {
        marginTop: 8,
        borderRadius: 14,
        backgroundColor: '#6c5ce7',
    },
    buttonContent: {
        paddingVertical: 8,
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#a29bfe',
    },
});

export default RegisterScreen;
