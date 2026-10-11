const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { generateReplySuggestion } = require('../services/aiService');

router.use(authenticateToken);

// Helper to seed initial sample inbox messages if user has none
function ensureSampleMessages(userId) {
  try {
    const count = db.prepare('SELECT count(*) as cnt FROM inbox_messages WHERE user_id = ?').get(userId);
    if (count.cnt === 0) {
      const samples = [
        {
          platform: 'facebook',
          type: 'comment',
          sender_name: 'م. كريم عبد العزيز',
          sender_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
          sender_handle: '@karim_abdelaziz',
          post_title: 'إطلاق باقة الأعمال المتكاملة للحلول الرقمية 🚀',
          content: 'ما شاء الله، هل الخدمة متوفرة للشركات الناشئة في السعودية ومصر؟ وكيف طريقة التواصل معكم للتعاقد؟',
          status: 'unread',
        },
        {
          platform: 'instagram',
          type: 'message',
          sender_name: 'سارة المهندس',
          sender_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
          sender_handle: '@sara_designs',
          post_title: null,
          content: 'مرحباً، أرسلت لكم استفسار بخصوص تفاصيل باقة إدارة الحسابات، هل يمكن إرسال عرض الأسعار (Portfolio)؟',
          status: 'unread',
        },
        {
          platform: 'linkedin',
          type: 'comment',
          sender_name: 'Dr. Ahmed Mansour',
          sender_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
          sender_handle: '@ahmedmansour_ceo',
          post_title: 'استراتيجيات التسويق الرقمي الحديثة لعام 2026',
          content: 'خطوة ممتازة جداً نحو التحول الرقمي السلس. تقرير رائع ومفيد جداً، بالتوفيق لفريق العمل 👏',
          status: 'unread',
        },
        {
          platform: 'twitter',
          type: 'comment',
          sender_name: 'خالد الشمري',
          sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
          sender_handle: '@khaled_tech',
          post_title: 'تحديثات منصة مَـدَار الذكية الجديدة',
          content: 'هل المنصة تدعم الجدولة التلقائية بالفيديو لمحتوى تيك توك ويوتيوب شورتس في نفس الوقت؟',
          status: 'unread',
        },
        {
          platform: 'tiktok',
          type: 'comment',
          sender_name: 'نور الدين ميديا',
          sender_avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120',
          sender_handle: '@nour_media',
          post_title: 'أهم 5 نصائح لزيادة تفاعل حساباتك بنسبة 300%',
          content: 'الفيديو مفيد جداً! متى حينزل الجزء الثاني بخصوص الخوارزميات؟ 🔥',
          status: 'unread',
        },
        {
          platform: 'youtube',
          type: 'comment',
          sender_name: 'عالم التقنية العربي',
          sender_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          sender_handle: '@tech_arabic',
          post_title: 'دليل إدارة منصات التواصل للشركات من شاشة واحدة',
          content: 'شرح وافي ومبسط جداً، شكراً جزيلاً! هل يمكن عمل فيديو تفصيلي عن الـ API الخاص بربط فيسبوك ولينكدإن؟',
          status: 'read',
        },
        {
          platform: 'facebook',
          type: 'message',
          sender_name: 'محمد العوضي',
          sender_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120',
          sender_handle: '@mohamed_awadi',
          post_title: null,
          content: 'السلام عليكم، هل يوجد دعم فني مخصص للمؤسسات الكبيرة عبر الهاتف أو الواتساب لمتابعة الحملات اليومية؟',
          status: 'read',
        },
      ];

      const stmt = db.prepare(`
        INSERT INTO inbox_messages (user_id, platform, sender_name, sender_avatar, sender_handle, type, post_title, content, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const s of samples) {
        stmt.run(userId, s.platform, s.sender_name, s.sender_avatar, s.sender_handle, s.type, s.post_title, s.content, s.status);
      }
    }
  } catch (e) {
    console.error('Error seeding sample inbox messages:', e);
  }
}

/**
 * GET /api/inbox
 * Get messages & comments with filtering
 */
router.get('/', (req, res) => {
  try {
    ensureSampleMessages(req.user.id);

    const { platform, type, status, search } = req.query;

    let query = `
      SELECT 
        m.*,
        (SELECT count(*) FROM inbox_replies r WHERE r.message_id = m.id) as replies_count
      FROM inbox_messages m
      WHERE m.user_id = ?
    `;
    const params = [req.user.id];

    if (platform && platform !== 'all') {
      query += ` AND m.platform = ?`;
      params.push(platform.toLowerCase());
    }

    if (type && type !== 'all') {
      query += ` AND m.type = ?`;
      params.push(type);
    }

    if (status && status !== 'all') {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      query += ` AND (m.sender_name LIKE ? OR m.content LIKE ? OR m.sender_handle LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY m.created_at DESC`;

    const messages = db.prepare(query).all(...params);

    // Fetch replies for each message
    const messageIds = messages.map(m => m.id);
    let allReplies = [];
    if (messageIds.length > 0) {
      const placeholders = messageIds.map(() => '?').join(',');
      allReplies = db.prepare(`
        SELECT id, message_id, reply_text, created_at 
        FROM inbox_replies 
        WHERE message_id IN (${placeholders})
        ORDER BY created_at ASC
      `).all(...messageIds);
    }

    const messagesWithReplies = messages.map(m => ({
      ...m,
      replies: allReplies.filter(r => r.message_id === m.id)
    }));

    // Stats
    const totalCount = db.prepare('SELECT count(*) as cnt FROM inbox_messages WHERE user_id = ?').get(req.user.id).cnt;
    const unreadCount = db.prepare(`SELECT count(*) as cnt FROM inbox_messages WHERE user_id = ? AND status = 'unread'`).get(req.user.id).cnt;
    const commentsCount = db.prepare(`SELECT count(*) as cnt FROM inbox_messages WHERE user_id = ? AND type = 'comment'`).get(req.user.id).cnt;
    const messagesCount = db.prepare(`SELECT count(*) as cnt FROM inbox_messages WHERE user_id = ? AND type = 'message'`).get(req.user.id).cnt;

    return res.json({
      messages: messagesWithReplies,
      stats: {
        total: totalCount,
        unread: unreadCount,
        comments: commentsCount,
        messages: messagesCount
      }
    });
  } catch (err) {
    console.error('Fetch inbox error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to retrieve inbox messages' });
  }
});

/**
 * POST /api/inbox/:id/reply
 * Send reply to a comment or direct message
 */
router.post('/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { reply_text } = req.body;

    if (!reply_text || !reply_text.trim()) {
      return res.status(400).json({ error: 'Validation error', message: 'Reply text is required' });
    }

    const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!message) {
      return res.status(404).json({ error: 'Not found', message: 'Message not found' });
    }

    // Insert reply record
    const insert = db.prepare(`
      INSERT INTO inbox_replies (message_id, user_id, reply_text)
      VALUES (?, ?, ?)
    `).run(id, req.user.id, reply_text.trim());

    // Update message status to 'replied'
    db.prepare(`UPDATE inbox_messages SET status = 'replied' WHERE id = ?`).run(id);

    const reply = db.prepare('SELECT * FROM inbox_replies WHERE id = ?').get(insert.lastInsertRowid);

    console.log(`[Inbox] Published reply to ${message.platform} (${message.type}): "${reply_text.trim()}"`);

    return res.json({
      message: 'تم إرسال الرد بنجاح!',
      reply,
      status: 'replied'
    });
  } catch (err) {
    console.error('Send reply error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to send reply' });
  }
});

/**
 * PUT /api/inbox/:id/status
 * Mark message as read/unread
 */
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'read' | 'unread'

    const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!message) {
      return res.status(404).json({ error: 'Not found' });
    }

    db.prepare(`UPDATE inbox_messages SET status = ? WHERE id = ?`).run(status || 'read', id);
    return res.json({ success: true, status: status || 'read' });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/inbox/:id/ai-suggestions
 * Generate smart replies using Google Gemini AI
 */
router.post('/:id/ai-suggestions', async (req, res) => {
  try {
    const { id } = req.params;
    const { tone } = req.body; // 'friendly' | 'professional' | 'sales' | 'support'

    const message = db.prepare('SELECT * FROM inbox_messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!message) {
      return res.status(404).json({ error: 'Not found' });
    }

    const suggestions = await generateReplySuggestion(message.content, message.sender_name, message.platform, tone || 'friendly');
    return res.json({ suggestions });
  } catch (err) {
    console.error('AI suggestions error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to generate AI suggestions' });
  }
});

module.exports = router;
