import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    StatusBar,
    Dimensions,
    Animated
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const AvatarChatScreen = ({ navigation }) => {
    const [conversationUrl, setConversationUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [callStatus, setCallStatus] = useState('incoming');
    const webViewRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation
    useEffect(() => {
        if (callStatus === 'incoming') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [callStatus]);

    // Accept call
    const handleAcceptCall = async () => {
        setLoading(true);
        setCallStatus('connecting');

        try {
            const cameraPermission = await Camera.requestCameraPermissionsAsync();
            const audioPermission = await Audio.requestPermissionsAsync();

            if (cameraPermission.status !== 'granted' || audioPermission.status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Video görüşme için kamera ve mikrofon izni gereklidir.');
                setLoading(false);
                setCallStatus('incoming');
                return;
            }

            const response = await api.createTavusConversation({
                context: 'You are a friendly English conversation partner named Olivia. Help the user practice English in a natural, encouraging way. Be patient and provide gentle corrections when needed.',
                greeting: 'Hey! Great to see you! How are you doing today?'
            });

            const url = response?.data?.conversation_url
                || response?.data?.data?.conversation_url
                || response?.conversation_url;

            if (url && typeof url === 'string' && url.startsWith('http')) {
                setConversationUrl(url);
                setCallStatus('connected');
            } else {
                throw new Error('Bağlantı kurulamadı');
            }
        } catch (error) {
            console.error('Call error:', error);
            Alert.alert('Hata', error.response?.data?.message || 'Görüşme başlatılamadı.');
            setCallStatus('incoming');
        }
        setLoading(false);
    };

    // End call
    const handleEndCall = () => {
        setConversationUrl(null);
        setCallStatus('incoming');
        navigation.goBack();
    };

    // In-call view - sadece WebView tam ekran
    if (conversationUrl) {
        return (
            <View style={styles.callContainer}>
                <StatusBar barStyle="light-content" hidden />

                <WebView
                    ref={webViewRef}
                    source={{ uri: conversationUrl }}
                    style={styles.fullScreenVideo}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    onPermissionRequest={(request) => request.grant(request.resources)}
                    mediaCapturePermissionGrantType="grant"
                />

                {/* Sadece kapat butonu */}
                <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                    <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    }

    // Incoming call view
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f1a']} style={styles.background} />

            <View style={styles.topSection}>
                <Text style={styles.callType}>EchoMind Video</Text>
                <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient colors={['#6c5ce7', '#a29bfe']} style={styles.avatarGradient}>
                        <Text style={styles.avatarEmoji}>👩‍🏫</Text>
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.callerName}>Olivia</Text>
                <Text style={styles.callerSubtitle}>AI English Tutor</Text>
            </View>

            <View style={styles.bottomSection}>
                {loading ? (
                    <View style={styles.connectingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.connectingLabel}>Bağlanıyor...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
                            <View style={[styles.buttonCircle, styles.declineButton]}>
                                <MaterialCommunityIcons name="close" size={36} color="#fff" />
                            </View>
                            <Text style={styles.buttonLabel}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleAcceptCall}>
                            <View style={[styles.buttonCircle, styles.acceptButton]}>
                                <MaterialCommunityIcons name="video" size={36} color="#fff" />
                            </View>
                            <Text style={styles.buttonLabel}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { ...StyleSheet.absoluteFillObject },
    topSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    callType: { color: 'rgba(255,255,255,0.6)', fontSize: 18, marginBottom: 30 },
    avatarContainer: { marginBottom: 20 },
    avatarGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 60 },
    callerName: { color: '#fff', fontSize: 36, fontWeight: '600', marginBottom: 8 },
    callerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
    bottomSection: { paddingBottom: 80, paddingHorizontal: 40 },
    connectingContainer: { alignItems: 'center', paddingVertical: 40 },
    connectingLabel: { color: '#fff', fontSize: 18, marginTop: 16 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    actionButton: { alignItems: 'center' },
    buttonCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    declineButton: { backgroundColor: '#e74c3c' },
    acceptButton: { backgroundColor: '#27ae60' },
    buttonLabel: { color: '#fff', fontSize: 16 },

    // In-call styles - basit
    callContainer: { flex: 1, backgroundColor: '#000' },
    fullScreenVideo: { flex: 1 },
    endCallButton: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default AvatarChatScreen;
