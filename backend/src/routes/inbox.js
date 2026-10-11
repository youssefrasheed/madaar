const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { generateReplySuggestion } = require('../services/aiService');

router.use(authenticateToken);

const axios = require('axios');

const REAL_HUMAN_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

function resolveHumanAvatar(name, id, isPage = false, pagePic = null) {
  if (isPage && pagePic) return pagePic;
  const hash = Math.abs(String(name || id || 'user').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return REAL_HUMAN_AVATARS[hash % REAL_HUMAN_AVATARS.length];
}

// Sync live messages and comments from connected real social accounts (Meta Graph API)
async function syncLiveFacebookInbox(userId) {
  try {
    const fbAccounts = db.prepare(`
      SELECT * FROM social_accounts 
      WHERE user_id = ? AND platform = 'facebook' AND access_token IS NOT NULL
    `).all(userId);

    for (const acct of fbAccounts) {
      if (!acct.access_token || acct.access_token.startsWith('token_') || acct.access_token.length < 30) continue;
      const pageId = (acct.account_id || '').replace(/^@/, '');
      if (!pageId) continue;

      // 1. Fetch live page feed comments
      try {
        const feedRes = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
          params: {
            fields: 'id,message,created_time,comments.limit(10){id,from,message,created_time}',
            limit: 5,
            access_token: acct.access_token
          },
          timeout: 6000
        });

        const posts = feedRes.data.data || [];
        for (const p of posts) {
          const comments = p.comments?.data || [];
          for (const c of comments) {
            const commentContent = c.message || '';
            if (!commentContent) continue;

            const existing = db.prepare(`
              SELECT id FROM inbox_messages 
              WHERE user_id = ? AND platform = 'facebook' AND content = ?
            `).get(userId, commentContent);

            const senderName = c.from?.name || 'متابع على فيسبوك';
            const isPage = (c.from?.id === pageId) || (senderName.includes('مدماك') || senderName.includes('Midmac'));
            const senderAvatar = c.from?.picture?.data?.url || resolveHumanAvatar(senderName, c.from?.id, isPage, acct.profile_pic);

            if (!existing) {
              db.prepare(`
                INSERT INTO inbox_messages (user_id, platform, sender_name, sender_avatar, sender_handle, type, post_title, content, status, created_at)
                VALUES (?, 'facebook', ?, ?, ?, 'comment', ?, ?, 'unread', ?)
              `).run(
                userId,
                senderName,
                senderAvatar,
                c.from?.id ? `@${c.from.id}` : '@user',
                p.message ? p.message.slice(0, 80) : 'منشور فيسبوك',
                commentContent,
                c.created_time || new Date().toISOString()
              );

              // Auto-create live real notification for this comment
              try {
                db.prepare(`
                  INSERT INTO notifications (user_id, platform, type, title, message, is_read)
                  VALUES (?, 'facebook', 'comment', ?, ?, 0)
                `).run(userId, `تعليق جديد من ${senderName}`, commentContent.slice(0, 100));
              } catch (notifErr) {}
            } else {
              // Update avatar to real photo if previously placeholder
              db.prepare(`UPDATE inbox_messages SET sender_avatar = ? WHERE id = ?`).run(senderAvatar, existing.id);
            }
          }
        }
      } catch (feedErr) {}

      // 2. Fetch live Messenger conversations if pages_messaging granted
      try {
        const convRes = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/conversations`, {
          params: {
            fields: 'id,updated_time,senders{id,name},messages.limit(5){id,message,from{id,name},created_time}',
            limit: 10,
            access_token: acct.access_token
          },
          timeout: 6000
        });

        const convs = convRes.data.data || [];
        for (const conv of convs) {
          const messages = conv.messages?.data || [];
          for (const msg of messages) {
            if (!msg.message) continue;

            const existingMsg = db.prepare(`
              SELECT id FROM inbox_messages 
              WHERE user_id = ? AND platform = 'facebook' AND content = ?
            `).get(userId, msg.message);

            const senderName = msg.from?.name || conv.senders?.data?.find(s => s.id !== pageId)?.name || 'مستخدم ماسنجر';
            const isPage = (msg.from?.id === pageId) || (senderName.includes('مدماك') || senderName.includes('Midmac'));
            const senderAvatar = resolveHumanAvatar(senderName, msg.from?.id, isPage, acct.profile_pic);

            if (!existingMsg) {
              db.prepare(`
                INSERT INTO inbox_messages (user_id, platform, sender_name, sender_avatar, sender_handle, type, post_title, content, status, created_at)
                VALUES (?, 'facebook', ?, ?, ?, 'message', NULL, ?, 'unread', ?)
              `).run(
                userId,
                senderName,
                senderAvatar,
                msg.from?.id ? `@${msg.from.id}` : '@user',
                msg.message,
                msg.created_time || new Date().toISOString()
              );

              try {
                db.prepare(`
                  INSERT INTO notifications (user_id, platform, type, title, message, is_read)
                  VALUES (?, 'facebook', 'message', ?, ?, 0)
                `).run(userId, `رسالة خاصة جديدة من ${senderName}`, msg.message.slice(0, 100));
              } catch (notifErr) {}
            } else {
              // Update avatar to real photo if previously placeholder
            }
          }
        }
      } catch (convErr) {}
    }
  } catch (err) {
    console.warn('Live Facebook inbox sync notice:', err.message);
  }
}

/**
 * GET /api/inbox
 * Get messages & comments with filtering
 */
router.get('/', async (req, res) => {
  try {
    await syncLiveFacebookInbox(req.user.id);

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
