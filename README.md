# EchoMind

**AI-Powered English Learning Platform with Voice Cloning Technology**

EchoMind, yapay zeka ve ses klonlama teknolojileri kullanarak kişiselleştirilmiş İngilizce öğrenme deneyimi sunan modern bir mobil eğitim platformudur.

---

## Proje Hakkında

EchoMind, geleneksel dil öğrenme yöntemlerinin ötesine geçerek, kullanıcılara interaktif ve adaptif bir öğrenme ortamı sağlar. Ses klonlama teknolojisi ile telaffuz pratiği, yapay zeka destekli seviye belirleme ve kişiselleştirilmiş içerik sunumu ile öne çıkar.

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Akıllı Seviye Tespiti** | Yapay zeka destekli placement test ile kullanıcının seviyesini otomatik belirleme |
| **Ses Klonlama Pratiği** | ElevenLabs entegrasyonu ile kendi sesinizde telaffuz pratiği |
| **Echo Practice** | Cümle tekrarlama ve telaffuz geliştirme modülü |
| **Video Dersler** | Eğitici video içerikleri ve Reels formatında kısa dersler |
| **Kelime Yönetimi** | Günlük kelime akışı ve spaced repetition sistemi |
| **Quiz Sistemi** | İnteraktif sınavlar ve ilerleme takibi |
| **Avatar Sohbet** | AI destekli konuşma partneri (HeyGen/Tavus entegrasyonu) |
| **Bildirim Sistemi** | Push notification ile hatırlatmalar ve motivasyon |
| **Gamification** | Streak sistemi, rozetler ve ilerleme takibi |
| **Admin Paneli** | Kullanıcı, içerik ve kelime yönetimi |

---

## Teknik Mimari

### Proje Yapısı

```
echomind/
├── frontend/                    # React Native (Expo) Mobil Uygulama
│   ├── src/
│   │   ├── screens/             # Uygulama ekranları (16 ekran)
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── LearnScreen.js
│   │   │   ├── PlacementTestScreen.js
│   │   │   ├── PronunciationScreen.js
│   │   │   ├── EchoPracticeScreen.js
│   │   │   ├── QuizScreen.js
│   │   │   ├── ReelsScreen.js
│   │   │   ├── VideoLessonsScreen.js
│   │   │   ├── AvatarChatScreen.js
│   │   │   ├── ReelManagementScreen.js
│   │   │   ├── WordManagementScreen.js
│   │   │   ├── UserManagementScreen.js
│   │   │   └── SendNotificationScreen.js
│   │   ├── navigation/          # React Navigation yapılandırması
│   │   ├── services/            # API servisleri
│   │   └── store/               # Zustand state management
│   └── package.json
│
└── backend/                     # Node.js (Express) REST API
    ├── src/
    │   ├── controllers/         # İş mantığı (11 controller)
    │   ├── models/              # MongoDB şemaları (7 model)
    │   │   ├── User.js
    │   │   ├── Word.js
    │   │   ├── Quiz.js
    │   │   ├── Progress.js
    │   │   ├── Reel.js
    │   │   ├── PracticeSentence.js
    │   │   └── Notification.js
    │   ├── routes/              # API endpoint'leri (12 route dosyası)
    │   ├── middleware/          # Auth middleware
    │   ├── services/            # Harici servis entegrasyonları
    │   │   ├── aiService.js
    │   │   ├── elevenLabsService.js
    │   │   ├── speechService.js
    │   │   ├── heygenService.js
    │   │   └── tavusService.js
    │   └── utils/
    └── package.json
```

### Teknoloji Yığını

#### Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| React Native | 0.81.5 | Cross-platform mobil geliştirme |
| Expo | 54 | Geliştirme ve dağıtım altyapısı |
| React Navigation | 6.x | Ekran navigasyonu |
| Zustand | 4.4.7 | State management |
| React Native Paper | 5.12.3 | UI bileşen kütüphanesi |
| Axios | 1.6.2 | HTTP istemcisi |
| Expo AV | 16.0.8 | Ses/video işleme |
| Expo Camera | 17.0.10 | Kamera erişimi |
| Expo Speech | 14.0.2 | Text-to-speech |
| Expo Notifications | 0.31.1 | Push bildirimler |
| Expo Secure Store | 15.0.8 | Güvenli veri depolama |

#### Backend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| Node.js | 18+ | Runtime environment |
| Express | 4.18.2 | Web framework |
| MongoDB | - | NoSQL veritabanı |
| Mongoose | 8.0.3 | MongoDB ODM |
| JWT | 9.0.2 | Kimlik doğrulama |
| bcryptjs | 2.4.3 | Şifre hashleme |
| Google Cloud Speech | 6.0.0 | Speech-to-text |
| Multer | 1.4.5 | Dosya yükleme |
| youtube-dl-exec | 3.0.27 | Video indirme |

#### Harici API Entegrasyonları
- **ElevenLabs** - Ses klonlama ve text-to-speech
- **Google Cloud STT** - Speech-to-text dönüşümü
- **HeyGen** - AI avatar video oluşturma
- **Tavus** - Conversational AI video

---

## API Endpoints

### Authentication
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Kullanıcı girişi |

### Users
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/users/profile` | Kullanıcı profili |
| PUT | `/api/users/profile` | Profil güncelleme |
| GET | `/api/users` | Tüm kullanıcılar (Admin) |

### Words
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/words` | Kelime listesi |
| POST | `/api/words` | Kelime ekleme (Admin) |
| PUT | `/api/words/:id` | Kelime güncelleme |
| DELETE | `/api/words/:id` | Kelime silme |

### Quiz
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/quiz` | Quiz soruları |
| POST | `/api/quiz/submit` | Quiz cevap gönderme |

### Pronunciation
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/pronunciation/analyze` | Telaffuz analizi |
| GET | `/api/pronunciation/sentences` | Pratik cümleleri |

### Echo Practice
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/echo-practice/sentences` | Pratik cümleleri |
| POST | `/api/echo-practice/evaluate` | Telaffuz değerlendirme |

### Reels
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/reels` | Reel listesi |
| POST | `/api/reels` | Reel ekleme (Admin) |
| DELETE | `/api/reels/:id` | Reel silme |

### Notifications
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/notifications` | Bildirimler |
| POST | `/api/notifications/send` | Bildirim gönder (Admin) |

### Avatar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/avatar/chat` | Avatar sohbet |

---

## Kurulum

### Gereksinimler

- Node.js 18+
- MongoDB
- Expo CLI
- npm veya yarn

### Backend Kurulumu

```bash
# Backend dizinine git
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle
# Aşağıdaki değişkenleri ayarla:
# - MONGODB_URI=mongodb://localhost:27017/echomind
# - JWT_SECRET=your_jwt_secret_key
# - ELEVENLABS_API_KEY=your_elevenlabs_key
# - GOOGLE_CLOUD_PROJECT_ID=your_project_id
# - HEYGEN_API_KEY=your_heygen_key
# - TAVUS_API_KEY=your_tavus_key

# Veritabanını seed'le (opsiyonel)
npm run seed
npm run seed:practice
npm run seed:reels

# Geliştirme sunucusunu başlat
npm run dev
```

### Frontend Kurulumu

```bash
# Frontend dizinine git
cd frontend

# Bağımlılıkları yükle
npm install

# Expo sunucusunu başlat
npx expo start

# veya platform spesifik
npx expo start --android
npx expo start --ios
```

### Ortam Değişkenleri

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/echomind

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# ElevenLabs (Voice Cloning)
ELEVENLABS_API_KEY=your_api_key

# Google Cloud (Speech-to-Text)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# HeyGen (Avatar)
HEYGEN_API_KEY=your_api_key

# Tavus (Conversational AI)
TAVUS_API_KEY=your_api_key

# Server
PORT=5000
NODE_ENV=development
```

---

## Veritabanı Modelleri

### User Model
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  level: String (A1-C2),
  xp: Number,
  streak: Number,
  lastActivity: Date,
  role: String (user/admin),
  preferences: Object
}
```

### Word Model
```javascript
{
  word: String,
  translation: String,
  level: String,
  category: String,
  examples: [String],
  audio: String
}
```

### Quiz Model
```javascript
{
  question: String,
  options: [String],
  correctAnswer: Number,
  level: String,
  category: String,
  explanation: String
}
```

---

## Geliştirme Ekibi

| İsim | Rol |
|------|-----|
| **Proje Danışmanı** | Nurettin Şanyer |
| **Proje Danışmanı** | Ömer Hoca |
| **Geliştirici** | Khalid Tariq |
| **Geliştirici** | İrem Altunay |

---

## Gelecek Planları

- [ ] Çoklu dil desteği (Almanca, Fransızca, İspanyolca)
- [ ] Gerçek zamanlı AI Roleplay konuşmaları
- [ ] Grup öğrenme ve rekabet modu
- [ ] Offline içerik desteği
- [ ] Tablet ve web versiyonu
- [ ] Kurumsal (B2B) çözümler
- [ ] Detaylı analitik dashboard

---

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**EchoMind** - *Sesinizle Öğrenin, Kendinizi İfade Edin*
