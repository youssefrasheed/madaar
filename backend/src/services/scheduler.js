const cron = require('node-cron');
const db = require('../db/database');
const socialMediaService = require('./socialMediaService');

class PostScheduler {
  constructor() {
    this.job = null;
  }

  start() {
    console.log('[Scheduler] Initializing automated post publishing cron job (every minute)...');

    // Run every minute: * * * * *
    this.job = cron.schedule('* * * * *', async () => {
      await this.checkAndPublishScheduledPosts();
    });

    // Run an initial check immediately on server startup
    this.checkAndPublishScheduledPosts().catch(err => {
      console.error('[Scheduler] Initial check error:', err);
    });
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('[Scheduler] Cron job stopped.');
    }
  }

  async checkAndPublishScheduledPosts() {
    const now = new Date().toISOString();

    try {
      // Find all scheduled posts whose time has arrived
      const scheduledPosts = db.prepare(`
        SELECT * FROM posts
        WHERE status = 'scheduled'
          AND scheduled_at IS NOT NULL
          AND scheduled_at <= ?
      `).all(now);

      if (scheduledPosts.length === 0) {
        return;
      }

      console.log(`[Scheduler] Found ${scheduledPosts.length} post(s) ready for publishing.`);

      for (const post of scheduledPosts) {
        const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms || '[]') : (post.platforms || []);
        console.log(`[Scheduler] Publishing post #${post.id} to platforms:`, platforms);

        const publishResults = [];

        for (const platform of platforms) {
          try {
            const account = db.prepare(`
              SELECT * FROM social_accounts WHERE user_id = ? AND platform = ? LIMIT 1
            `).get(post.user_id, platform);

            const result = await socialMediaService.publishPost(platform, account || {}, post);

            db.prepare(`
              INSERT INTO post_platform_results (post_id, platform, platform_post_id, status, published_at)
              VALUES (?, ?, ?, 'published', ?)
            `).run(post.id, platform, result.platform_post_id, now);

            publishResults.push({ platform, status: 'published' });
          } catch (pubErr) {
            console.error(`[Scheduler] Error publishing post #${post.id} to ${platform}:`, pubErr.message);

            db.prepare(`
              INSERT INTO post_platform_results (post_id, platform, status, error_message)
              VALUES (?, ?, 'failed', ?)
            `).run(post.id, platform, pubErr.message);

            publishResults.push({ platform, status: 'failed' });
          }
        }

        const allFailed = publishResults.length > 0 && publishResults.every(r => r.status === 'failed');
        const finalStatus = allFailed ? 'failed' : 'published';

        db.prepare(`
          UPDATE posts
          SET status = ?, published_at = ?
          WHERE id = ?
        `).run(finalStatus, now, post.id);

        console.log(`[Scheduler] Post #${post.id} successfully updated to status='${finalStatus}'.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error checking scheduled posts:', err);
    }
  }
}

module.exports = new PostScheduler();
