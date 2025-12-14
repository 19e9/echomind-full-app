import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/authStore';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error, clearError } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) return;
        await login(email, password);
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
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#6c5ce7', '#a29bfe']}
                            style={styles.logoCircle}
                        >
                            <Text style={styles.logoEmoji}>🎯</Text>
                        </LinearGradient>
                        <Text variant="displaySmall" style={styles.appName}>EchoMind</Text>
                        <Text style={styles.tagline}>Learn English, Your Way</Text>
                    </View>

                    {/* Login Card */}
                    <Surface style={styles.card} elevation={4}>
                        <Text variant="headlineMedium" style={styles.cardTitle}>Welcome Back</Text>
                        <Text style={styles.cardSubtitle}>Sign in to continue learning</Text>

                        {error && (
                            <Surface style={styles.errorBox} elevation={0}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </Surface>
                        )}

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

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading || !email || !password}
                            style={styles.loginButton}
                            contentStyle={styles.buttonContent}
                        >
                            Sign In
                        </Button>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Button
                            mode="outlined"
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerButton}
                        >
                            Create Account
                        </Button>
                    </Surface>

                    {/* Demo Credentials */}
                    <Surface style={styles.demoBox} elevation={1}>
                        <Text style={styles.demoTitle}>🔑 Demo Credentials</Text>
                        <Text style={styles.demoText}>Email: user@echomind.com</Text>
                        <Text style={styles.demoText}>Password: user123</Text>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 48,
    },
    appName: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tagline: {
        color: '#a29bfe',
        marginTop: 8,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#16213e',
        borderRadius: 24,
        padding: 28,
    },
    cardTitle: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cardSubtitle: {
        color: '#a29bfe',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
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
    loginButton: {
        marginTop: 8,
        borderRadius: 14,
        backgroundColor: '#6c5ce7',
    },
    buttonContent: {
        paddingVertical: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#0f3460',
    },
    dividerText: {
        color: '#a29bfe',
        paddingHorizontal: 16,
    },
    registerButton: {
        borderRadius: 14,
        borderColor: '#6c5ce7',
        borderWidth: 2,
    },
    demoBox: {
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(108, 92, 231, 0.3)',
    },
    demoTitle: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    demoText: {
        color: '#a29bfe',
        textAlign: 'center',
        fontSize: 13,
    },
});

export default LoginScreen;
