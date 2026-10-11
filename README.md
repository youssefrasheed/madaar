# 🚀 SocialHub — منصة إدارة السوشيال ميديا

منصة متكاملة لإدارة كل حسابات السوشيال ميديا من مكان واحد.

## ✨ المميزات

- 🔗 **ربط الحسابات** — Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Snapchat
- 📝 **Compose & Schedule** — كتابة وجدولة البوستات على أكتر من منصة في نفس الوقت
- 📅 **Content Calendar** — تقويم مرئي لكل المنشورات المجدولة
- 📊 **Analytics Dashboard** — تقارير يومية وأسبوعية وشهرية
- 🤖 **AI Suggestions** — اقتراحات محتوى مدعومة بـ Gemini AI

## 🏗️ البنية

```
social-media-hub/
├── backend/          ← Node.js + Express + SQLite
│   ├── src/
│   │   ├── routes/   ← API endpoints
│   │   ├── services/ ← Business logic
│   │   ├── db/       ← Database
│   │   └── middleware/
│   └── package.json
├── frontend/         ← React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/    ← Dashboard, Accounts, Compose, Calendar, Analytics
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   └── package.json
└── README.md
```

## 🚀 التشغيل السريع

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
الـ API بيشتغل على: http://localhost:3001

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
الـ Dashboard بيفتح على: http://localhost:5173

## 📊 الـ API Endpoints

### المصادقة
- `POST /api/auth/register` — تسجيل مستخدم جديد
- `POST /api/auth/login` — تسجيل الدخول
- `POST /api/auth/logout` — تسجيل الخروج

### الحسابات
- `GET /api/accounts` — قائمة الحسابات المتصلة
- `POST /api/accounts` — ربط حساب جديد
- `DELETE /api/accounts/:id` — فصل حساب
- `GET /api/accounts/:id/stats` — إحصاءات حساب محدد

### المنشورات
- `GET /api/posts` — قائمة المنشورات
- `POST /api/posts` — إنشاء منشور جديد
- `PUT /api/posts/:id` — تعديل منشور
- `DELETE /api/posts/:id` — حذف منشور
- `POST /api/posts/:id/publish` — نشر فوري

### التقارير
- `GET /api/analytics/overview` — نظرة عامة
- `GET /api/analytics/daily` — تقرير يومي
- `GET /api/analytics/weekly` — تقرير أسبوعي
- `GET /api/analytics/accounts/:id` — تقرير حساب محدد

## 🔑 ربط المنصات الحقيقية

لربط المنصات الحقيقية، محتاج تضيف الـ API Keys في ملف `.env`:

| المنصة | الـ API Keys المطلوبة |
|--------|----------------------|
| Facebook / Instagram | `META_APP_ID`, `META_APP_SECRET` |
| Twitter / X | `TWITTER_API_KEY`, `TWITTER_API_SECRET` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| YouTube | `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID` |
| Snapchat | `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET` |

## 📈 التقارير

### التقرير اليومي يشمل:
- عدد المتابعين الجدد
- الـ Impressions والـ Reach
- أكتر بوست اتفاعل معاه
- الـ Engagement Rate

### التقرير الأسبوعي يشمل:
- مقارنة الأداء أسبوع بأسبوع
- أفضل أوقات النشر
- ترند المحتوى
- ملخص لكل منصة

## 🛠️ التقنيات

**Frontend:** React 18 + Vite + Tailwind CSS + Recharts  
**Backend:** Node.js + Express + SQLite (better-sqlite3)  
**Scheduler:** node-cron  
**Auth:** JWT  
