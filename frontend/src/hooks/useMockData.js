import { useState, useEffect } from 'react';

const INITIAL_ACCOUNTS = [
  {
    id: 'fb-1',
    platform: 'facebook',
    name: 'SocialHub Tech Page',
    handle: '@socialhubtech',
    followers: 124500,
    following: 382,
    postsCount: 1420,
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    characterLimit: 63206,
  },
  {
    id: 'ig-1',
    platform: 'instagram',
    name: 'SocialHub Official',
    handle: '@socialhub_hq',
    followers: 248900,
    following: 615,
    postsCount: 890,
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    characterLimit: 2200,
  },
  {
    id: 'tw-1',
    platform: 'twitter',
    name: 'SocialHub',
    handle: '@socialhub',
    followers: 89400,
    following: 1104,
    postsCount: 4210,
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    characterLimit: 280,
  },
  {
    id: 'li-1',
    platform: 'linkedin',
    name: 'SocialHub Enterprise',
    handle: 'company/socialhub',
    followers: 67300,
    following: 195,
    postsCount: 520,
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    characterLimit: 3000,
  },
  {
    id: 'tt-1',
    platform: 'tiktok',
    name: 'SocialHub Creators',
    handle: '@socialhub_tok',
    followers: 312000,
    following: 140,
    postsCount: 315,
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    characterLimit: 2200,
  },
  {
    id: 'yt-1',
    platform: 'youtube',
    name: 'SocialHub Media',
    handle: '@SocialHubMedia',
    followers: 184000,
    following: 48,
    postsCount: 198,
    connected: false,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    characterLimit: 5000,
  },
  {
    id: 'sc-1',
    platform: 'snapchat',
    name: 'SocialHub Life',
    handle: '@socialhub_live',
    followers: 43200,
    following: 92,
    postsCount: 160,
    connected: false,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    characterLimit: 250,
  },
];

const INITIAL_POSTS = [
  {
    id: 'p-1',
    content: 'Excited to announce our new product update! Faster analytics, unified calendar, and seamless multi-channel publishing. 🚀✨ #Productivity #SocialMedia',
    platforms: ['twitter', 'linkedin', 'facebook'],
    status: 'published',
    publishDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    likes: 1240,
    comments: 89,
    shares: 215,
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-2',
    content: '5 Key Metrics every social media marketer needs to track in 2026. Thread below 👇🧵',
    platforms: ['twitter', 'instagram'],
    status: 'published',
    publishDate: new Date(Date.now() - 3600000 * 18).toISOString(),
    likes: 3410,
    comments: 312,
    shares: 640,
    mediaUrl: null,
  },
  {
    id: 'p-3',
    content: 'Join our exclusive webinar this Thursday on scaling customer engagement across TikTok and Instagram Reels. Reserve your spot now!',
    platforms: ['tiktok', 'instagram', 'youtube'],
    status: 'scheduled',
    publishDate: new Date(Date.now() + 3600000 * 24).toISOString(),
    likes: 0,
    comments: 0,
    shares: 0,
    mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-4',
    content: 'Happy World Mental Health Day! Remember to unplug, recharge, and take care of your mind as much as your work. 🌿💙',
    platforms: ['facebook', 'linkedin', 'twitter'],
    status: 'scheduled',
    publishDate: new Date(Date.now() + 3600000 * 50).toISOString(),
    likes: 0,
    comments: 0,
    shares: 0,
    mediaUrl: null,
  },
  {
    id: 'p-5',
    content: 'Behind the scenes at our creative studio today 🎥 Shooting fresh content with our team!',
    platforms: ['instagram', 'tiktok', 'snapchat'],
    status: 'scheduled',
    publishDate: new Date(Date.now() + 3600000 * 90).toISOString(),
    likes: 0,
    comments: 0,
    shares: 0,
    mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'p-6',
    content: 'Draft: Top 10 tips for video optimization across YouTube Shorts and Instagram Reels.',
    platforms: ['youtube', 'instagram'],
    status: 'draft',
    publishDate: new Date(Date.now() + 3600000 * 120).toISOString(),
    likes: 0,
    comments: 0,
    shares: 0,
    mediaUrl: null,
  }
];

// Generate 30-day analytics data
const generateAnalyticsData = () => {
  const data = [];
  const baseFollowers = 1010000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const growth = Math.floor(Math.sin(i / 3) * 800 + (30 - i) * 650 + 1200);
    const followers = baseFollowers + growth;
    const engagement = Math.floor(4.2 * 1000 + Math.random() * 800 + (30 - i) * 70);
    const impressions = Math.floor(25000 + Math.random() * 12000 + (30 - i) * 600);
    const reach = Math.floor(impressions * 0.72);

    data.push({
      date: dateStr,
      fullDate: d.toISOString().split('T')[0],
      followers,
      engagement,
      impressions,
      reach,
      facebook: Math.floor(engagement * 0.22),
      instagram: Math.floor(engagement * 0.35),
      twitter: Math.floor(engagement * 0.18),
      tiktok: Math.floor(engagement * 0.25),
    });
  }
  return data;
};

const STORAGE_KEYS = {
  ACCOUNTS: 'socialhub_mock_accounts',
  POSTS: 'socialhub_mock_posts',
};

export function useMockData() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [analyticsData] = useState(() => generateAnalyticsData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts]);

  const toggleAccountConnection = (id) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id ? { ...acc, connected: !acc.connected } : acc
      )
    );
  };

  const addPost = (newPost) => {
    const createdPost = {
      ...newPost,
      id: `p-${Date.now()}`,
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setPosts((prev) => [createdPost, ...prev]);
    return createdPost;
  };

  const deletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // Aggregated totals
  const connectedAccounts = accounts.filter((a) => a.connected);
  const totalFollowers = connectedAccounts.reduce((sum, a) => sum + a.followers, 0);
  const totalPosts = posts.length + 1540; // overall historical posts
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const avgEngagementRate = 4.8; // percentage

  return {
    accounts,
    connectedAccounts,
    posts,
    analyticsData,
    toggleAccountConnection,
    addPost,
    deletePost,
    totalFollowers,
    totalPosts,
    scheduledCount,
    avgEngagementRate,
  };
}
