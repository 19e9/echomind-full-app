import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ⚠️ IMPORTANT: Replace this IP with your computer's IP address
const LOCAL_IP = '172.20.10.3';

const getApiUrl = () => {
    if (Constants.expoConfig?.extra?.apiUrl) {
        return Constants.expoConfig.extra.apiUrl;
    }
    return `http://${LOCAL_IP}:5000/api`;
};

const API_URL = getApiUrl();
console.log('🔗 API URL:', API_URL);

const instance = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

let authToken = null;

const api = {
    setToken: (token) => {
        authToken = token;
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    clearToken: () => {
        authToken = null;
        delete instance.defaults.headers.common['Authorization'];
    },

    // Auth
    register: (data) => instance.post('/auth/register', data),
    login: (data) => instance.post('/auth/login', data),
    getMe: () => instance.get('/auth/me'),

    // User
    getProfile: () => instance.get('/users/profile'),
    updateProfile: (data) => instance.put('/users/profile', data),
    getStats: () => instance.get('/users/stats'),
    updateLevel: (data) => instance.put('/users/level', data),

    // Quiz
    getPlacementTest: () => instance.get('/quiz/placement-test'),
    getQuizzes: (params) => instance.get('/quiz', { params }),
    getQuiz: (id) => instance.get(`/quiz/${id}`),
    submitQuiz: (id, answers) => instance.post(`/quiz/${id}/submit`, { answers }),

    // Words
    getDailyWord: () => instance.get('/words/daily'),
    getWords: (params) => instance.get('/words', { params }),
    markWordLearned: (id) => instance.post(`/words/${id}/learned`),
    getLearnedWords: (params) => instance.get('/words/learned', { params }),

    // Pronunciation
    analyzePronunciation: (formData) => instance.post('/pronunciation/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getClonedPronunciation: (formData) => instance.post('/pronunciation/clone-correct', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getPhonetics: (word) => instance.get(`/pronunciation/phonetics/${word}`),
    getVoiceStatus: () => instance.get('/pronunciation/voice-status'),
    deleteVoiceClone: () => instance.delete('/pronunciation/voice-clone'),

    // Video
    createVideo: (data) => instance.post('/video/create', data),
    getVideoStatus: (videoId) => instance.get(`/video/status/${videoId}`),
    getVideoAvatars: () => instance.get('/video/avatars'),
    getVideoVoices: () => instance.get('/video/voices'),

    // Avatar
    startConversation: (data) => instance.post('/avatar/conversation', data),
    endConversation: (conversationId) => instance.post(`/avatar/conversation/${conversationId}/end`),
    getConversationStatus: (conversationId) => instance.get(`/avatar/conversation/${conversationId}`),
    getReplicas: () => instance.get('/avatar/replicas'),

    // Health
    healthCheck: () => instance.get('/health'),

    // Admin
    getAdminUsers: (params) => instance.get('/admin/users', { params }),
    getAdminUser: (id) => instance.get(`/admin/users/${id}`),
    createAdminUser: (data) => instance.post('/admin/users', data),
    updateAdminUser: (id, data) => instance.put(`/admin/users/${id}`, data),
    deleteAdminUser: (id) => instance.delete(`/admin/users/${id}`),
    resetAdminUserPassword: (id, data) => instance.put(`/admin/users/${id}/password`, data),

    // Notifications
    getNotifications: (params) => instance.get('/notifications', { params }),
    markNotificationRead: (id) => instance.put(`/notifications/${id}/read`),
    markAllNotificationsRead: () => instance.put('/notifications/read-all'),
    sendNotification: (data) => instance.post('/notifications/send', data),
    getAllNotifications: (params) => instance.get('/notifications/all', { params }),
    deleteNotification: (id) => instance.delete(`/notifications/${id}`),

    // Echo Practice
    getPracticeSentence: () => instance.get('/practice/sentence'),
    analyzeAndCorrect: (formData) => instance.post('/practice/analyze-and-correct', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getPracticeWords: (params) => instance.get('/practice/sentences', { params }),
    addPracticeWord: (data) => instance.post('/practice/word', data),
    updatePracticeWord: (id, data) => instance.put(`/practice/word/${id}`, data),
    deletePracticeWord: (id) => instance.delete(`/practice/word/${id}`),
    generateAIWords: (data) => instance.post('/practice/generate', data),

    // Tavus Avatar
    createTavusConversation: (data) => instance.post('/tavus/create-conversation', data),

    // Reels
    getReels: (params) => instance.get('/reels', { params }),
    likeReel: (id) => instance.post(`/reels/like/${id}`),
    bookmarkReel: (id) => instance.post(`/reels/bookmark/${id}`),
    trackReelView: (id) => instance.post(`/reels/view/${id}`),
    addReel: (data) => instance.post('/reels', data),
    deleteReel: (id) => instance.delete(`/reels/${id}`),
};

instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.log('❌ API Error:', error.message, error.config?.url);
        if (error.response?.status === 401) api.clearToken();
        return Promise.reject(error);
    }
);

export default api;
