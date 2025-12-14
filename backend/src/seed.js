const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import the actual User model with pre-save hook
const User = require('./models/User');

const defaultUsers = [
    {
        name: 'Admin User',
        email: 'admin@echomind.com',
        password: 'admin123',
        role: 'admin',
        level: 'advanced',
        levelTestCompleted: true,
        points: 1000
    },
    {
        name: 'Test User',
        email: 'user@echomind.com',
        password: 'user123',
        role: 'user',
        level: null,
        levelTestCompleted: false,
        points: 0
    }
];

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/echomind';
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing users
        console.log('🗑️  Clearing existing users...');
        await User.deleteMany({});

        // Create users - model's pre-save hook will hash passwords automatically
        console.log('👤 Creating default users...');

        for (const userData of defaultUsers) {
            const user = await User.create(userData);
            console.log(`   ✅ Created: ${user.email} (password: ${userData.password})`);
        }

        console.log('\n🎉 Seed completed successfully!');
        console.log('\n📋 Login credentials:');
        console.log('   Admin: admin@echomind.com / admin123');
        console.log('   User:  user@echomind.com / user123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedUsers();
