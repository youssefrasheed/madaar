const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const { send2FACode, sendPasswordResetCode } = require('../services/emailService');
const axios = require('axios');

const twitterPkceStore = new Map();

function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}***@${domain}`;
}

/**
 * POST /api/auth/register
 * Register a new user with 2FA protection
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, email, and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({
        error: 'User exists',
        message: 'الحساب مسجل بالفعل بهذا البريد الإلكتروني. يُرجى تسجيل الدخول'
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertStmt = db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(email.toLowerCase().trim(), passwordHash, name.trim());
    const userId = result.lastInsertRowid;

    // Generate 6-digit OTP code for 2FA
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO verification_codes (user_id, code, purpose, attempts, expires_at)
      VALUES (?, ?, 'login_2fa', 0, ?)
    `).run(userId, otpCode, expiresAt);

    // Send code to user's email
    await send2FACode(email.toLowerCase().trim(), otpCode, name.trim());

    // Issue temporary token for 2FA validation step (expires in 10 minutes)
    const tempToken = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), name: name.trim(), type: '2fa_pending' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(201).json({
      requireOtp: true,
      tempToken,
      email: maskEmail(email),
      message: 'تم إنشاء حساب الشركة وإرسال رمز التحقق الأمني (2FA) إلى بريدك الإلكتروني'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to register user'
    });
  }
});

/**
 * POST /api/auth/login
 * Step 1 of 2FA: Verify credentials and issue OTP code
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate prior unused OTPs for this user
    try {
      db.prepare(`DELETE FROM verification_codes WHERE user_id = ? AND purpose = 'login_2fa'`).run(user.id);
    } catch (e) {}

    // Store new OTP in database
    db.prepare(`
      INSERT INTO verification_codes (user_id, code, purpose, attempts, expires_at)
      VALUES (?, ?, 'login_2fa', 0, ?)
    `).run(user.id, otpCode, expiresAt);

    // Send code to user's email
    await send2FACode(user.email, otpCode, user.name);

    // Issue temporary token for 2FA validation step (expires in 10 minutes)
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, type: '2fa_pending' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({
      requireOtp: true,
      tempToken,
      email: maskEmail(user.email),
      message: 'تم إرسال رمز التحقق الأمني إلى بريدك الإلكتروني'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Step 2 of 2FA: Verify the 6-digit code and issue full authentication session
 */
router.post('/verify-otp', (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Temp token and 6-digit OTP code are required'
      });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (decoded.type !== '2fa_pending') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'انتهت صلاحية جلسة التحقق، يُرجى تسجيل الدخول مجدداً'
      });
    }

    // Retrieve active OTP record
    const otpRecord = db.prepare(`
      SELECT * FROM verification_codes
      WHERE user_id = ? AND purpose = 'login_2fa'
      ORDER BY id DESC LIMIT 1
    `).get(decoded.id);

    if (!otpRecord) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'لم يتم العثور على رمز تحقق صالح، اطلب رمزاً جديداً'
      });
    }

    // Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Expired OTP',
        message: 'انتهت صلاحية الرمز، اطلب إرسال رمز جديد'
      });
    }

    // Check maximum attempts (brute force protection)
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. يُرجى تسجيل الدخول مجدداً'
      });
    }

    // Validate the code
    if (otpRecord.code !== otp.trim()) {
      db.prepare(`
        UPDATE verification_codes
        SET attempts = attempts + 1
        WHERE id = ?
      `).run(otpRecord.id);

      const remaining = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({
        error: 'Invalid code',
        message: `رمز التحقق غير صحيح. متبقي ${remaining} محاولات`
      });
    }

    // Code verified! Delete used code
    db.prepare(`DELETE FROM verification_codes WHERE user_id = ?`).run(decoded.id);

    // Issue permanent 7-day session token
    const token = jwt.sign(
      { id: decoded.id, email: decoded.email, name: decoded.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = db.prepare(`
      SELECT id, email, name, avatar, bio, website, phone, industry, country, created_at 
      FROM users WHERE id = ?
    `).get(decoded.id);

    return res.json({
      message: 'تم التحقق بنجاح!',
      token,
      user
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify security code'
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code to user's email
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: 'tempToken is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (decoded.type !== '2fa_pending') throw new Error('Invalid token');
    } catch {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate new code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`DELETE FROM verification_codes WHERE user_id = ? AND purpose = 'login_2fa'`).run(user.id);
    db.prepare(`
      INSERT INTO verification_codes (user_id, code, purpose, attempts, expires_at)
      VALUES (?, ?, 'login_2fa', 0, ?)
    `).run(user.id, otpCode, expiresAt);

    await send2FACode(user.email, otpCode, user.name);

    return res.json({
      success: true,
      message: 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني'
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend code' });
  }
});

/**
 * POST /api/auth/logout
 * Acknowledge user logout
 */
router.post('/logout', (req, res) => {
  return res.json({
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/me
 * Get current user / company profile
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, avatar, bio, website, phone, industry, country, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Update company / user profile details
 */
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, avatar, bio, website, phone, industry, country } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'اسم الشركة مطلوب'
      });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, avatar = ?, bio = ?, website = ?, phone = ?, industry = ?, country = ?
      WHERE id = ?
    `).run(
      name.trim(),
      avatar || null,
      bio || null,
      website || null,
      phone || null,
      industry || null,
      country || null,
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, email, name, avatar, bio, website, phone, industry, country, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    return res.json({
      message: 'تم تحديث بيانات الشركة بنجاح',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      error: 'Server error',
      message: 'فشل في تحديث بيانات البروفايل'
    });
  }
});

/**
 * GET /api/auth/managed-accounts
 * List all company / client accounts for fast switching
 */
router.get('/managed-accounts', authenticateToken, (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT 
        u.id, u.email, u.name, u.avatar, u.industry, u.country, u.created_at,
        (SELECT count(*) FROM social_accounts WHERE user_id = u.id) as accounts_count,
        (SELECT count(*) FROM posts WHERE user_id = u.id) as posts_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    return res.json({ accounts });
  } catch (err) {
    console.error('List managed accounts error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch client accounts' });
  }
});

/**
 * POST /api/auth/switch-account
 * Safely switch session to a target client account with a new isolated token
 */
router.post('/switch-account', authenticateToken, (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Validation error', message: 'Target user ID is required' });
    }

    const targetUser = db.prepare(`
      SELECT id, email, name, avatar, bio, website, phone, industry, country, created_at 
      FROM users WHERE id = ?
    `).get(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Not found', message: 'حساب العميل غير موجود' });
    }

    const token = jwt.sign(
      { id: targetUser.id, email: targetUser.email, name: targetUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: `تم التبديل بنجاح إلى حساب: ${targetUser.name}`,
      user: targetUser,
      token
    });
  } catch (err) {
    console.error('Switch account error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to switch account' });
  }
});

/**
 * POST /api/auth/create-client
 * Create a new isolated client company account directly
 */
router.post('/create-client', authenticateToken, (req, res) => {
  try {
    const { name, email, industry, bio } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Validation error', message: 'اسم العميل / الشركة مطلوب' });
    }

    const clientEmail = (email && email.trim()) 
      ? email.toLowerCase().trim() 
      : `client_${Date.now().toString().slice(-5)}@madaar.io`;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(clientEmail);
    if (existing) {
      return res.status(409).json({ error: 'User exists', message: 'البريد الإلكتروني للعميل مسجل مسبقاً' });
    }

    const passwordHash = bcrypt.hashSync('client_pass_' + Date.now(), 10);
    const avatar = null;

    const insert = db.prepare(`
      INSERT INTO users (email, password_hash, name, industry, bio, avatar)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      clientEmail,
      passwordHash,
      name.trim(),
      industry || 'إدارة الحسابات والتسويق',
      bio || `حساب عميل مستقل تابع لمنصة مدار`,
      avatar
    );

    const newClientId = insert.lastInsertRowid;
    const newClient = db.prepare(`
      SELECT id, email, name, avatar, industry, bio, created_at 
      FROM users WHERE id = ?
    `).get(newClientId);

    return res.status(201).json({
      message: `تم إنشاء مساحة عمل العميل «${name.trim()}» بنجاح!`,
      client: newClient
    });
  } catch (err) {
    console.error('Create client error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to create client account' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiates password reset by sending a 6-digit OTP code to the registered email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني' });
    }

    // Invalidate old password reset codes
    try {
      db.prepare(`DELETE FROM verification_codes WHERE user_id = ? AND purpose = 'password_reset'`).run(user.id);
    } catch (e) {}

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    db.prepare(`
      INSERT INTO verification_codes (user_id, code, purpose, attempts, expires_at)
      VALUES (?, ?, 'password_reset', 0, ?)
    `).run(user.id, otpCode, expiresAt);

    await sendPasswordResetCode(user.email, otpCode, user.name);

    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'reset_pending' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      resetToken,
      maskedEmail: maskEmail(user.email),
      message: 'تم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلب استعادة كلمة المرور' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies the 6-digit reset OTP and updates user's password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, code, newPassword } = req.body;

    if (!resetToken || !code || !newPassword) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة (الرمز، كلمة المرور الجديدة)' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 خانات' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.type !== 'reset_pending') throw new Error('Invalid token');
    } catch {
      return res.status(401).json({ error: 'انتهت صلاحية جلسة الاستعادة، يُرجى المحاولة من جديد' });
    }

    const record = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE user_id = ? AND purpose = 'password_reset' AND expires_at > datetime('now')
      ORDER BY id DESC LIMIT 1
    `).get(decoded.id);

    if (!record || record.code !== code.trim()) {
      return res.status(400).json({ error: 'رمز الأمان غير صحيح أو انتهت صلاحيته' });
    }

    // Hash new password
    const newHash = bcrypt.hashSync(newPassword, 10);

    // Update user in DB
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, decoded.id);

    // Clean up used code
    db.prepare(`DELETE FROM verification_codes WHERE user_id = ? AND purpose = 'password_reset'`).run(decoded.id);

    return res.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'فشل في تحديث كلمة المرور' });
  }
});

/**
 * GET /api/auth/facebook
 * Start official Meta Facebook OAuth flow
 */
router.get('/facebook', (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  let userId = 2; // Default to primary tenant
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {
      console.warn('Invalid token in /api/auth/facebook, defaulting to userId: 2');
    }
  }

  const appId = process.env.FACEBOOK_APP_ID || '1798771857986929';
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'https://api.jooart.uk/api/auth/facebook/callback';
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  const scope = [
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'pages_read_user_content',
    'pages_manage_metadata',
    'pages_messaging'
  ].join(',');

  const fbUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

  return res.redirect(fbUrl);
});

/**
 * GET /api/auth/facebook/login-url
 * Returns the direct official URL for popup window
 */
router.get('/facebook/login-url', (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  let userId = 2;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {}
  }

  const appId = process.env.FACEBOOK_APP_ID || '1798771857986929';
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'https://api.jooart.uk/api/auth/facebook/callback';
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  const scope = [
    'public_profile',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'pages_read_user_content',
    'pages_manage_metadata',
    'pages_messaging'
  ].join(',');

  const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

  return res.json({ success: true, url });
});

/**
 * GET /api/auth/facebook/callback
 * Official Meta OAuth redirect endpoint
 */
router.get('/facebook/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('Facebook OAuth Error:', error, error_description);
    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><meta charset="utf-8"><title>خطأ في التفويض</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
        <h3 style="color: #f43f5e;">تعذر إتمام التفويض من فيسبوك</h3>
        <p style="color: #94a3b8;">${error_description || error}</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 24px; border-radius: 12px; background: #334155; color: white; border: none; cursor: pointer;">إغلاق النافذة</button>
      </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('كود التفويض مفقود');
  }

  let userId = 2;
  try {
    if (state) {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (decodedState.userId) userId = decodedState.userId;
    }
  } catch (e) {
    console.warn('Could not parse OAuth state, using userId: 2');
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID || '1798771857986929';
    const appSecret = process.env.FACEBOOK_APP_SECRET || '427692138cbaaca964b9538b08311767';
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || 'https://api.jooart.uk/api/auth/facebook/callback';

    // 1. Exchange code for short-lived token
    const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code
      },
      timeout: 10000
    });

    const userAccessToken = tokenRes.data.access_token;

    // 2. Exchange for 60-day Long-Lived Token
    let longLivedToken = userAccessToken;
    try {
      const longRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: userAccessToken
        },
        timeout: 10000
      });
      if (longRes.data.access_token) {
        longLivedToken = longRes.data.access_token;
      }
    } catch (e) {
      console.warn('Long-lived token fallback to user token:', e.message);
    }

    // 3. Fetch User Pages & Instagram Accounts
    let savedCount = 0;
    try {
      const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
        params: {
          fields: 'id,name,access_token,category,followers_count,picture.width(200).height(200),instagram_business_account{id,username,name,profile_picture_url,followers_count}',
          access_token: longLivedToken
        },
        timeout: 10000
      });

      const pages = pagesRes.data.data || [];

      for (const page of pages) {
        const existingFb = db.prepare('SELECT id FROM social_accounts WHERE user_id = ? AND platform = ? AND account_id = ?').get(userId, 'facebook', `@${page.id}`);
        const pagePic = page.picture?.data?.url || null;
        const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();

        if (existingFb) {
          db.prepare(`
            UPDATE social_accounts
            SET account_name = ?, access_token = ?, token_expires_at = ?, profile_pic = ?, followers_count = ?, connected_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(page.name, page.access_token, expiresAt, pagePic, page.followers_count || 0, existingFb.id);
        } else {
          db.prepare(`
            INSERT INTO social_accounts (user_id, platform, account_name, account_id, access_token, token_expires_at, profile_pic, followers_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(userId, 'facebook', page.name, `@${page.id}`, page.access_token, expiresAt, pagePic, page.followers_count || 0);
        }
        savedCount++;

        // Connected Instagram account
        if (page.instagram_business_account) {
          const ig = page.instagram_business_account;
          const igHandle = `@${ig.username || ig.id}`;
          const existingIg = db.prepare('SELECT id FROM social_accounts WHERE user_id = ? AND platform = ? AND account_id = ?').get(userId, 'instagram', igHandle);
          const igPic = ig.profile_picture_url || null;

          if (existingIg) {
            db.prepare(`
              UPDATE social_accounts
              SET account_name = ?, access_token = ?, token_expires_at = ?, profile_pic = ?, followers_count = ?, connected_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(ig.name || ig.username, page.access_token, expiresAt, igPic, ig.followers_count || 0, existingIg.id);
          } else {
            db.prepare(`
              INSERT INTO social_accounts (user_id, platform, account_name, account_id, access_token, token_expires_at, profile_pic, followers_count)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(userId, 'instagram', ig.name || ig.username, igHandle, page.access_token, expiresAt, igPic, ig.followers_count || 0);
          }
          savedCount++;
        }
      }
    } catch (pageErr) {
      console.warn('Fetch pages error:', pageErr.response?.data || pageErr.message);
    }

    // If user has no business pages, save personal profile as fallback
    if (savedCount === 0) {
      try {
        const meRes = await axios.get('https://graph.facebook.com/v21.0/me', {
          params: {
            fields: 'id,name,picture.width(200).height(200)',
            access_token: longLivedToken
          },
          timeout: 10000
        });
        const me = meRes.data;
        const pic = me.picture?.data?.url || null;
        const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();

        const existingMe = db.prepare('SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?').get(userId, 'facebook');
        if (existingMe) {
          db.prepare('UPDATE social_accounts SET account_name = ?, account_id = ?, access_token = ?, token_expires_at = ?, profile_pic = ?, connected_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(me.name, `@${me.id}`, longLivedToken, expiresAt, pic, existingMe.id);
        } else {
          db.prepare('INSERT INTO social_accounts (user_id, platform, account_name, account_id, access_token, token_expires_at, profile_pic, followers_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(userId, 'facebook', me.name, `@${me.id}`, longLivedToken, expiresAt, pic, 0);
        }
      } catch (meErr) {
        console.warn('Personal me fallback error:', meErr.message);
      }
    }

    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تم التفويض بنجاح - مَـدَار</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #0b1120; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 28px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .icon { width: 68px; height: 68px; border-radius: 20px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 34px; margin: 0 auto 20px; }
          h2 { margin: 0 0 10px; font-size: 20px; font-weight: 900; }
          p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; }
          .badge { display: inline-block; margin-top: 15px; padding: 6px 14px; border-radius: 100px; background: #0f172a; border: 1px solid #334155; color: #38bdf8; font-size: 11px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>تم ربط حساب فيسبوك بنجاح! 🎉</h2>
          <p>تم استلام مفاتيح التفويض الرسمية من Meta وحفظ الحساب في منصة مَـدَار. سيتم إغلاق هذه النافذة وتحديث لوحة التحكم تلقائياً...</p>
          <div class="badge">Meta Graph API v21.0 • Connected</div>
        </div>
        <script>
          try {
            localStorage.setItem('madaar_oauth_success', JSON.stringify({ platform: 'facebook', timestamp: Date.now() }));
          } catch(e) {}
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'MADAAR_OAUTH_SUCCESS', platform: 'facebook' }, '*');
            setTimeout(function() { window.close(); }, 1200);
          } else {
            setTimeout(function() { window.location.href = 'https://madaar.jooart.uk/accounts?connected=facebook'; }, 1000);
          }
        </script>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('Facebook OAuth Callback Error:', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    return res.status(500).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><meta charset="utf-8"><title>خطأ في التفويض</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
        <h3 style="color: #f43f5e;">حدث خطأ أثناء الاتصال بسيرفر Meta</h3>
        <p style="color: #94a3b8;">${msg}</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 24px; border-radius: 12px; background: #334155; color: white; border: none; cursor: pointer;">إغلاق</button>
      </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/twitter
 * Initiates Twitter / X OAuth 2.0 PKCE Authorization Flow
 */
router.get('/twitter', (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  let userId = 2;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {
      console.warn('Invalid token in /api/auth/twitter, defaulting to userId: 2');
    }
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = process.env.TWITTER_REDIRECT_URI || 'https://api.jooart.uk/api/auth/twitter/callback';

  // If Twitter Client ID is not configured yet, show setup guide & configuration form
  if (!clientId || clientId === 'mock_twitter_client_id' || clientId.trim() === '') {
    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>إعداد وتفعيل منصة X (Twitter) - مَـدَار</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #0b1120; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 28px; padding: 36px 30px; max-width: 520px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .logo { width: 56px; height: 56px; border-radius: 16px; background: #000; border: 1px solid #334155; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
          .logo svg { width: 28px; height: 28px; fill: white; }
          h2 { margin: 0 0 10px; font-size: 20px; font-weight: 900; text-align: center; }
          p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px; text-align: center; }
          .steps { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 18px; margin-bottom: 24px; text-align: right; }
          .steps ol { margin: 0; padding-right: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.8; }
          .steps li strong { color: #38bdf8; }
          .copy-box { display: flex; align-items: center; justify-content: space-between; background: #1e293b; border: 1px solid #475569; border-radius: 10px; padding: 8px 12px; margin-top: 8px; font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; }
          .copy-btn { background: #334155; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; shrink: 0; margin-right: 8px; }
          .input-group { margin-bottom: 14px; text-align: right; }
          .input-group label { display: block; font-size: 12px; font-weight: bold; color: #94a3b8; margin-bottom: 6px; }
          .input-group input { width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 12px; color: white; font-size: 13px; outline: none; }
          .input-group input:focus { border-color: #38bdf8; }
          .btn-primary { width: 100%; padding: 14px; background: #0284c7; color: white; border: none; border-radius: 14px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
          .btn-primary:hover { background: #0369a1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <h2>تفعيل منصة X (Twitter) الرسمية</h2>
          <p>لربط حسابك وتفعيل النشر التلقائي عبر X API v2، يُرجى إدخال بيانات تطبيق X Developer الخاص بك.</p>
          
          <div class="steps">
            <ol>
              <li>انتقل إلى <strong>X Developer Portal</strong> (<a href="https://developer.x.com/en/portal/dashboard" target="_blank" style="color: #38bdf8;">developer.x.com</a>).</li>
              <li>ضمن <strong>User authentication settings</strong>، قم بتعيين:
                <br>• App permissions: <strong>Read and Write</strong>
                <br>• Type of App: <strong>Web App</strong>
              </li>
              <li>في حقل <strong>Callback URI / Redirect URL</strong>، الصق الرابط التالي:
                <div class="copy-box">
                  <span id="cbUri">${redirectUri}</span>
                  <button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('cbUri').innerText); this.innerText='تم النسخ ✓';">نسخ</button>
                </div>
              </li>
              <li>في حقل <strong>Website URL</strong>: <code>https://madaar.jooart.uk</code></li>
            </ol>
          </div>

          <form action="/api/auth/twitter/configure" method="POST">
            <input type="hidden" name="token" value="${token}">
            <div class="input-group">
              <label>Client ID (من صفحة المفاتيح في X Developer):</label>
              <input type="text" name="clientId" placeholder="مثال: bE9xUzY2bEFyR01V..." required />
            </div>
            <div class="input-group">
              <label>Client Secret (اختياري / للتطبيقات Confidential):</label>
              <input type="password" name="clientSecret" placeholder="Client Secret (إن وجد)" />
            </div>
            <button type="submit" class="btn-primary">حفظ والمتابعة لتفويض الحساب ⚡</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  // Generate PKCE code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const stateObj = { userId, cv: codeVerifier, t: Date.now() };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  twitterPkceStore.set(state, { userId, codeVerifier, timestamp: Date.now() });

  const expiry = Date.now() - 30 * 60 * 1000;
  for (const [k, v] of twitterPkceStore.entries()) {
    if (v.timestamp < expiry) twitterPkceStore.delete(k);
  }

  const scope = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return res.redirect(authUrl);
});

/**
 * GET /api/auth/twitter/login-url
 * Returns direct Twitter OAuth URL for popup window
 */
router.get('/twitter/login-url', (req, res) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  let userId = 2;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {}
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = process.env.TWITTER_REDIRECT_URI || 'https://api.jooart.uk/api/auth/twitter/callback';

  if (!clientId || clientId === 'mock_twitter_client_id' || clientId.trim() === '') {
    return res.json({ success: false, needConfig: true, configureUrl: `/api/auth/twitter?token=${encodeURIComponent(token || '')}` });
  }

  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const stateObj = { userId, cv: codeVerifier, t: Date.now() };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  twitterPkceStore.set(state, { userId, codeVerifier, timestamp: Date.now() });

  const scope = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');
  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  return res.json({ success: true, url });
});

/**
 * POST /api/auth/twitter/configure
 * Save Twitter Client ID and Secret, then continue to authorize
 */
router.post('/twitter/configure', (req, res) => {
  const { clientId, clientSecret, token } = req.body;
  if (!clientId || !clientId.trim()) {
    return res.status(400).send('Client ID مطلوب');
  }

  process.env.TWITTER_CLIENT_ID = clientId.trim();
  if (clientSecret && clientSecret.trim()) {
    process.env.TWITTER_CLIENT_SECRET = clientSecret.trim();
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const envPaths = [
      path.resolve(__dirname, '../../.env'),
      '/var/www/social-media-hub/backend/.env'
    ];

    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        if (content.includes('TWITTER_CLIENT_ID=')) {
          content = content.replace(/TWITTER_CLIENT_ID=.*/g, `TWITTER_CLIENT_ID=${clientId.trim()}`);
        } else {
          content += `\nTWITTER_CLIENT_ID=${clientId.trim()}`;
        }
        if (clientSecret && clientSecret.trim()) {
          if (content.includes('TWITTER_CLIENT_SECRET=')) {
            content = content.replace(/TWITTER_CLIENT_SECRET=.*/g, `TWITTER_CLIENT_SECRET=${clientSecret.trim()}`);
          } else {
            content += `\nTWITTER_CLIENT_SECRET=${clientSecret.trim()}`;
          }
        }
        fs.writeFileSync(p, content, 'utf8');
      }
    }
  } catch (envErr) {
    console.warn('Could not update .env file:', envErr.message);
  }

  return res.redirect(`/api/auth/twitter?token=${encodeURIComponent(token || '')}`);
});

/**
 * GET /api/auth/twitter/callback
 * Official Twitter / X OAuth 2.0 PKCE Callback
 */
router.get('/twitter/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('Twitter OAuth Error:', error, error_description);
    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><meta charset="utf-8"><title>خطأ في التفويض</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
        <h3 style="color: #f43f5e;">تعذر إتمام التفويض من منصة X (Twitter)</h3>
        <p style="color: #94a3b8;">${error_description || error}</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 24px; border-radius: 12px; background: #334155; color: white; border: none; cursor: pointer;">إغلاق النافذة</button>
      </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('كود التفويض مفقود من منصة X');
  }

  let userId = 2;
  let codeVerifier = null;

  if (state && twitterPkceStore.has(state)) {
    const cached = twitterPkceStore.get(state);
    userId = cached.userId || 2;
    codeVerifier = cached.codeVerifier;
    twitterPkceStore.delete(state);
  } else if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (decoded.userId) userId = decoded.userId;
      if (decoded.cv) codeVerifier = decoded.cv;
    } catch (e) {
      console.warn('Could not decode Twitter state:', e.message);
    }
  }

  if (!codeVerifier) {
    return res.status(400).send('انتهت صلاحية جلسة التفويض أو كود التحقق PKCE مفقود. يُرجى إعادة المحاولة من صفحة الحسابات.');
  }

  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'https://api.jooart.uk/api/auth/twitter/callback';

    let tokenRes;
    const bodyParams = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if (clientSecret && !clientSecret.startsWith('mock_')) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    } else {
      bodyParams.append('client_id', clientId);
    }

    try {
      tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', bodyParams.toString(), {
        headers,
        timeout: 15000
      });
    } catch (primaryErr) {
      console.warn('Twitter primary token exchange error, trying fallback format:', primaryErr.response?.data || primaryErr.message);
      // Fallback: send client_id and client_secret directly in body without Basic auth header
      const fallbackParams = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      });
      if (clientSecret && !clientSecret.startsWith('mock_')) {
        fallbackParams.append('client_secret', clientSecret);
      }
      tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', fallbackParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });
    }

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Fetch authenticated user profile from Twitter API v2
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
      params: {
        'user.fields': 'profile_image_url,public_metrics,name,username,verified'
      },
      timeout: 10000
    });

    const twUser = userRes.data?.data;
    const accountName = twUser?.name || 'X Account';
    const accountId = twUser?.username ? `@${twUser.username}` : '@x_user';
    const followersCount = twUser?.public_metrics?.followers_count || 0;
    const profilePic = twUser?.profile_image_url?.replace('_normal', '_400x400') || twUser?.profile_image_url || null;
    const expiresAt = new Date(Date.now() + (expires_in || 7200) * 1000).toISOString();

    // Upsert into social_accounts table
    const existing = db.prepare('SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?').get(userId, 'twitter');
    if (existing) {
      db.prepare(`
        UPDATE social_accounts
        SET account_name = ?, account_id = ?, access_token = ?, refresh_token = ?, token_expires_at = ?, profile_pic = ?, followers_count = ?, connected_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(accountName, accountId, access_token, refresh_token || null, expiresAt, profilePic, followersCount, existing.id);
    } else {
      db.prepare(`
        INSERT INTO social_accounts (user_id, platform, account_name, account_id, access_token, refresh_token, token_expires_at, profile_pic, followers_count)
        VALUES (?, 'twitter', ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, accountName, accountId, access_token, refresh_token || null, expiresAt, profilePic, followersCount);
    }

    return res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تم التفويض بنجاح - مَـدَار</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #0b1120; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 28px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .icon { width: 68px; height: 68px; border-radius: 20px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 34px; margin: 0 auto 20px; }
          h2 { margin: 0 0 10px; font-size: 20px; font-weight: 900; }
          p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; }
          .badge { display: inline-block; margin-top: 15px; padding: 6px 14px; border-radius: 100px; background: #0f172a; border: 1px solid #334155; color: #38bdf8; font-size: 11px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>تم ربط حساب منصة X بنجاح! 🎉</h2>
          <p>تم استلام مفاتيح التفويض الرسمية وحفظ الحساب <strong>(${accountName} - @${accountId})</strong> في منصة مَـدَار. سيتم إغلاق النافذة وتحديث لوحة التحكم تلقائياً...</p>
          <div class="badge">X API v2 OAuth 2.0 PKCE • Connected</div>
        </div>
        <script>
          try {
            localStorage.setItem('madaar_oauth_success', JSON.stringify({ platform: 'twitter', timestamp: Date.now() }));
          } catch(e) {}
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'MADAAR_OAUTH_SUCCESS', platform: 'twitter' }, '*');
            setTimeout(function() { window.close(); }, 1200);
          } else {
            setTimeout(function() { window.location.href = 'https://madaar.jooart.uk/accounts?connected=twitter'; }, 1000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Twitter OAuth Callback Error:', err.response?.data || err.message);
    const msg = err.response?.data?.error_description || err.response?.data?.detail || err.message;
    return res.status(500).send(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><meta charset="utf-8"><title>خطأ في التفويض</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
        <h3 style="color: #f43f5e;">حدث خطأ أثناء الاتصال بسيرفر X (Twitter)</h3>
        <p style="color: #94a3b8;">${msg}</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 24px; border-radius: 12px; background: #334155; color: white; border: none; cursor: pointer;">إغلاق</button>
      </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/privacy
 */
router.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8"><title>سياسة الخصوصية - مَـدَار</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;color:#f8fafc;font-family:system-ui;padding:40px;max-width:800px;margin:0 auto;line-height:1.7;}h1,h2{color:#38bdf8;}a{color:#818cf8;}</style></head>
    <body>
      <h1>سياسة الخصوصية - منصة مَـدَار (Madaar)</h1>
      <p>تاريخ السريان: 2026</p>
      <h2>1. البيانات التي نجمعها</h2>
      <p>تجمع منصة مَـدَار فقط البيانات الضرورية لجدولة المنشورات وإدارتها عبر منصات التواصل الاجتماعي (Facebook, Instagram, X, LinkedIn, TikTok, YouTube). نحن لا نطلع على كلمات المرور ولا نشارك بياناتك مع أي طرف ثالث.</p>
      <h2>2. صلاحيات فيسبوك وإنستغرام (Meta Graph API)</h2>
      <p>يطلب تطبيق مَـدَار صلاحيات إدارة الصفحات ونشر المحتوى فقط بناءً على موافقتك الصريحة، وتُستخدم الرموز المشفرة حصراً لتنفيذ الجدولة التي قمت بإعدادها بنفسك.</p>
      <h2>3. حذف البيانات</h2>
      <p>يمكنك حذف بياناتك وحسابك وإلغاء التفويض في أي وقت من خلال لوحة تحكم مَـدَار أو بمراسلتنا على: support@jooart.uk.</p>
    </body>
    </html>
  `);
});

/**
 * GET /api/auth/data-deletion
 */
router.get('/data-deletion', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8"><title>تعليمات حذف البيانات - مَـدَار</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;color:#f8fafc;font-family:system-ui;padding:40px;max-width:800px;margin:0 auto;line-height:1.7;}h1,h2{color:#38bdf8;}</style></head>
    <body>
      <h1>تعليمات حذف البيانات (User Data Deletion) - مَـدَار</h1>
      <p>وفقاً لسياسات Meta وGDPR، يمكنك طلب حذف كافة بيانات حسابك والرموز المرتبطة بصفحات فيسبوك وإنستغرام في أي وقت باتباع الخطوات التالية:</p>
      <ol>
        <li>تسجيل الدخول إلى حسابك في مَـدَار والانتقال إلى صفحة "الحسابات المتصلة".</li>
        <li>الضغط على زر "فصل الحساب (Disconnect)" بجوار فيسبوك لحذف الرموز فورياً من قواعد بياناتنا.</li>
        <li>أو يمكنك إرسال بريد إلكتروني إلى: support@jooart.uk لحذف الحساب بالكامل خلال 24 ساعة.</li>
      </ol>
    </body>
    </html>
  `);
});

module.exports = router;
