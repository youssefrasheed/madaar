/**
 * AI Routes — /api/ai/*
 * كل الـ endpoints الخاصة بالذكاء الاصطناعي
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  analyzePostingTimes,
  generateContentSuggestions,
  optimizePost,
  generateWeeklyPlan,
  generateAnalyticsInsights,
  chatWithAssistant,
  clearChatSession,
} = require('../services/aiService');

// All routes require authentication
router.use(auth);

// ─── GET /api/ai/posting-times ────────────────────────────────────────────────
// أفضل مواعيد النشر لمنصة معينة
// Query: platform, timezone
router.get('/posting-times', async (req, res) => {
  try {
    const { platform = 'instagram', timezone = 'Africa/Cairo' } = req.query;
    const db = req.app.get('db');

    // Fetch real analytics data if available
    let analyticsData = [];
    try {
      const account = db.prepare(`
        SELECT sa.id FROM social_accounts sa
        WHERE sa.user_id = ? AND sa.platform = ? LIMIT 1
      `).get(req.user.id, platform);

      if (account) {
        analyticsData = db.prepare(`
          SELECT date, engagement_rate, impressions, reach, likes, comments, shares
          FROM analytics_snapshots
          WHERE social_account_id = ?
          ORDER BY date DESC LIMIT 30
        `).all(account.id);
      }
    } catch (dbErr) {
      console.warn('[AI Route] Could not fetch analytics:', dbErr.message);
    }

    const result = await analyzePostingTimes(analyticsData, platform, timezone);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/ai/posting-times/all ───────────────────────────────────────────
// أفضل مواعيد النشر لكل المنصات مرة واحدة
router.get('/posting-times/all', async (req, res) => {
  try {
    const { timezone = 'Africa/Cairo' } = req.query;
    const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'snapchat'];

    // Run all platforms in parallel
    const results = await Promise.allSettled(
      platforms.map(p => analyzePostingTimes([], p, timezone))
    );

    const data = {};
    platforms.forEach((p, i) => {
      data[p] = results[i].status === 'fulfilled' ? results[i].value : { error: 'Failed', platform: p };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/ai/content-suggestions ────────────────────────────────────────
// اقتراحات محتوى
// Body: { platform, niche, tone, language, recentTopics, count }
router.post('/content-suggestions', async (req, res) => {
  try {
    const {
      platform = 'instagram',
      niche = 'general',
      tone = 'casual',
      language = 'ar',
      recentTopics = [],
      count = 5,
    } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, error: 'platform is required' });
    }

    const suggestions = await generateContentSuggestions({
      platform, niche, tone, language, recentTopics, count: Math.min(count, 10),
    });

    res.json({ success: true, data: suggestions, count: suggestions.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/ai/optimize-post ───────────────────────────────────────────────
// تحسين البوست
// Body: { content, platform, goal }
router.post('/optimize-post', async (req, res) => {
  try {
    const { content, platform = 'instagram', goal = 'engagement' } = req.body;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Content is too short' });
    }

    const result = await optimizePost(content, platform, goal);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/ai/weekly-plan ─────────────────────────────────────────────────
// خطة محتوى أسبوعية
// Body: { platforms, niche, weekStart, postsPerDay }
router.post('/weekly-plan', async (req, res) => {
  try {
    const {
      platforms = ['instagram', 'facebook'],
      niche = 'general',
      weekStart = new Date().toISOString().split('T')[0],
      postsPerDay = 2,
    } = req.body;

    const plan = await generateWeeklyPlan({ platforms, niche, weekStart, postsPerDay });
    res.json({ success: true, data: plan, days: plan.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/ai/insights ─────────────────────────────────────────────────────
// تحليل ورؤى ذكية من البيانات
// Query: period (daily|weekly|monthly)
router.get('/insights', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const db = req.app.get('db');

    // Fetch analytics data for this user
    let analyticsData = {};
    try {
      const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
      const snapshots = db.prepare(`
        SELECT 
          sa.platform,
          AVG(ans.engagement_rate) as avg_engagement,
          SUM(ans.impressions) as total_impressions,
          SUM(ans.reach) as total_reach,
          SUM(ans.likes) as total_likes,
          MAX(sa.followers_count) as followers
        FROM analytics_snapshots ans
        JOIN social_accounts sa ON ans.social_account_id = sa.id
        WHERE sa.user_id = ?
          AND ans.date >= date('now', '-' || ? || ' days')
        GROUP BY sa.platform
      `).all(req.user.id, days);

      analyticsData = {
        period,
        platforms: snapshots,
        postsCount: db.prepare(`
          SELECT COUNT(*) as count FROM posts
          WHERE user_id = ? AND published_at >= datetime('now', '-' || ? || ' days')
        `).get(req.user.id, days)?.count || 0,
      };
    } catch (dbErr) {
      // Use mock data if DB query fails
      analyticsData = { period, platforms: [], note: 'Using sample data' };
    }

    const insights = await generateAnalyticsInsights(analyticsData, period);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// محادثة مع المساعد الذكي
// Body: { message, accountContext }
router.post('/chat', async (req, res) => {
  try {
    const { message, accountContext = {} } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const result = await chatWithAssistant(req.user.id, message, accountContext);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DELETE /api/ai/chat ──────────────────────────────────────────────────────
// مسح تاريخ المحادثة
router.delete('/chat', (req, res) => {
  clearChatSession(req.user.id);
  res.json({ success: true, message: 'Chat session cleared' });
});

module.exports = router;
