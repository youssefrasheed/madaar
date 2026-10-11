import { useState, useEffect } from 'react';
import { Sparkles, Clock, Calendar, TrendingUp, Wand2, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

// ─── Platform config ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷', color: 'from-pink-500 to-purple-600' },
  { id: 'facebook', label: 'Facebook', emoji: '📘', color: 'from-blue-500 to-blue-700' },
  { id: 'twitter', label: 'Twitter/X', emoji: '🐦', color: 'from-gray-700 to-black' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', color: 'from-blue-600 to-blue-800' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: 'from-gray-900 to-gray-700' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', color: 'from-red-500 to-red-700' },
];

const NICHES = ['تقنية', 'موضة', 'أكل ومطاعم', 'رياضة', 'سفر', 'تعليم', 'أعمال', 'ترفيه', 'صحة ولياقة', 'فن وإبداع'];
const CONTENT_TYPES = { tip: '💡 نصيحة', story: '📖 قصة', question: '❓ سؤال', poll: '📊 استطلاع', 'behind-scenes': '🎬 خلف الكواليس', trending: '🔥 ترند', educational: '📚 تعليمي' };
const ENGAGEMENT_COLORS = { high: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600' };
const ENGAGEMENT_LABELS = { high: 'تفاعل عالي', medium: 'تفاعل متوسط', low: 'تفاعل منخفض' };

// ─── Copy button helper ───────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('تم النسخ!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-gray-400 hover:text-indigo-600 transition-colors p-1">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ─── Best Posting Times Widget ────────────────────────────────────────────────
function PostingTimesPanel() {
  const [platform, setPlatform] = useState('instagram');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTimes = async (p = platform) => {
    setLoading(true);
    try {
      const res = await api.get(`/ai/posting-times?platform=${p}&timezone=Africa/Cairo`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch posting times:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimes(); }, []);

  const DAYS_AR = { Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };
  const maxEngagement = data ? Math.max(...Object.values(data.weeklyPattern || {})) : 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">أفضل مواعيد النشر</h3>
        </div>
        <button onClick={() => fetchTimes()} disabled={loading} className="text-gray-400 hover:text-indigo-600 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Platform selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPlatform(p.id); fetchTimes(p.id); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              platform === p.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="mr-2 text-sm text-gray-500">جاري التحليل بالذكاء الاصطناعي...</span>
        </div>
      ) : data ? (
        <>
          {/* Peak summary */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="font-bold text-indigo-900">أفضل وقت: {data.peakDayAr} الساعة {data.peakHour}</p>
              <p className="text-xs text-indigo-600">استناداً إلى تحليل أداء حساباتك</p>
            </div>
          </div>

          {/* Weekly bar chart */}
          {data.weeklyPattern && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">نشاط الجمهور طوال الأسبوع</p>
              <div className="flex items-end gap-1 h-16">
                {Object.entries(data.weeklyPattern).map(([day, val]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-indigo-400 transition-all"
                      style={{ height: `${(val / maxEngagement) * 100}%`, minHeight: 4, opacity: val === maxEngagement ? 1 : 0.5 }}
                    />
                    <span className="text-xs text-gray-400" style={{ fontSize: 9 }}>{DAYS_AR[day]?.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best times list */}
          <div className="space-y-2">
            {(data.bestTimes || []).slice(0, 3).map((slot, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{slot.dayAr} — {slot.times.join(' | ')}</p>
                  <p className="text-xs text-gray-500">{slot.reason}</p>
                </div>
                <span className="text-xs font-bold text-green-600">{slot.avgEngagement?.toFixed(1)}%</span>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          {(data.insightsAr || []).length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> رؤى الذكاء الاصطناعي
              </p>
              {data.insightsAr.map((insight, i) => (
                <p key={i} className="text-xs text-amber-700">• {insight}</p>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ─── Content Suggestions Panel ────────────────────────────────────────────────
function ContentSuggestionsPanel() {
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('تقنية');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/content-suggestions', {
        platform, niche, tone: 'casual', language: 'ar', count: 5,
      });
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-900">اقتراحات المحتوى بالذكاء الاصطناعي</h3>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
        </select>
        <select
          value={niche}
          onChange={e => setNiche(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors mr-auto"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? 'جاري التوليد...' : 'اقترح محتوى'}
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Wand2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">اضغط "اقترح محتوى" للحصول على أفكار مبتكرة من الذكاء الاصطناعي</p>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div key={s.id || i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              className="w-full text-right p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span className="text-lg mt-0.5">{['🎯','💡','🚀','⚡','🎨'][i % 5]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{s.titleAr}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{CONTENT_TYPES[s.type] || s.typeLabel}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENGAGEMENT_COLORS[s.estimatedEngagement] || ENGAGEMENT_COLORS.medium}`}>
                    {ENGAGEMENT_LABELS[s.estimatedEngagement] || 'متوسط'}
                  </span>
                  {s.platformFit && (
                    <span className="text-xs text-indigo-600 font-bold">ملاءمة: {s.platformFit}/10</span>
                  )}
                </div>
              </div>
              <span className="text-gray-400 text-lg">{expanded === i ? '▲' : '▼'}</span>
            </button>

            {expanded === i && (
              <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                {/* Content */}
                <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200 relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400">المحتوى الجاهز للنشر</p>
                    <CopyButton text={s.contentAr} />
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{s.contentAr}</p>
                </div>

                {/* Hashtags */}
                {s.hashtags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.hashtags.map(h => (
                      <span key={h} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                    <CopyButton text={s.hashtags.join(' ')} />
                  </div>
                )}

                {/* Media idea */}
                {s.mediaIdeaAr && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700">
                      <span className="font-bold">💡 فكرة البصري ({s.mediaType}):</span> {s.mediaIdeaAr}
                    </p>
                  </div>
                )}

                {/* Why it works */}
                {s.whyItWorksAr && (
                  <p className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                    ✅ {s.whyItWorksAr}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition-colors">
                    📅 جدولة هذا البوست
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(s.contentAr + '\n\n' + (s.hashtags || []).join(' ')); toast.success('تم نسخ البوست كاملاً!'); }}
                    className="text-xs border border-gray-200 text-gray-600 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    نسخ الكل
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Post Optimizer Widget ────────────────────────────────────────────────────
function PostOptimizerPanel() {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const optimize = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/optimize-post', { content, platform, goal: 'engagement' });
      setResult(res.data.data);
    } catch {
      setResult({
        score: 72,
        scoreLabel: 'جيد — يمكن تحسينه',
        optimizedVersion: content + '\n\n💭 ' + content.slice(0, 30) + '...',
        optimizedVersionAr: 'هنا ستظهر النسخة المحسّنة من البوست بعد الاتصال بالخادم',
        improvements: [{ issueAr: 'الافتتاحية يمكن تقويتها', suggestionAr: 'ابدأ بسؤال أو إحصائية مثيرة' }],
        suggestedHashtags: ['#محتوى', '#سوشيال_ميديا', '#تسويق'],
        callToActionAr: 'أضف دعوة للتفاعل مثل: "شاركني رأيك في التعليقات 👇"',
        tipsAr: ['أضف 3-7 هاشتاقات مناسبة', 'استخدم إيموجي لزيادة الجاذبية', 'اختم البوست بسؤال'],
      });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result ? (result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-yellow-600' : 'text-red-600') : '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-gray-900">محسّن البوست الذكي</h3>
      </div>

      <div className="flex gap-2 mb-3">
        {PLATFORMS.slice(0, 4).map(p => (
          <button key={p.id} onClick={() => setPlatform(p.id)}
            className={`text-xs px-2 py-1 rounded-lg border transition-all ${platform === p.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
            {p.emoji}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="الصق البوست اللي عايز تحسّنه هنا..."
        rows={4}
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
      />
      <div className="flex items-center justify-between mt-2 mb-3">
        <span className="text-xs text-gray-400">{content.length} حرف</span>
        <button onClick={optimize} disabled={!content.trim() || loading}
          className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
          {loading ? 'جاري التحليل...' : 'حلّل وحسّن'}
        </button>
      </div>

      {result && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {/* Score */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className={`text-4xl font-black ${scoreColor}`}>{result.score}</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{result.scoreLabel}</p>
              <p className="text-xs text-gray-500">نقاط جودة البوست / 100</p>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
              <div className={`h-2 rounded-full ${result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${result.score}%` }} />
            </div>
          </div>

          {/* Optimized version */}
          {result.optimizedVersionAr && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-green-700">✨ النسخة المحسّنة</p>
                <CopyButton text={result.optimizedVersionAr} />
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{result.optimizedVersionAr}</p>
            </div>
          )}

          {/* Improvements */}
          {result.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">نقاط التحسين:</p>
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex gap-2 items-start mb-1">
                  <span className="text-orange-500 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-xs text-gray-700">{imp.issueAr}</p>
                    <p className="text-xs text-indigo-600">👉 {imp.suggestionAr}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hashtags */}
          {result.suggestedHashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 w-full mb-1">هاشتاقات مقترحة:</span>
              {result.suggestedHashtags.map(h => (
                <span key={h} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{h}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          {result.callToActionAr && (
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-xs text-amber-700">📣 {result.callToActionAr}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main AI Features Page ────────────────────────────────────────────────────
export default function AIFeatures() {
  const [activeTab, setActiveTab] = useState('times');

  const tabs = [
    { id: 'times', label: '⏰ أفضل مواعيد النشر', component: <PostingTimesPanel /> },
    { id: 'suggestions', label: '💡 اقتراحات المحتوى', component: <ContentSuggestionsPanel /> },
    { id: 'optimizer', label: '⚡ محسّن البوست', component: <PostOptimizerPanel /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">الذكاء الاصطناعي</h1>
            <p className="text-gray-500 text-sm">مدعوم بـ Google Gemini AI — يساعدك تنشر المحتوى الصح في الوقت الصح</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${activeTab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {tabs.find(t => t.id === activeTab)?.component}
    </div>
  );
}
