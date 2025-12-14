import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import useAuthStore from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import PlacementTestScreen from '../screens/PlacementTestScreen';
import QuizScreen from '../screens/QuizScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LearnScreen from '../screens/LearnScreen';
import AvatarChatScreen from '../screens/AvatarChatScreen';

// Admin Screens
import UserManagementScreen from '../screens/UserManagementScreen';
import SendNotificationScreen from '../screens/SendNotificationScreen';
import EchoPracticeScreen from '../screens/EchoPracticeScreen';
import WordManagementScreen from '../screens/WordManagementScreen';
import ReelsScreen from '../screens/ReelsScreen';
import ReelManagementScreen from '../screens/ReelManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (not logged in)
const AuthStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1a1a2e' },
        }}
    >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// Bottom Tab Navigator
const TabNavigator = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle: {
                backgroundColor: '#16213e',
                borderTopColor: '#0f3460',
                paddingBottom: 8,
                paddingTop: 8,
                height: 65,
            },
            tabBarActiveTintColor: '#6c5ce7',
            tabBarInactiveTintColor: '#a29bfe',
            tabBarLabelStyle: {
                fontSize: 11,
                marginTop: -4,
            },
            headerStyle: { backgroundColor: '#16213e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
        }}
    >
        <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <IconButton icon="home" iconColor={color} size={size} style={{ margin: 0 }} />
                ),
            }}
        />
        <Tab.Screen
            name="Learn"
            component={LearnScreen}
            options={{
                title: 'Learn',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <IconButton icon="school" iconColor={color} size={size} style={{ margin: 0 }} />
                ),
            }}
        />
        <Tab.Screen
            name="Avatar"
            component={AvatarChatScreen}
            options={{
                title: 'Avatar',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <IconButton icon="account-voice" iconColor={color} size={size} style={{ margin: 0 }} />
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                title: 'Profile',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <IconButton icon="account" iconColor={color} size={size} style={{ margin: 0 }} />
                ),
            }}
        />
    </Tab.Navigator>
);

// Main Stack (logged in)
const MainStack = () => {
    const user = useAuthStore((state) => state.user);

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#16213e' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                contentStyle: { backgroundColor: '#1a1a2e' },
            }}
        >
            {!user?.levelTestCompleted ? (
                <Stack.Screen
                    name="PlacementTest"
                    component={PlacementTestScreen}
                    options={{ headerShown: false }}
                />
            ) : (
                <>
                    <Stack.Screen
                        name="MainTabs"
                        component={TabNavigator}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Quiz"
                        component={QuizScreen}
                        options={{ title: 'Quiz' }}
                    />
                    <Stack.Screen
                        name="UserManagement"
                        component={UserManagementScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="SendNotification"
                        component={SendNotificationScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="EchoPractice"
                        component={EchoPracticeScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="WordManagement"
                        component={WordManagementScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Reels"
                        component={ReelsScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ReelManagement"
                        component={ReelManagementScreen}
                        options={{ headerShown: false }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

// Loading Screen
const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#6c5ce7" />
    </View>
);

// Main Navigator
const AppNavigator = () => {
    const { isAuthenticated, isLoading, initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return isAuthenticated ? <MainStack /> : <AuthStack />;
};

export default AppNavigator;
