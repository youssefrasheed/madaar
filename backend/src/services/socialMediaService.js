/**
 * Social Media Service
 * Handles integration with Facebook, Instagram, Twitter (X), LinkedIn, TikTok, YouTube, and Snapchat.
 * Currently uses simulated/mock responses for development without live API keys,
 * with comments indicating real OAuth endpoints and SDK methods.
 */

const axios = require('axios');

const SUPPORTED_PLATFORMS = [
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
  'snapchat'
];

class SocialMediaService {
  /**
   * Check if a platform is supported
   */
  isSupported(platform) {
    return SUPPORTED_PLATFORMS.includes(platform?.toLowerCase());
  }

  /**
   * Inspect and auto-fetch real account data from platform API using Access Token
   */
  async fetchAccountInfoFromApi(platform, token, extra = {}) {
    const p = platform.toLowerCase();
    if (!token || !token.trim()) {
      throw new Error('رمز الـ API / Access Token مطلوب');
    }

    const cleanToken = token.trim();

    // 1. Meta Facebook Graph API
    if (p === 'facebook') {
      try {
        const target = extra.page_id 
          ? `https://graph.facebook.com/v19.0/${extra.page_id}` 
          : `https://graph.facebook.com/v19.0/me`;
        const res = await axios.get(target, {
          params: {
            fields: 'id,name,picture.width(200).height(200),followers_count,fan_count,username',
            access_token: cleanToken
          },
          timeout: 6000
        });
        const data = res.data;
        return {
          platform: 'facebook',
          account_name: data.name || 'صفحة فيسبوك الرسمية',
          account_id: data.username ? `@${data.username}` : (data.id || 'facebook_page'),
          followers_count: data.followers_count || data.fan_count || 0,
          profile_pic: data.picture?.data?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.id || 'fb'}`,
          verified: true
        };
      } catch (err) {
        if (cleanToken.startsWith('EAAB') || cleanToken.startsWith('EAA')) {
          throw new Error('رمز Meta Graph API غير صالح أو انتهت صلاحيته: ' + (err.response?.data?.error?.message || err.message));
        }
      }
    }

    // 2. Instagram Graph API
    if (p === 'instagram') {
      try {
        const res = await axios.get(`https://graph.facebook.com/v19.0/me`, {
          params: {
            fields: 'id,username,name,profile_picture_url,followers_count',
            access_token: cleanToken
          },
          timeout: 6000
        });
        const data = res.data;
        return {
          platform: 'instagram',
          account_name: data.name || data.username || 'Instagram Professional',
          account_id: `@${data.username || data.id}`,
          followers_count: data.followers_count || 0,
          profile_pic: data.profile_picture_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.id || 'ig'}`,
          verified: true
        };
      } catch (err) {
        if (cleanToken.startsWith('IGQ') || cleanToken.startsWith('EAA')) {
          throw new Error('رمز Instagram API غير صالح: ' + (err.response?.data?.error?.message || err.message));
        }
      }
    }

    // 3. Twitter / X API v2
    if (p === 'twitter') {
      try {
        const res = await axios.get('https://api.twitter.com/2/users/me', {
          headers: { Authorization: `Bearer ${cleanToken}` },
          params: { 'user.fields': 'profile_image_url,public_metrics,username,name' },
          timeout: 6000
        });
        const u = res.data.data;
        if (u) {
          return {
            platform: 'twitter',
            account_name: u.name,
            account_id: `@${u.username}`,
            followers_count: u.public_metrics?.followers_count || 0,
            profile_pic: u.profile_image_url?.replace('_normal', '') || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`,
            verified: true
          };
        }
      } catch (err) {
        if (cleanToken.length > 40) {
          throw new Error('رمز Twitter Bearer Token غير صالح');
        }
      }
    }

    // 4. LinkedIn API
    if (p === 'linkedin') {
      try {
        const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${cleanToken}` },
          timeout: 6000
        });
        return {
          platform: 'linkedin',
          account_name: res.data.name || `${res.data.given_name} ${res.data.family_name}`,
          account_id: `@${res.data.sub || 'linkedin_company'}`,
          followers_count: 0,
          profile_pic: res.data.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=linkedin`,
          verified: true
        };
      } catch (err) {
        if (cleanToken.startsWith('AQ')) {
          throw new Error('رمز LinkedIn Access Token غير صالح');
        }
      }
    }

    // 5. YouTube Data API v3
    if (p === 'youtube') {
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'snippet,statistics', mine: 'true' },
          headers: { Authorization: `Bearer ${cleanToken}` },
          timeout: 6000
        });
        const ch = res.data.items?.[0];
        if (ch) {
          return {
            platform: 'youtube',
            account_name: ch.snippet.title,
            account_id: ch.snippet.customUrl || `@${ch.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
            followers_count: Number(ch.statistics.subscriberCount) || 0,
            profile_pic: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
            verified: true
          };
        }
      } catch (err) {
        if (cleanToken.startsWith('ya29.')) {
          throw new Error('رمز Google OAuth Token غير صالح أو انتهت صلاحيته');
        }
      }
    }

    // Smart fallback / simulated preview for test tokens
    const company = extra.company_name || 'Midmac Almasharee';
    return {
      platform: p,
      account_name: `${company} (${p.toUpperCase()})`,
      account_id: `@${company.toLowerCase().replace(/\s+/g, '_')}_${p}`,
      followers_count: 0,
      profile_pic: `https://api.dicebear.com/7.x/identicon/svg?seed=${p}_${cleanToken.slice(0, 6)}`,
      verified: true
    };
  }

  /**
   * Connect an account for a platform
   * Real implementation would exchange an OAuth code for access & refresh tokens
   */
  async connectAccount(platform, authPayload = {}) {
    const p = platform.toLowerCase();
    if (!this.isSupported(p)) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    /*
     * REAL IMPLEMENTATION NOTES:
     * - Facebook / Instagram: Exchange code via Graph API:
     *   https://graph.facebook.com/v19.0/oauth/access_token?client_id=...&client_secret=...&code=...
     * - Twitter (X): OAuth 2.0 PKCE token exchange:
     *   POST https://api.twitter.com/2/oauth2/token
     * - LinkedIn: OAuth 2.0 token endpoint:
     *   POST https://www.linkedin.com/oauth/v2/accessToken
     * - TikTok: POST https://open.tiktokapis.com/v2/oauth/token/
     * - YouTube (Google): POST https://oauth2.googleapis.com/token
     * - Snapchat: POST https://accounts.snapchat.com/login/oauth2/access_token
     */

    const accountName = authPayload.account_name || `${p}_account`;
    const accountId = authPayload.account_id || `${p}_${Date.now()}`;
    const followers = authPayload.followers_count !== undefined 
      ? Number(authPayload.followers_count) 
      : 0;

    return {
      platform: p,
      account_name: accountName,
      account_id: accountId,
      access_token: authPayload.access_token || `token_${p}_${Date.now()}`,
      refresh_token: authPayload.refresh_token || `refresh_${p}_${Date.now()}`,
      token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      profile_pic: authPayload.profile_pic || `https://api.dicebear.com/7.x/identicon/svg?seed=${accountId}`,
      followers_count: followers
    };
  }

  /**
   * Publish a post to a platform
   */
  async publishPost(platform, account, postData) {
    const p = platform.toLowerCase();
    if (!this.isSupported(p)) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    /*
     * REAL IMPLEMENTATION NOTES:
     * - Twitter: POST https://api.twitter.com/2/tweets { "text": postData.content }
     * - Facebook: POST https://graph.facebook.com/v19.0/{page-id}/feed { "message": postData.content }
     * - Instagram: Container creation + publish via Graph API
     * - LinkedIn: POST https://api.linkedin.com/v2/ugcPosts or /rest/posts
     * - TikTok: POST https://open.tiktokapis.com/v2/post/publish/video/init/
     * - YouTube: Videos.insert API via Googleapis
     * - Snapchat: Creative Kit / Marketing API
     */

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulated success response
    return {
      platform: p,
      platform_post_id: `${p}_pub_${Date.now()}`,
      status: 'published',
      published_at: new Date().toISOString(),
      url: `https://${p}.com/post/${Date.now()}`
    };
  }

  /**
   * Get live stats / analytics for an account
   */
  async getStats(platform, account) {
    const p = platform.toLowerCase();
    if (!this.isSupported(p)) {
      throw new Error(`Platform ${platform} is not supported`);
    }

    /*
     * REAL IMPLEMENTATION NOTES:
     * - In live production with approved OAuth developer apps, queries
     *   the platform's Graph/REST metrics API.
     * - Returns exact grounded follower count from the database with 0
     *   placeholder until live events/impressions are recorded.
     */

    const followers = account.followers_count || 0;

    return {
      platform: p,
      account_id: account.id,
      followers: followers,
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagement_rate: 0,
      synced_at: new Date().toISOString()
    };
  }
}

module.exports = new SocialMediaService();
