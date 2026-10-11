const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const socialMediaService = require('../services/socialMediaService');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/accounts
 * List all connected accounts for the current user
 */
router.get('/', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT 
        id, platform, account_name, account_id, 
        token_expires_at, profile_pic, followers_count, connected_at
      FROM social_accounts
      WHERE user_id = ?
      ORDER BY platform ASC
    `).all(req.user.id);

    return res.json({ accounts });
  } catch (err) {
    console.error('Fetch accounts error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to retrieve accounts' });
  }
});

/**
 * POST /api/accounts
 * Connect new social account
 */
router.post('/', async (req, res) => {
  try {
    const { platform, account_name, account_id, access_token, refresh_token, profile_pic, followers_count } = req.body;

    if (!platform) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Platform is required'
      });
    }

    if (!socialMediaService.isSupported(platform)) {
      return res.status(400).json({
        error: 'Unsupported platform',
        message: `Platform '${platform}' is not supported.`
      });
    }

    // Connect via service (handles simulated or oauth logic)
    const mockAuth = await socialMediaService.connectAccount(platform, {
      account_name,
      account_id,
      access_token,
      refresh_token,
      profile_pic,
      followers_count
    });

    // Check if account already connected
    const existing = db.prepare(`
      SELECT id FROM social_accounts
      WHERE user_id = ? AND platform = ? AND account_id = ?
    `).get(req.user.id, mockAuth.platform, mockAuth.account_id);

    let accountId;
    if (existing) {
      // Update existing connection tokens
      db.prepare(`
        UPDATE social_accounts
        SET account_name = ?, access_token = ?, refresh_token = ?, profile_pic = ?, followers_count = ?, connected_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(mockAuth.account_name, mockAuth.access_token, mockAuth.refresh_token, mockAuth.profile_pic, mockAuth.followers_count, existing.id);
      accountId = existing.id;
    } else {
      // Insert new account
      const insert = db.prepare(`
        INSERT INTO social_accounts (
          user_id, platform, account_name, account_id, access_token, refresh_token, token_expires_at, profile_pic, followers_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        mockAuth.platform,
        mockAuth.account_name,
        mockAuth.account_id,
        mockAuth.access_token,
        mockAuth.refresh_token,
        mockAuth.token_expires_at,
        mockAuth.profile_pic,
        mockAuth.followers_count
      );
      accountId = insert.lastInsertRowid;

      // Create a fresh analytics snapshot for today
      const today = new Date().toISOString().split('T')[0];
      const stats = await socialMediaService.getStats(mockAuth.platform, { id: accountId, followers_count: mockAuth.followers_count });
      db.prepare(`
        INSERT OR REPLACE INTO analytics_snapshots (
          social_account_id, date, followers, following, posts_count, engagement_rate, impressions, reach, likes, comments, shares, platform_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        accountId,
        today,
        stats.followers,
        Math.floor(stats.followers * 0.1),
        1,
        stats.engagement_rate,
        stats.impressions,
        stats.reach,
        stats.likes,
        stats.comments,
        stats.shares,
        JSON.stringify({ platform: mockAuth.platform })
      );
    }

    const savedAccount = db.prepare(`
      SELECT id, platform, account_name, account_id, profile_pic, followers_count, connected_at
      FROM social_accounts
      WHERE id = ?
    `).get(accountId);

    return res.status(201).json({
      message: 'Social account connected successfully',
      account: savedAccount
    });
  } catch (err) {
    console.error('Connect account error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to connect account' });
  }
});

/**
 * DELETE /api/accounts/:id
 * Disconnect a social account
 */
router.delete('/:id', (req, res) => {
  try {
    const account = db.prepare(`
      SELECT id FROM social_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'Not found', message: 'Account not found' });
    }

    db.prepare('DELETE FROM social_accounts WHERE id = ?').run(account.id);

    return res.json({
      message: 'Account disconnected successfully',
      id: account.id
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to disconnect account' });
  }
});

/**
 * GET /api/accounts/:id/stats
 * Get analytics & latest metrics for account
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const account = db.prepare(`
      SELECT * FROM social_accounts WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!account) {
      return res.status(404).json({ error: 'Not found', message: 'Account not found' });
    }

    // Get 30-day historical snapshots
    const snapshots = db.prepare(`
      SELECT date, followers, following, posts_count, engagement_rate, impressions, reach, likes, comments, shares
      FROM analytics_snapshots
      WHERE social_account_id = ?
      ORDER BY date ASC
    `).all(account.id);

    // Compute live/current metrics
    const currentStats = await socialMediaService.getStats(account.platform, account);

    return res.json({
      account: {
        id: account.id,
        platform: account.platform,
        account_name: account.account_name,
        profile_pic: account.profile_pic,
        followers_count: account.followers_count
      },
      current: currentStats,
      history: snapshots
    });
  } catch (err) {
    console.error('Get account stats error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch account stats' });
  }
});

module.exports = router;
