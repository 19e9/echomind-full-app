import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';

// Custom dark theme
const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#6c5ce7',
        secondary: '#a29bfe',
        tertiary: '#fd79a8',
        background: '#1a1a2e',
        surface: '#16213e',
        surfaceVariant: '#0f3460',
        error: '#e74c3c',
        onPrimary: '#ffffff',
        onBackground: '#ffffff',
        onSurface: '#ffffff',
    },
};

export default function App() {
    useEffect(() => {
        // Request notification permissions on app start
        const setupNotifications = async () => {
            const granted = await notificationService.requestPermissions();
            if (granted) {
                console.log('✅ Notifications enabled');
            }
        };
        setupNotifications();

        // Handle notification received while app is open
        const notificationListener = notificationService.addNotificationReceivedListener(
            notification => {
                console.log('📩 Notification received:', notification.request.content.title);
            }
        );

        // Handle notification tap
        const responseListener = notificationService.addNotificationResponseReceivedListener(
            response => {
                const data = response.notification.request.content.data;
                console.log('👆 Notification tapped:', data);
            }
        );

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    return (
        <PaperProvider theme={theme}>
            <NavigationContainer>
                <StatusBar style="light" />
                <AppNavigator />
            </NavigationContainer>
        </PaperProvider>
    );
}
