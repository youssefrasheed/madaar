const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const { send2FACode, sendPasswordResetCode } = require('../services/emailService');

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
    const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`;

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

module.exports = router;
