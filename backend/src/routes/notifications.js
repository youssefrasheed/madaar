const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

function ensureSampleNotifications(userId) {
  try {
    const count = db.prepare('SELECT count(*) as cnt FROM notifications WHERE user_id = ?').get(userId);
    if (count.cnt === 0) {
      const samples = [
        {
          platform: 'facebook',
          type: 'comment',
          title: 'تعليق جديد على صفحة فيسبوك',
          message: 'علّق م. كريم عبد العزيز: "ما شاء الله، هل الخدمة متوفرة للشركات الناشئة؟"',
          is_read: 0,
        },
        {
          platform: 'instagram',
          type: 'message',
          title: 'رسالة خاصة جديدة في Instagram Direct',
          message: 'أرسلت سارة المهندس استفساراً عن باقة إدارة الحسابات وعرض الأسعار.',
          is_read: 0,
        },
        {
          platform: 'linkedin',
          type: 'comment',
          title: 'تفاعل جديد على صفحة LinkedIn',
          message: 'كتب Dr. Ahmed Mansour: "خطوة ممتازة جداً نحو التحول الرقمي السلس 👏"',
          is_read: 0,
        },
        {
          platform: 'twitter',
          type: 'mention',
          title: 'إشارة (Mention) جديدة على X / تويتر',
          message: 'أشار إليك @khaled_tech في تغريدة بخصوص ميزات الجدولة التلقائية.',
          is_read: 1,
        },
        {
          platform: 'tiktok',
          type: 'comment',
          title: 'تعليق جديد على فيديو TikTok',
          message: 'علّق @nour_media: "الفيديو مفيد جداً! متى الجزء الثاني؟ 🔥"',
          is_read: 1,
        },
      ];

      const stmt = db.prepare(`
        INSERT INTO notifications (user_id, platform, type, title, message, is_read)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const s of samples) {
        stmt.run(userId, s.platform, s.type, s.title, s.message, s.is_read);
      }
    }
  } catch (e) {
    console.error('Error seeding notifications:', e);
  }
}

/**
 * GET /api/notifications
 * Get user notifications and unread count
 */
router.get('/', (req, res) => {
  try {
    ensureSampleNotifications(req.user.id);

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT count(*) as cnt FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id).cnt;

    return res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true, message: 'تم تحديد كافة الإشعارات كمقروءة' });
  } catch (err) {
    console.error('Mark read all error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark single notification as read
 */
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
