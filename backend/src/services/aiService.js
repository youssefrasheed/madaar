/**
 * AI Service — Powered by Google Gemini
 * يوفر اقتراحات ذكية لإدارة السوشيال ميديا
 */

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-flash-latest';

// ─── Helper: parse JSON safely from Gemini response ──────────────────────────
function parseJsonFromText(text) {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── 1. Best Posting Times ────────────────────────────────────────────────────
/**
 * analyzePostingTimes
 * بيحلل بيانات الأداء ويقترح أفضل مواعيد النشر لكل منصة
 *
 * @param {Object} analyticsData - بيانات الأداء من قاعدة البيانات
 * @param {string} platform - اسم المنصة
 * @param {string} timezone - المنطقة الزمنية للمستخدم (default: Africa/Cairo)
 */
async function analyzePostingTimes(analyticsData, platform, timezone = 'Africa/Cairo') {
  const prompt = `
You are a social media analytics expert. Analyze this performance data and suggest the best posting times.

Platform: ${platform}
Timezone: ${timezone}
Analytics Data (last 30 days):
${JSON.stringify(analyticsData, null, 2)}

Return a JSON object with this exact structure:
{
  "platform": "${platform}",
  "timezone": "${timezone}",
  "bestTimes": [
    {
      "day": "Sunday",
      "dayAr": "الأحد",
      "times": ["09:00", "13:00", "20:00"],
      "avgEngagement": 8.5,
      "reason": "Highest engagement based on your historical data"
    }
  ],
  "worstTimes": [
    {
      "day": "Wednesday",
      "dayAr": "الأربعاء",
      "times": ["02:00", "04:00"],
      "avgEngagement": 1.2,
      "reason": "Low activity period for your audience"
    }
  ],
  "weeklyPattern": {
    "Monday": 6.2,
    "Tuesday": 5.8,
    "Wednesday": 4.1,
    "Thursday": 7.3,
    "Friday": 9.1,
    "Saturday": 8.7,
    "Sunday": 7.9
  },
  "peakHour": "20:00",
  "peakDay": "Friday",
  "peakDayAr": "الجمعة",
  "insights": [
    "Your audience is most active on weekends",
    "Evening posts (7-9 PM) get 2x more engagement"
  ],
  "insightsAr": [
    "جمهورك أكتر نشاطاً في عطلة نهاية الأسبوع",
    "البوستات المسائية (7-9 م) بتحصل على ضعف التفاعل"
  ]
}

If no analytics data is provided, use general best practices for ${platform} in the Middle East/Egypt region.
Return ONLY the JSON, no extra text.
`;

  try {
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJsonFromText(response.text);
    return parsed || getFallbackPostingTimes(platform, timezone);
  } catch (error) {
    console.error('[AI] analyzePostingTimes error:', error.message);
    return getFallbackPostingTimes(platform, timezone);
  }
}

// ─── 2. Content Suggestions ───────────────────────────────────────────────────
/**
 * generateContentSuggestions
 * بيقترح أفكار محتوى مناسبة للمنصة والجمهور
 *
 * @param {Object} params
 * @param {string} params.platform - المنصة
 * @param {string} params.niche - مجال الحساب (e.g., "technology", "fashion", "food")
 * @param {string} params.tone - نبرة المحتوى ("professional", "casual", "humorous")
 * @param {string} params.language - اللغة ("ar", "en", "both")
 * @param {string[]} params.recentTopics - موضوعات نشرها مؤخراً
 * @param {number} params.count - عدد الاقتراحات (default: 5)
 */
async function generateContentSuggestions({ platform, niche, tone = 'casual', language = 'ar', recentTopics = [], count = 5 }) {
  const langInstruction = language === 'ar'
    ? 'Write all content in Arabic'
    : language === 'en'
    ? 'Write all content in English'
    : 'Write content in both Arabic and English';

  const prompt = `
You are an expert social media content strategist specializing in ${platform} for the Arab/Egyptian market.

Account details:
- Platform: ${platform}
- Niche/Field: ${niche}
- Content Tone: ${tone}
- Language: ${langInstruction}
- Recently posted topics (avoid repetition): ${recentTopics.join(', ') || 'None'}

Generate ${count} creative content ideas. Return a JSON array with this exact structure:
[
  {
    "id": 1,
    "title": "Post title/hook",
    "titleAr": "عنوان البوست بالعربي",
    "content": "Full post content ready to copy and paste",
    "contentAr": "محتوى البوست بالعربي جاهز للنسخ",
    "type": "tip|story|question|poll|behind-scenes|trending|educational",
    "typeLabel": "نصيحة | قصة | سؤال | استفتاء | خلف الكواليس | ترند | تعليمي",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "hashtagsAr": ["#وسم1", "#وسم2"],
    "estimatedEngagement": "high|medium|low",
    "bestPostTime": "20:00",
    "mediaType": "image|video|carousel|text",
    "mediaIdea": "Brief description of what visual to use",
    "mediaIdeaAr": "وصف مختصر للصورة أو الفيديو المناسب",
    "characterCount": 150,
    "platformFit": 9,
    "whyItWorks": "Short explanation of why this content performs well",
    "whyItWorksAr": "شرح مختصر ليه المحتوى ده بيشتغل كويس"
  }
]

Make the content creative, engaging, and culturally appropriate for Arab audiences.
Vary the content types. Make it actionable and ready to post.
Return ONLY the JSON array, no extra text.
`;

  try {
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJsonFromText(response.text);
    return Array.isArray(parsed) ? parsed : getFallbackSuggestions(platform, niche);
  } catch (error) {
    console.error('[AI] generateContentSuggestions error:', error.message);
    return getFallbackSuggestions(platform, niche);
  }
}

// ─── 3. Post Optimizer ────────────────────────────────────────────────────────
/**
 * optimizePost
 * بيحلل البوست ويقترح تحسينات لزيادة الـ engagement
 *
 * @param {string} content - نص البوست
 * @param {string} platform - المنصة
 * @param {string} goal - الهدف ("engagement", "reach", "clicks", "followers")
 */
async function optimizePost(content, platform, goal = 'engagement') {
  const prompt = `
You are an expert social media copywriter. Analyze this post and provide optimization suggestions.

Platform: ${platform}
Goal: Maximize ${goal}
Original post:
"""
${content}
"""

Return a JSON object with this structure:
{
  "score": 72,
  "scoreLabel": "جيد — يمكن تحسينه",
  "optimizedVersion": "The improved version of the post ready to use",
  "optimizedVersionAr": "النسخة المحسّنة من البوست بالعربي",
  "improvements": [
    {
      "type": "hook",
      "issue": "The opening line is weak",
      "issueAr": "السطر الأول ضعيف",
      "suggestion": "Start with a question or bold statement",
      "suggestionAr": "ابدأ بسؤال أو جملة جريئة"
    }
  ],
  "suggestedHashtags": ["#tag1", "#tag2", "#tag3"],
  "callToAction": "Add a clear CTA like 'Comment below!'",
  "callToActionAr": "أضف دعوة للتفاعل زي 'اكتب رأيك في التعليقات!'",
  "readabilityScore": 8.5,
  "emotionalScore": 6.2,
  "estimatedReach": "medium",
  "tips": [
    "Add 3-5 relevant hashtags",
    "Include an emoji to increase visibility"
  ],
  "tipsAr": [
    "أضف 3-5 هاشتاق مناسبين",
    "أضف إيموجي لزيادة الوضوح"
  ]
}

Return ONLY the JSON, no extra text.
`;

  try {
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJsonFromText(response.text);
    return parsed || { score: 70, error: 'Could not analyze post', optimizedVersion: content };
  } catch (error) {
    console.error('[AI] optimizePost error:', error.message);
    return { score: 70, error: error.message, optimizedVersion: content };
  }
}

// ─── 4. Weekly Content Plan ───────────────────────────────────────────────────
/**
 * generateWeeklyPlan
 * بيولد خطة محتوى أسبوعية كاملة لكل المنصات
 *
 * @param {Object} params
 * @param {string[]} params.platforms - المنصات المستهدفة
 * @param {string} params.niche - مجال الحساب
 * @param {string} params.weekStart - تاريخ بداية الأسبوع (ISO string)
 * @param {number} params.postsPerDay - عدد البوستات في اليوم (default: 2)
 */
async function generateWeeklyPlan({ platforms, niche, weekStart, postsPerDay = 2 }) {
  const prompt = `
You are a social media content calendar expert. Create a complete weekly content plan.

Details:
- Platforms: ${platforms.join(', ')}
- Niche: ${niche}
- Week starting: ${weekStart}
- Posts per day: ${postsPerDay}

Create a 7-day content calendar. Return a JSON array (one object per day):
[
  {
    "date": "2024-01-15",
    "dayName": "Monday",
    "dayNameAr": "الاثنين",
    "posts": [
      {
        "time": "09:00",
        "platform": "instagram",
        "type": "educational",
        "typeAr": "تعليمي",
        "title": "Post title",
        "titleAr": "عنوان البوست",
        "content": "Post content...",
        "contentAr": "محتوى البوست...",
        "hashtags": ["#tag1", "#tag2"],
        "mediaType": "image|video|carousel",
        "mediaIdea": "Visual description",
        "mediaIdeaAr": "وصف البصري",
        "priority": "high|medium|low"
      }
    ],
    "theme": "Weekly theme for this day",
    "themeAr": "موضوع اليوم"
  }
]

Make a diverse, engaging content mix. Vary post types and times.
Consider best practices for each platform.
Return ONLY the JSON array, no extra text.
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { maxOutputTokens: 8192 }
    });
    const parsed = parseJsonFromText(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[AI] generateWeeklyPlan error:', error.message);
    return [];
  }
}

// ─── 5. Analytics Insights ────────────────────────────────────────────────────
/**
 * generateAnalyticsInsights
 * بيحلل بيانات الأداء ويطلع توصيات عملية
 *
 * @param {Object} analyticsData - البيانات من قاعدة البيانات
 * @param {string} period - "daily" | "weekly" | "monthly"
 */
async function generateAnalyticsInsights(analyticsData, period = 'weekly') {
  const prompt = `
You are a data-driven social media analyst. Analyze this ${period} performance data and provide actionable insights.

Data:
${JSON.stringify(analyticsData, null, 2)}

Return a JSON object:
{
  "period": "${period}",
  "overallScore": 75,
  "overallLabel": "جيد",
  "summary": "Overall performance summary in 2 sentences",
  "summaryAr": "ملخص الأداء بالعربي في جملتين",
  "highlights": [
    {
      "metric": "Engagement Rate",
      "metricAr": "معدل التفاعل",
      "value": "8.3%",
      "change": "+2.1%",
      "trend": "up",
      "interpretation": "Great improvement!",
      "interpretationAr": "تحسن رائع!"
    }
  ],
  "topPerformingContent": {
    "type": "video",
    "typeAr": "فيديو",
    "platform": "instagram",
    "reason": "Videos get 3x more reach",
    "reasonAr": "الفيديوهات بتوصل لـ 3 أضعاف الناس"
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Post more Reels on Instagram",
      "actionAr": "انشر أكتر Reels على انستجرام",
      "expectedImpact": "+40% reach",
      "timeline": "This week"
    }
  ],
  "warningFlags": [
    {
      "issue": "Engagement dropped on LinkedIn",
      "issueAr": "التفاعل انخفض على لينكدإن",
      "severity": "medium",
      "suggestion": "Post more professional content",
      "suggestionAr": "انشر محتوى أكتر احترافية"
    }
  ],
  "nextWeekFocus": "Focus on video content across all platforms",
  "nextWeekFocusAr": "ركز على محتوى الفيديو على كل المنصات"
}

Return ONLY the JSON, no extra text.
`;

  try {
    const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const parsed = parseJsonFromText(response.text);
    return parsed || { error: 'Could not generate insights', period };
  } catch (error) {
    console.error('[AI] generateAnalyticsInsights error:', error.message);
    return { error: error.message, period };
  }
}

// ─── 6. AI Chat Assistant ─────────────────────────────────────────────────────
/**
 * chatWithAssistant
 * مساعد ذكاء اصطناعي تفاعلي متخصص في السوشيال ميديا
 * يحتفظ بتاريخ المحادثة
 */
const chatSessions = new Map(); // userId -> Chat instance

async function chatWithAssistant(userId, userMessage, accountContext = {}) {
  try {
    // Create or reuse chat session per user
    if (!chatSessions.has(userId)) {
      const chat = ai.chats.create({
        model: MODEL,
        config: {
          systemInstruction: `You are SocialHub AI, an expert social media manager assistant.
You help users manage their social media presence across Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, and Snapchat.

Your expertise includes:
- Content strategy and creation
- Best posting times and scheduling
- Analytics interpretation
- Hashtag research
- Audience growth tactics
- Engagement strategies
- Trending content ideas

User's account context: ${JSON.stringify(accountContext)}

Communication style:
- Be friendly and conversational
- Support both Arabic and English (respond in the same language the user writes in)
- Give specific, actionable advice
- Use emojis appropriately
- Keep responses concise but helpful`,
        },
      });
      chatSessions.set(userId, chat);
    }

    const chat = chatSessions.get(userId);
    const response = await chat.sendMessage({ message: userMessage });

    return {
      message: response.text,
      sessionActive: true,
    };
  } catch (error) {
    console.error('[AI] chatWithAssistant error:', error.message);
    return {
      message: 'عذراً، حدث خطأ. حاول مرة أخرى. | Sorry, an error occurred. Please try again.',
      sessionActive: false,
      error: error.message,
    };
  }
}

// Clear chat session (logout or reset)
function clearChatSession(userId) {
  chatSessions.delete(userId);
}

// ─── Fallback Data (when AI is unavailable) ───────────────────────────────────
function getFallbackPostingTimes(platform, timezone) {
  const defaults = {
    facebook:  { peakDay: 'Thursday', peakHour: '13:00', peakDayAr: 'الخميس' },
    instagram: { peakDay: 'Wednesday', peakHour: '19:00', peakDayAr: 'الأربعاء' },
    twitter:   { peakDay: 'Tuesday', peakHour: '09:00', peakDayAr: 'الثلاثاء' },
    linkedin:  { peakDay: 'Tuesday', peakHour: '10:00', peakDayAr: 'الثلاثاء' },
    tiktok:    { peakDay: 'Friday', peakHour: '20:00', peakDayAr: 'الجمعة' },
    youtube:   { peakDay: 'Saturday', peakHour: '15:00', peakDayAr: 'السبت' },
    snapchat:  { peakDay: 'Friday', peakHour: '22:00', peakDayAr: 'الجمعة' },
  };
  const d = defaults[platform.toLowerCase()] || defaults.instagram;
  return {
    platform, timezone,
    peakDay: d.peakDay, peakDayAr: d.peakDayAr, peakHour: d.peakHour,
    bestTimes: [{ day: d.peakDay, dayAr: d.peakDayAr, times: [d.peakHour], avgEngagement: 7.5, reason: 'General best practice for ' + platform }],
    insightsAr: ['هذه البيانات مبنية على أفضل الممارسات العامة للمنطقة العربية'],
    fallback: true,
  };
}

function getFallbackSuggestions(platform, niche) {
  return [
    {
      id: 1,
      titleAr: 'نصيحة يومية في مجالك',
      contentAr: `شارك نصيحة مفيدة في مجال ${niche} اليوم! 💡 ما هي أهم نصيحة تعلمتها هذا الأسبوع؟ شاركنا في التعليقات 👇`,
      type: 'tip', typeLabel: 'نصيحة',
      hashtags: ['#نصيحة_اليوم', `#${niche}`, '#تعلم'],
      estimatedEngagement: 'high',
      mediaType: 'image',
      fallback: true,
    },
  ];
}

/**
 * generateReplySuggestion
 * Generates smart, professional replies for comments and direct messages
 */
async function generateReplySuggestion(messageContent, senderName, platform, tone = 'friendly') {
  const tonePrompts = {
    friendly: 'ودود، ترحيبي، وإيجابي',
    professional: 'رسمي، مهني، واحترافي',
    sales: 'تسويقي يشجع على الشراء والتواصل على الخاص',
    support: 'دعم فني يساعد في حل الاستفسار بسرعة واحترافية',
  };

  const selectedTone = tonePrompts[tone] || tonePrompts.friendly;

  const prompt = `
أنت خبير خدمة عملاء وسوشيال ميديا لشركة تستخدم منصة "مَـدَار (Madaar)".
اكتب 3 اقتراحات لردود سريعة ومتقنة بالعربية على هذا التعليق أو الرسالة:

المنصة: ${platform}
اسم المرسل: ${senderName}
محتوى الرسالة/التعليق: "${messageContent}"
النبرة المطلوبة: ${selectedTone}

أرجع نتيجة JSON مطابقة تماماً للشكل التالي:
{
  "suggestions": [
    {
      "id": 1,
      "tone": "ودود ومرحب",
      "text": "..."
    },
    {
      "id": 2,
      "tone": "مختصر ومباشر",
      "text": "..."
    },
    {
      "id": 3,
      "tone": "توجيه للخاص",
      "text": "..."
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = parseJsonFromText(response.text);
    if (parsed && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions;
    }
  } catch (err) {
    console.warn('[AI] Reply generation failed, using fallback:', err.message);
  }

  return [
    {
      id: 1,
      tone: 'ودود ومرحب',
      text: `أهلاً بك يا ${senderName}! يسعدنا تواصلك دائماً. نحن بخدمتك في أي وقت 🌟`,
    },
    {
      id: 2,
      tone: 'مختصر ومباشر',
      text: `مرحباً ${senderName}، تم استلام استفسارك ويسعدنا تقديم كامل التفاصيل لك. شكراً لاهتمامك!`,
    },
    {
      id: 3,
      tone: 'توجيه للخاص',
      text: `أهلاً ${senderName}، أرسلنا لك كافة التفاصيل في رسالة خاصة، تفقد صندوق الوارد 📩`,
    },
  ];
}

module.exports = {
  analyzePostingTimes,
  generateContentSuggestions,
  optimizePost,
  generateWeeklyPlan,
  generateAnalyticsInsights,
  chatWithAssistant,
  clearChatSession,
  generateReplySuggestion,
};
