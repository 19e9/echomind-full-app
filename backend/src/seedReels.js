require('dotenv').config();
const mongoose = require('mongoose');
const Reel = require('./models/Reel');

const DEMO_REELS = [
    {
        title: 'English Greetings 101',
        description: 'Learn the most common ways to greet people in English! 👋 #LearnEnglish #Greetings',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        level: 'beginner',
        likes: 1234,
        views: 5678,
        creator: { name: 'EchoMind', avatar: '👨‍🏫', verified: true },
        sourceType: 'ai-generated'
    },
    {
        title: 'Present Tense Tips',
        description: 'Master the present simple and continuous in just 60 seconds! ⏰ #Grammar',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        level: 'elementary',
        likes: 892,
        views: 3421,
        creator: { name: 'Grammar Pro', avatar: '📚', verified: true },
        sourceType: 'uploaded'
    },
    {
        title: 'Restaurant Vocabulary',
        description: 'Order like a pro at any restaurant! 🍽️ #FoodEnglish #Vocabulary',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        level: 'intermediate',
        likes: 2156,
        views: 8934,
        creator: { name: 'Daily English', avatar: '🌟', verified: false },
        sourceType: 'tiktok'
    },
    {
        title: 'Phrasal Verbs Made Easy',
        description: 'Stop making mistakes with phrasal verbs! 🎯 #PhrasalVerbs #AdvancedEnglish',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        level: 'advanced',
        likes: 567,
        views: 2345,
        creator: { name: 'English Master', avatar: '🎓', verified: true },
        sourceType: 'instagram'
    },
    {
        title: 'Business Email Writing',
        description: 'Write professional emails that get results! 📧 #BusinessEnglish',
        videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        level: 'upper-intermediate',
        likes: 1456,
        views: 4567,
        creator: { name: 'Career English', avatar: '💼', verified: true },
        sourceType: 'ai-generated'
    }
];

const seedReels = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing reels
        await Reel.deleteMany({});
        console.log('Cleared existing reels');

        // Insert demo reels
        await Reel.insertMany(DEMO_REELS);
        console.log(`✅ Inserted ${DEMO_REELS.length} demo reels`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedReels();
