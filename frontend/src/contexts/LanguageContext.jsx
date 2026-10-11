import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    accounts: 'الحسابات المتصلة',
    compose: 'إنشاء منشور',
    calendar: 'تقويم النشر',
    analytics: 'التقارير والإحصائيات',
    inbox: 'الرسائل والتعليقات',
    notifications: 'الإشعارات',
    aiFeatures: 'الذكاء الاصطناعي',
    aiAssistant: 'المساعد الذكي',
    connectedChannels: 'القنوات المتصلة',
    live: 'نشط',
    signOut: 'تسجيل الخروج',
    searchPlaceholder: 'ابحث عن المنشورات، الحملات، الإحصائيات...',
    proPlan: 'خطة احترافية مفعلة',
    enterpriseSuite: 'باقة الأعمال',
    newPost: 'منشور جديد',
    companyProfile: 'بروفايل الشركة',

    // Dashboard
    overviewTitle: 'نظرة عامة على الأداء',
    overviewSubtitle: 'متابعة حية لكل حساباتك ومنشوراتك وإحصائياتك من قاعدة البيانات',
    totalFollowers: 'إجمالي المتابعين',
    totalPosts: 'إجمالي المنشورات',
    avgEngagement: 'معدل التفاعل',
    scheduledPosts: 'منشورات مجدولة',
    impressions: 'الانطباعات (Impressions)',
    reach: 'الوصول (Reach)',
    audienceGrowth: 'نمو الجمهور في آخر 30 يوماً',
    recentPosts: 'أحدث المنشورات',
    viewAllPosts: 'عرض كل المنشورات',
    channelsStatus: 'حالة القنوات المتصلة',
    manageAccounts: 'إدارة الحسابات',
    noPostsYet: 'لا توجد منشورات مسجلة حتى الآن في قاعدة البيانات',
    aiBannerTitle: '💡 اقتراح الذكاء الاصطناعي اليوم:',
    aiBannerText: 'أفضل وقت لنشر محتواك اليوم هو الساعة 20:00 لتحقيق أعلى تفاعل مع جمهورك.',
    viewRecommendations: 'عرض التوصيات',

    // Accounts
    accountsTitle: 'إدارة حسابات السوشيال ميديا',
    accountsSubtitle: 'ربط وإدارة حساباتك عبر المنصات المختلفة ومتابعة حالتها الحية',
    allAccounts: 'جميع الحسابات',
    connectedOnly: 'المتصلة فقط',
    disconnectedOnly: 'المفصولة',
    connect: 'ربط الحساب',
    disconnect: 'فصل الحساب',
    connected: 'متصل',
    disconnected: 'غير متصل',
    followersCount: 'متابع',
    characterLimit: 'الحد الأقصى للحروف',
    disconnectConfirm: 'هل أنت متأكد من رغبتك في فصل هذا الحساب؟',

    // Compose
    composeTitle: 'إنشاء وجدولة منشور',
    composeSubtitle: 'انشر محتواك عبر عدة منصات في نفس الوقت أو جدول نشره في موعد محدد',
    postContentLabel: 'محتوى المنشور',
    postPlaceholder: 'ما الذي ترغب بمشاركته مع جمهورك اليوم؟ أضف نصاً وروابط وهاشتاقات...',
    selectPlatforms: 'اختر المنصات المستهدفة',
    mediaUrlLabel: 'رابط الصورة أو الوسائط (اختياري)',
    mediaUrlPlaceholder: 'https://images.unsplash.com/...',
    schedulingOptions: 'خيارات النشر',
    publishNow: 'نشر فوري الآن',
    scheduleLater: 'جدولة لموعد لاحق',
    scheduleTimeLabel: 'تاريخ ووقت النشر',
    publishButton: 'نشر المنشور فوراً',
    scheduleButton: 'جدولة المنشور',
    saveDraftButton: 'حفظ كمسودة',
    previewTitle: 'معاينة المنشور الحية',
    charactersRemaining: 'حرف متبقي',

    // Calendar
    calendarTitle: 'تقويم المحتوى والنشر',
    calendarSubtitle: 'استعراض مواعيد النشر المجدولة وإدارتها على مدار الشهر',
    today: 'اليوم',
    scheduledFor: 'مجدول لتاريخ:',
    publishedAt: 'نُشر في:',
    deletePost: 'حذف المنشور',
    publishImmediately: 'نشر الآن',
    noPostsOnDay: 'لا توجد منشورات مجدولة في هذا اليوم',
    selectDayPrompt: 'اضغط على أي يوم في التقويم لعرض تفاصيل منشوراته',

    // Analytics
    analyticsTitle: 'التقارير والتحليلات الشاملة',
    analyticsSubtitle: 'بيانات أداء دقيقة محتسبة مباشرة من قاعدة البيانات اليومية والأسبوعية',
    dateRange: 'النطاق الزمني',
    last30Days: 'آخر 30 يوماً',
    last7Days: 'آخر 7 أيام',
    totalEngagementRate: 'متوسط التفاعل',
    topPlatform: 'المنصة الأكثر أداءً',
    engagementTrend: 'تطور التفاعل عبر الوقت',
    platformComparison: 'مقارنة المنصات حسب عدد المتابعين',
    detailedBreakdown: 'جدول تفاصيل الحسابات',
    accountName: 'الحساب',
    platform: 'المنصة',
    followers: 'المتابعون',
    status: 'الحالة',
    dailySummaryTitle: 'الملخص التنفيذي',
    dailySummaryText: 'تم تسجيل وتحديث إحصائياتك تلقائياً لآخر 30 يوماً في قاعدة البيانات، مع استمرار نمو المتابعين والتفاعل.',

    // Common Status
    published: 'منشور',
    scheduled: 'مجدول',
    draft: 'مسودة',
    failed: 'فشل',
    loading: 'جاري التحميل من قاعدة البيانات...',
    saving: 'جاري الحفظ...',
  },

  en: {
    // Navigation
    dashboard: 'Dashboard',
    accounts: 'Connected Accounts',
    compose: 'Compose Post',
    calendar: 'Publishing Calendar',
    analytics: 'Analytics & Reports',
    inbox: 'Social Inbox',
    notifications: 'Notifications',
    aiFeatures: 'AI Features',
    aiAssistant: 'AI Assistant',
    connectedChannels: 'Connected Channels',
    live: 'Live',
    signOut: 'Sign Out',
    searchPlaceholder: 'Search campaigns, posts, metrics...',
    proPlan: 'Pro Plan Active',
    enterpriseSuite: 'Enterprise Suite',
    newPost: 'New Post',
    companyProfile: 'Company Profile',

    // Dashboard
    overviewTitle: 'Performance Overview',
    overviewSubtitle: 'Real-time telemetry and metrics pulled directly from your active database',
    totalFollowers: 'Total Followers',
    totalPosts: 'Total Posts',
    avgEngagement: 'Avg. Engagement',
    scheduledPosts: 'Scheduled Posts',
    impressions: 'Total Impressions',
    reach: 'Total Reach',
    audienceGrowth: 'Audience Trajectory (Last 30 Days)',
    recentPosts: 'Recent Posts',
    viewAllPosts: 'View All Posts',
    channelsStatus: 'Channel Sync Status',
    manageAccounts: 'Manage Accounts',
    noPostsYet: 'No posts recorded yet in the database',
    aiBannerTitle: '💡 AI Recommendation of the Day:',
    aiBannerText: 'Optimal time to publish today is 20:00 (8:00 PM) for peak engagement with your audience.',
    viewRecommendations: 'View Recommendations',

    // Accounts
    accountsTitle: 'Social Media Accounts',
    accountsSubtitle: 'Connect, monitor, and synchronize social accounts across all platforms',
    allAccounts: 'All Accounts',
    connectedOnly: 'Connected Only',
    disconnectedOnly: 'Disconnected',
    connect: 'Connect Channel',
    disconnect: 'Disconnect Channel',
    connected: 'Connected',
    disconnected: 'Disconnected',
    followersCount: 'followers',
    characterLimit: 'Character limit',
    disconnectConfirm: 'Are you sure you want to disconnect this channel?',

    // Compose
    composeTitle: 'Compose & Schedule',
    composeSubtitle: 'Cross-publish across multiple platforms at once or schedule for optimal timing',
    postContentLabel: 'Post Content',
    postPlaceholder: "What would you like to share today? Add text, links, and hashtags...",
    selectPlatforms: 'Target Social Platforms',
    mediaUrlLabel: 'Media URL (Optional)',
    mediaUrlPlaceholder: 'https://images.unsplash.com/...',
    schedulingOptions: 'Publishing Timing',
    publishNow: 'Publish Instantly',
    scheduleLater: 'Schedule for Later',
    scheduleTimeLabel: 'Scheduled Date & Time',
    publishButton: 'Publish Post Now',
    scheduleButton: 'Schedule Post',
    saveDraftButton: 'Save as Draft',
    previewTitle: 'Live Multi-Channel Preview',
    charactersRemaining: 'chars left',

    // Calendar
    calendarTitle: 'Content Calendar',
    calendarSubtitle: 'Visualize and manage your omnichannel publishing schedule',
    today: 'Today',
    scheduledFor: 'Scheduled for:',
    publishedAt: 'Published at:',
    deletePost: 'Delete Post',
    publishImmediately: 'Publish Now',
    noPostsOnDay: 'No posts scheduled on this date',
    selectDayPrompt: 'Click on any calendar day to inspect and manage its scheduled posts',

    // Analytics
    analyticsTitle: 'Comprehensive Analytics',
    analyticsSubtitle: 'Verified performance data computed directly from database snapshots',
    dateRange: 'Date Range',
    last30Days: 'Last 30 Days',
    last7Days: 'Last 7 Days',
    totalEngagementRate: 'Avg. Engagement Rate',
    topPlatform: 'Top Platform',
    engagementTrend: 'Engagement Trajectory',
    platformComparison: 'Platform Follower Comparison',
    detailedBreakdown: 'Channel Performance Breakdown',
    accountName: 'Account',
    platform: 'Platform',
    followers: 'Followers',
    status: 'Status',
    dailySummaryTitle: 'Executive Intelligence Digest',
    dailySummaryText: 'Telemetry snapshots for the past 30 days are synchronized. Audience engagement rate remains positive.',

    // Common Status
    published: 'Published',
    scheduled: 'Scheduled',
    draft: 'Draft',
    failed: 'Failed',
    loading: 'Loading real data from database...',
    saving: 'Saving...',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('socialhub_lang') || 'ar'; // Default Arabic as requested
  });

  const isRTL = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('socialhub_lang', lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const toggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const value = {
    lang,
    isRTL,
    toggleLang,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
