const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const socialMediaService = require('../services/socialMediaService');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}-${basename}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// All post routes require authentication
router.use(authenticateToken);

/**
 * Helper: parse post JSON fields
 */
function formatPost(post, results = []) {
  return {
    ...post,
    media_urls: typeof post.media_urls === 'string' ? JSON.parse(post.media_urls || '[]') : (post.media_urls || []),
    platforms: typeof post.platforms === 'string' ? JSON.parse(post.platforms || '[]') : (post.platforms || []),
    platform_results: results
  };
}

/**
 * GET /api/posts
 * List posts with filters (status, platform, date range)
 */
router.get('/', (req, res) => {
  try {
    const { status, platform, from, to } = req.query;

    let query = 'SELECT * FROM posts WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (platform) {
      query += ' AND platforms LIKE ?';
      params.push(`%"${platform}"%`);
    }

    if (from) {
      query += ' AND (scheduled_at >= ? OR created_at >= ?)';
      params.push(from, from);
    }

    if (to) {
      query += ' AND (scheduled_at <= ? OR created_at <= ?)';
      params.push(to, to);
    }

    query += ' ORDER BY COALESCE(scheduled_at, created_at) DESC';

    const posts = db.prepare(query).all(...params);

    // Fetch platform results for these posts
    const postIds = posts.map(p => p.id);
    let resultsByPost = {};
    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const results = db.prepare(`
        SELECT * FROM post_platform_results WHERE post_id IN (${placeholders})
      `).all(...postIds);

      results.forEach(r => {
        if (!resultsByPost[r.post_id]) resultsByPost[r.post_id] = [];
        resultsByPost[r.post_id].push(r);
      });
    }

    const formatted = posts.map(p => formatPost(p, resultsByPost[p.id] || []));
    return res.json({ posts: formatted });
  } catch (err) {
    console.error('Fetch posts error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/posts/upload
 * Helper endpoint for uploading media files
 */
router.post('/upload', upload.array('media', 5), (req, res) => {
  try {
    const files = req.files || [];
    const urls = files.map(file => `/uploads/${file.filename}`);
    return res.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to upload media' });
  }
});

/**
 * POST /api/posts
 * Create new post (draft or scheduled)
 */
router.post('/', (req, res) => {
  try {
    const { content, media_urls = [], platforms = [], scheduled_at, status } = req.body;

    if (!content && (!media_urls || media_urls.length === 0)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Post must have content or media'
      });
    }

    // Determine status: 'scheduled' if scheduled_at provided, else 'draft' or requested status
    let postStatus = status || 'draft';
    if (scheduled_at && postStatus !== 'published') {
      postStatus = 'scheduled';
    }

    const insert = db.prepare(`
      INSERT INTO posts (user_id, content, media_urls, platforms, scheduled_at, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      content || '',
      JSON.stringify(Array.isArray(media_urls) ? media_urls : []),
      JSON.stringify(Array.isArray(platforms) ? platforms : []),
      scheduled_at || null,
      postStatus
    );

    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(insert.lastInsertRowid);
    return res.status(201).json({
      message: 'Post created successfully',
      post: formatPost(newPost)
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to create post' });
  }
});

/**
 * PUT /api/posts/:id
 * Update post
 */
router.put('/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: 'Not found', message: 'Post not found' });
    }

    const { content, media_urls, platforms, scheduled_at, status } = req.body;

    const updatedContent = content !== undefined ? content : post.content;
    const updatedMedia = media_urls !== undefined ? JSON.stringify(media_urls) : post.media_urls;
    const updatedPlatforms = platforms !== undefined ? JSON.stringify(platforms) : post.platforms;
    const updatedScheduledAt = scheduled_at !== undefined ? scheduled_at : post.scheduled_at;
    let updatedStatus = status !== undefined ? status : post.status;

    if (scheduled_at && updatedStatus === 'draft') {
      updatedStatus = 'scheduled';
    }

    db.prepare(`
      UPDATE posts
      SET content = ?, media_urls = ?, platforms = ?, scheduled_at = ?, status = ?
      WHERE id = ?
    `).run(
      updatedContent,
      updatedMedia,
      updatedPlatforms,
      updatedScheduledAt,
      updatedStatus,
      post.id
    );

    const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);
    const results = db.prepare('SELECT * FROM post_platform_results WHERE post_id = ?').all(post.id);

    return res.json({
      message: 'Post updated successfully',
      post: formatPost(updated, results)
    });
  } catch (err) {
    console.error('Update post error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to update post' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete post
 */
router.delete('/:id', (req, res) => {
  try {
    const post = db.prepare('SELECT id FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: 'Not found', message: 'Post not found' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);

    return res.json({
      message: 'Post deleted successfully',
      id: post.id
    });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to delete post' });
  }
});

/**
 * POST /api/posts/:id/publish
 * Publish post immediately to its selected platforms
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!post) {
      return res.status(404).json({ error: 'Not found', message: 'Post not found' });
    }

    const platforms = typeof post.platforms === 'string' ? JSON.parse(post.platforms || '[]') : (post.platforms || []);
    if (platforms.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No target platforms specified for this post'
      });
    }

    const now = new Date().toISOString();
    const results = [];

    // Publish to each platform using socialMediaService
    for (const platform of platforms) {
      try {
        const account = db.prepare(`
          SELECT * FROM social_accounts WHERE user_id = ? AND platform = ? LIMIT 1
        `).get(req.user.id, platform);

        const publishRes = await socialMediaService.publishPost(platform, account || {}, post);

        // Record in post_platform_results
        const insertRes = db.prepare(`
          INSERT INTO post_platform_results (post_id, platform, platform_post_id, status, published_at)
          VALUES (?, ?, ?, 'published', ?)
        `).run(post.id, platform, publishRes.platform_post_id, now);

        results.push({
          id: insertRes.lastInsertRowid,
          platform,
          platform_post_id: publishRes.platform_post_id,
          status: 'published',
          published_at: now
        });
      } catch (pubErr) {
        console.error(`Failed to publish to ${platform}:`, pubErr);
        db.prepare(`
          INSERT INTO post_platform_results (post_id, platform, status, error_message)
          VALUES (?, ?, 'failed', ?)
        `).run(post.id, platform, pubErr.message);

        results.push({
          platform,
          status: 'failed',
          error_message: pubErr.message
        });
      }
    }

    const allFailed = results.every(r => r.status === 'failed');
    const finalStatus = allFailed ? 'failed' : 'published';

    db.prepare(`
      UPDATE posts
      SET status = ?, published_at = ?
      WHERE id = ?
    `).run(finalStatus, now, post.id);

    const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);

    return res.json({
      message: `Post ${finalStatus === 'published' ? 'published successfully' : 'failed to publish'}`,
      post: formatPost(updated, results)
    });
  } catch (err) {
    console.error('Publish post error:', err);
    return res.status(500).json({ error: 'Server error', message: 'Failed to publish post' });
  }
});

module.exports = router;
