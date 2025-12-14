// Run this by copying to Node terminal or via: node -e "require('./src/seedPractice')"
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const PracticeSentence = require('./models/PracticeSentence');

const practiceWords = [
    // Beginner
    { sentence: 'Hello', phonetic: '/həˈloʊ/', level: 'beginner', topic: 'pronunciation', translation: 'Merhaba' },
    { sentence: 'Thank you', phonetic: '/θæŋk juː/', level: 'beginner', topic: 'pronunciation', translation: 'Teşekkür ederim' },
    { sentence: 'Goodbye', phonetic: '/ˌɡʊdˈbaɪ/', level: 'beginner', topic: 'pronunciation', translation: 'Hoşça kal' },
    { sentence: 'Please', phonetic: '/pliːz/', level: 'beginner', topic: 'pronunciation', translation: 'Lütfen' },
    { sentence: 'Water', phonetic: '/ˈwɔːtər/', level: 'beginner', topic: 'pronunciation', translation: 'Su' },
    { sentence: 'Apple', phonetic: '/ˈæpəl/', level: 'beginner', topic: 'pronunciation', translation: 'Elma' },
    { sentence: 'House', phonetic: '/haʊs/', level: 'beginner', topic: 'pronunciation', translation: 'Ev' },
    { sentence: 'Family', phonetic: '/ˈfæməli/', level: 'beginner', topic: 'pronunciation', translation: 'Aile' },

    // Elementary
    { sentence: 'Beautiful', phonetic: '/ˈbjuːtɪfəl/', level: 'elementary', topic: 'pronunciation', translation: 'Güzel' },
    { sentence: 'Comfortable', phonetic: '/ˈkʌmftərbəl/', level: 'elementary', topic: 'pronunciation', translation: 'Rahat' },
    { sentence: 'Vegetable', phonetic: '/ˈvedʒtəbəl/', level: 'elementary', topic: 'pronunciation', translation: 'Sebze' },
    { sentence: 'Library', phonetic: '/ˈlaɪbreri/', level: 'elementary', topic: 'pronunciation', translation: 'Kütüphane' },
    { sentence: 'Wednesday', phonetic: '/ˈwenzdei/', level: 'elementary', topic: 'pronunciation', translation: 'Çarşamba' },
    { sentence: 'Restaurant', phonetic: '/ˈrestərɑːnt/', level: 'elementary', topic: 'pronunciation', translation: 'Restoran' },
    { sentence: 'Important', phonetic: '/ɪmˈpɔːrtənt/', level: 'elementary', topic: 'pronunciation', translation: 'Önemli' },
    { sentence: 'Different', phonetic: '/ˈdɪfərənt/', level: 'elementary', topic: 'pronunciation', translation: 'Farklı' },

    // Intermediate
    { sentence: 'Perseverance', phonetic: '/ˌpɜːrsəˈvɪərəns/', level: 'intermediate', topic: 'pronunciation', translation: 'Azim' },
    { sentence: 'Entrepreneur', phonetic: '/ˌɑːntrəprəˈnɜːr/', level: 'intermediate', topic: 'pronunciation', translation: 'Girişimci' },
    { sentence: 'Phenomenon', phonetic: '/fɪˈnɑːmɪnən/', level: 'intermediate', topic: 'pronunciation', translation: 'Fenomen' },
    { sentence: 'Pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃən/', level: 'intermediate', topic: 'pronunciation', translation: 'Telaffuz' },
    { sentence: 'Opportunity', phonetic: '/ˌɑːpərˈtuːnəti/', level: 'intermediate', topic: 'pronunciation', translation: 'Fırsat' },
    { sentence: 'Environment', phonetic: '/ɪnˈvaɪrənmənt/', level: 'intermediate', topic: 'pronunciation', translation: 'Çevre' },
    { sentence: 'Technology', phonetic: '/tekˈnɑːlədʒi/', level: 'intermediate', topic: 'pronunciation', translation: 'Teknoloji' },
    { sentence: 'Experience', phonetic: '/ɪkˈspɪriəns/', level: 'intermediate', topic: 'pronunciation', translation: 'Deneyim' },

    // Upper-intermediate
    { sentence: 'Conscientious', phonetic: '/ˌkɑːnʃiˈenʃəs/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Vicdanlı' },
    { sentence: 'Miscellaneous', phonetic: '/ˌmɪsəˈleɪniəs/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Çeşitli' },
    { sentence: 'Sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Sofistike' },
    { sentence: 'Simultaneously', phonetic: '/ˌsaɪməlˈteɪniəsli/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Eşzamanlı' },
    { sentence: 'Acquaintance', phonetic: '/əˈkweɪntəns/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Tanıdık' },
    { sentence: 'Comprehensive', phonetic: '/ˌkɑːmprɪˈhensɪv/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'Kapsamlı' },
    { sentence: 'Collaboration', phonetic: '/kəˌlæbəˈreɪʃən/', level: 'upper-intermediate', topic: 'pronunciation', translation: 'İşbirliği' },

    // Advanced
    { sentence: 'Onomatopoeia', phonetic: '/ˌɑːnəˌmætəˈpiːə/', level: 'advanced', topic: 'pronunciation', translation: 'Yansıma' },
    { sentence: 'Worcestershire', phonetic: '/ˈwʊstərʃər/', level: 'advanced', topic: 'pronunciation', translation: 'Worcestershire' },
    { sentence: 'Anemone', phonetic: '/əˈneməni/', level: 'advanced', topic: 'pronunciation', translation: 'Anemon' },
    { sentence: 'Quinoa', phonetic: '/ˈkiːnwɑː/', level: 'advanced', topic: 'pronunciation', translation: 'Kinoa' },
    { sentence: 'Epitome', phonetic: '/ɪˈpɪtəmi/', level: 'advanced', topic: 'pronunciation', translation: 'Simge' },
    { sentence: 'Hyperbole', phonetic: '/haɪˈpɜːrbəli/', level: 'advanced', topic: 'pronunciation', translation: 'Abartı' },
];

async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.log('MONGO_URI not found, using fallback...');
        console.log('Please run this from the backend folder where .env is located');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        await PracticeSentence.deleteMany({});
        console.log('Cleared existing words');

        const result = await PracticeSentence.insertMany(practiceWords);
        console.log(`✅ Added ${result.length} practice words`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
