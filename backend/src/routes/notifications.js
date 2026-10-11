const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

/**
 * GET /api/notifications
 * Get user notifications and unread count
 */
router.get('/', (req, res) => {
  try {

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
