import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    constructor() {
        this.permissionGranted = false;
    }

    // Request permission for notifications
    async requestPermissions() {
        if (!Device.isDevice) {
            console.log('Notifications work best on physical devices');
            // Still allow on simulator for testing
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        this.permissionGranted = finalStatus === 'granted';

        if (!this.permissionGranted) {
            console.log('Notification permission not granted');
        } else {
            console.log('Notification permission granted');
        }

        // Android specific channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'EchoMind',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6c5ce7',
            });
        }

        return this.permissionGranted;
    }

    // Send local notification immediately
    async sendLocalNotification(title, body, data = {}) {
        if (!this.permissionGranted) {
            await this.requestPermissions();
        }

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: true,
                },
                trigger: null, // Immediately
            });
            console.log('Notification sent:', id);
            return id;
        } catch (error) {
            console.log('Error sending notification:', error);
            return null;
        }
    }

    // Schedule notification for later
    async scheduleNotification(title, body, seconds, data = {}) {
        if (!this.permissionGranted) {
            await this.requestPermissions();
        }

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: true,
                },
                trigger: { seconds },
            });
            return id;
        } catch (error) {
            console.log('Error scheduling notification:', error);
            return null;
        }
    }

    // Add notification received listener
    addNotificationReceivedListener(callback) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    // Add notification response listener (when user taps notification)
    addNotificationResponseReceivedListener(callback) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    // Get and set badge count
    async getBadgeCount() {
        return await Notifications.getBadgeCountAsync();
    }

    async setBadgeCount(count) {
        await Notifications.setBadgeCountAsync(count);
    }

    // Cancel all scheduled notifications
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}

export default new NotificationService();
