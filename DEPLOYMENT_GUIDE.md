# 🌐 دليل نشر وتثبيت SocialHub على سيرفر خارجي (Deployment Guide)

هذا الدليل يشرح لك خطوة بخطوة كيف ترفع وتشغل منصة **SocialHub** على سيرفر سحابي يعمل 24 ساعة طوال أيام الأسبوع لجدولة ونشر منشوراتك حتى لو أغلقت جهازك تماماً.

---

## 🚀 الخيار الأول: التثبيت على سيرفر VPS (الأفضل والأوفر — 4$ إلى 5$/شهر)
*(يدعم Hetzner, DigitalOcean, Linode, Contabo, AWS LightSail)*

### 1. المتطلبات:
* سيرفر بنظام **Ubuntu 22.04 أو 24.04 LTS**.
* تثبيت **Docker** و **Docker Compose**.

### 2. تجهيز السيرفر (تشغيل الأوامر التالية في Terminal السيرفر):
```bash
# تحديث السيرفر
sudo apt update && sudo apt upgrade -y

# تثبيت Docker و Docker Compose
sudo apt install -y docker.io docker-compose-v2 git

# تفعيل Docker ليبدأ تلقائياً عند إعادة تشغيل السيرفر
sudo systemctl enable --now docker
```

### 3. رفع ملفات المشروع إلى السيرفر:
يمكنك رفع مجلد المشروع عبر Git أو بواسطة `scp` من جهازك:
```bash
# من جهازك اللوكل (ارفع المشروع إلى السيرفر):
scp -r /Users/yousefsoom/.gemini/antigravity/scratch/social-media-hub user@YOUR_SERVER_IP:/home/user/socialhub
```

### 4. ضبط المتغيرات وتشغيل المنصة بأمر واحد:
```bash
# الدخول لمجلد المشروع على السيرفر
cd /home/user/socialhub

# إنشاء ملف البيئة
cp backend/.env.example backend/.env

# تعديل ملف .env وإضافة مفتاح Gemini API ومفاتيح المنصات
nano backend/.env

# تشغيل المنصة في الخلفية (Production Background Mode)
sudo docker compose up -d --build
```

✅ **مبروك!** المنصة الآن تعمل على رابط السيرفر المباشر:
`http://YOUR_SERVER_IP`

---

## 🔒 إضافة شهادة أمان مجانية (HTTPS / SSL):
لتأمين الرابط وتفعيل شهادة SSL مجانية، يمكنك استخدام **Nginx مع Certbot** أو توجيه الدومين عبر **Cloudflare**:

### طريقة Cloudflare (الأسهل بدون أوامر):
1. اربط الدومين الخاص بك بـ Cloudflare.
2. اضف سجل DNS A-Record يشير إلى IP السيرفر الخاص بك.
3. فعل زر الـ Proxy البرتقالي وSSL إلى **Flexible** أو **Full**.
4. سيفتح الموقع تلقائياً بـ `https://yourdomain.com` مع تشفير كامل!

---

## ☁️ الخيار الثاني: النشر على Railway أو Render (بدون إدارة سيرفرات)

### على **Railway.app**:
1. ارفع الكود إلى مستودع على **GitHub** (Private Repo).
2. افتح [railway.app](https://railway.app) واضغط **New Project** -> **Deploy from GitHub repo**.
3. اختر مجلد `backend` كـ Service، وضع المتغيرات البيئية من `.env.example`.
4. اضف **Volume** للمسار `/app/data` حتى تظل قاعدة البيانات محفوظة باستمرار.
5. اختر مجلد `frontend` كـ Service ثانية واربط الـ API برابط الـ Backend.

---

## 📋 قائمة فحص المتغيرات البيئية (Environment Variables Checklist):

في ملف `backend/.env` تأكد من تعيين التالي:
* `NODE_ENV=production`
* `PORT=3001`
* `JWT_SECRET=اكتب_كلمة_سر_عشوائية_قوية_هنا`
* `GEMINI_API_KEY=AIza...` *(مفتاح Google AI Studio المجاني)*
* مفاتيح الـ API للمنصات التي ترغب بربطها فعلياً (Facebook, Twitter, LinkedIn...).

---

## 🛠️ أوامر الصيانة المفيدة على السيرفر:

```bash
# عرض حالة الحاويات وسجل التشغيل:
sudo docker compose ps

# متابعة اللوجز (Logs) وسجل الأخطاء والنشر لحظياً:
sudo docker compose logs -f backend

# إيقاف المنصة:
sudo docker compose down

# تحديث المنصة بعد تعديل أي كود:
sudo docker compose up -d --build
```
