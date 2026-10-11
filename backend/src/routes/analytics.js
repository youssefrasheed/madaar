const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// All analytics routes require authentication
router.use(authenticateToken);

/**
 * GET /api/analytics/overview
 * Overall stats across all user accounts
 */
router.get('/overview', (req, res) => {
  try {
    const userId = req.user.id;

    // Get accounts count & total followers
    const accounts = db.prepare(`
      SELECT id, platform, account_name, followers_count, profile_pic
      FROM social_accounts
      WHERE user_id = ?
    `).all(userId);

    const accountIds = accounts.map(a => a.id);

    if (accountIds.length === 0) {
      return res.json({
        totalFollowers: 0,
        totalAccounts: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        platformBreakdown: [],
        recentTrends: { followersGrowth: 0, impressionsGrowth: 0 }
      });
    }

    const placeholders = accountIds.map(() => '?').join(',');

    // Total followers sum
    const totalFollowers = accounts.reduce((acc, curr) => acc + (curr.followers_count || 0), 0);

    // Sum last 30 days metrics
    const totals = db.prepare(`
      SELECT 
        SUM(impressions) as totalImpressions,
        SUM(reach) as totalReach,
        SUM(likes) as totalLikes,
        SUM(comments) as totalComments,
        SUM(shares) as totalShares,
        AVG(engagement_rate) as avgEngagementRate
      FROM analytics_snapshots
      WHERE social_account_id IN (${placeholders})
    `).get(...accountIds);

    // Platform breakdown
    const platformBreakdown = db.prepare(`
      SELECT 
        sa.platform,
        SUM(sa.followers_count) as followers,
        SUM(COALESCE(ans.impressions, 0)) as impressions,
        SUM(COALESCE(ans.likes, 0) + COALESCE(ans.comments, 0) + COALESCE(ans.shares, 0)) as engagements
      FROM social_accounts sa
      LEFT JOIN analytics_snapshots ans ON sa.id = ans.social_account_id
      WHERE sa.user_id = ?
      GROUP BY sa.platform
    `).all(userId);

    // Posts count by status
    const postStats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM posts
      WHERE user_id = ?
      GROUP BY status
    `).all(userId);

    const totalEngagement = (totals.totalLikes || 0) + (totals.totalComments || 0) + (totals.totalShares || 0);

    return res.json({
      totalFollowers,
      totalAccounts: accounts.length,
      totalImpressions: totals.totalImpressions || 0,
      totalReach: totals.totalReach || 0,
      totalEngagement,
      avgEngagementRate: Number((totals.avgEngagementRate || 0).toFixed(2)),
      platformBreakdown,
      postStats,
      accounts
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch analytics overview' });
  }
});

/**
 * GET /api/analytics/daily
 * Daily breakdown for the last 30 days
 */
router.get('/daily', (req, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.query;

    let query = `
      SELECT 
        ans.date,
        SUM(ans.impressions) as impressions,
        SUM(ans.reach) as reach,
        SUM(ans.likes) as likes,
        SUM(ans.comments) as comments,
        SUM(ans.shares) as shares,
        SUM(ans.followers) as followers,
        AVG(ans.engagement_rate) as engagement_rate
      FROM analytics_snapshots ans
      JOIN social_accounts sa ON ans.social_account_id = sa.id
      WHERE sa.user_id = ?
    `;

    const params = [userId];

    if (platform) {
      query += ` AND sa.platform = ?`;
      params.push(platform);
    }

    query += `
      GROUP BY ans.date
      ORDER BY ans.date ASC
      LIMIT 30
    `;

    const daily = db.prepare(query).all(...params);

    return res.json({ daily });
  } catch (err) {
    console.error('Daily analytics error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch daily analytics' });
  }
});

/**
 * GET /api/analytics/weekly
 * Weekly aggregated summary
 */
router.get('/weekly', (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate by week (SQLite strftime('%Y-%W', date))
    const weekly = db.prepare(`
      SELECT 
        strftime('%Y-W%W', ans.date) as week,
        MIN(ans.date) as start_date,
        MAX(ans.date) as end_date,
        SUM(ans.impressions) as impressions,
        SUM(ans.reach) as reach,
        SUM(ans.likes) as likes,
        SUM(ans.comments) as comments,
        SUM(ans.shares) as shares,
        AVG(ans.engagement_rate) as avg_engagement_rate
      FROM analytics_snapshots ans
      JOIN social_accounts sa ON ans.social_account_id = sa.id
      WHERE sa.user_id = ?
      GROUP BY week
      ORDER BY week ASC
    `).all(userId);

    return res.json({ weekly });
  } catch (err) {
    console.error('Weekly analytics error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch weekly analytics' });
  }
});

/**
 * GET /api/analytics/accounts/:id
 * Per-account detailed analytics
 */
router.get('/accounts/:id', (req, res) => {
  try {
    const account = db.prepare(`
      SELECT * FROM social_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'Not found', message: 'Account not found' });
    }

    const history = db.prepare(`
      SELECT date, followers, following, posts_count, engagement_rate, impressions, reach, likes, comments, shares
      FROM analytics_snapshots
      WHERE social_account_id = ?
      ORDER BY date ASC
    `).all(account.id);

    const totals = db.prepare(`
      SELECT 
        SUM(impressions) as total_impressions,
        SUM(reach) as total_reach,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares,
        AVG(engagement_rate) as avg_engagement_rate
      FROM analytics_snapshots
      WHERE social_account_id = ?
    `).get(account.id);

    return res.json({
      account,
      totals,
      history
    });
  } catch (err) {
    console.error('Account analytics error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch account analytics' });
  }
});

module.exports = router;
