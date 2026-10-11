import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Send,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
  Hash,
  Layers,
  Heart,
  MessageCircle,
  Share2,
  Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlatformIcon, { PLATFORM_META } from '../components/PlatformIcon';
import api from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Compose() {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduleType, setScheduleType] = useState('now'); // 'now' | 'schedule'
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [previewPlatform, setPreviewPlatform] = useState('twitter');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  // Platform character limits
  const charLimits = {
    facebook: 63206,
    instagram: 2200,
    twitter: 280,
    linkedin: 3000,
    tiktok: 2200,
    youtube: 5000,
    snapchat: 250,
  };

  useEffect(() => {
    api.get('/accounts')
      .then(res => {
        const plats = (res.data.accounts || []).map(a => a.platform);
        setConnectedPlatforms(plats);
        if (plats.length > 0) {
          setSelectedPlatforms(plats);
          setPreviewPlatform(plats[0]);
        } else {
          setSelectedPlatforms([]);
        }
      })
      .catch(() => {});
  }, []);

  const togglePlatform = (p) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) {
        toast.error(isRTL ? 'يُرجى إبقاء منصة واحدة على الأقل مختارة' : 'Please keep at least one platform selected');
        return;
      }
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      if (previewPlatform === p) {
        const remaining = selectedPlatforms.filter((item) => item !== p);
        if (remaining.length > 0) setPreviewPlatform(remaining[0]);
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
      setPreviewPlatform(p);
    }
  };

  const lowestLimit = Math.min(...selectedPlatforms.map((p) => charLimits[p] || 280));
  const isOverLimit = content.length > lowestLimit;

  // Real SQLite Database Submission
  const handleSubmit = async (targetStatus = null) => {
    if (!content.trim()) {
      toast.error(isRTL ? 'محتوى المنشور لا يمكن أن يكون فارغاً' : 'Post content cannot be empty');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error(isRTL ? 'اختر منصة واحدة على الأقل' : 'Select at least one platform');
      return;
    }
    if (isOverLimit) {
      toast.error(isRTL ? 'النص يتجاوز الحد الأقصى للمنصات المختارة!' : 'Content exceeds character limit for selected platforms!');
      return;
    }

    setIsSubmitting(true);
    try {
      const isScheduled = scheduleType === 'schedule';
      const status = targetStatus || (isScheduled ? 'scheduled' : 'published');

      const payload = {
        content: content.trim(),
        platforms: selectedPlatforms,
        media_urls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
        scheduled_at: status === 'scheduled' ? new Date(scheduleDate).toISOString() : null,
        status: status,
      };

      const res = await api.post('/posts', payload);

      toast.success(
        status === 'scheduled'
          ? (isRTL ? 'تمت جدولة المنشور وحفظه في قاعدة البيانات!' : 'Post scheduled and saved to database!')
          : status === 'draft'
          ? (isRTL ? 'تم حفظ المنشور كمسودة في قاعدة البيانات!' : 'Post saved as draft in database!')
          : (isRTL ? 'تم نشر المنشور فوراً بنجاح!' : 'Post published successfully!')
      );

      navigate('/calendar');
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error(isRTL ? 'فشل حفظ المنشور في قاعدة البيانات' : 'Failed to save post to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('composeTitle')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('composeSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Platforms Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              {t('selectPlatforms')}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {Object.keys(charLimits).map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                  >
                    <PlatformIcon platform={platform} size="xs" showBg={false} />
                    <span className="capitalize">{PLATFORM_META[platform]?.name || platform}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('postContentLabel')}
              </label>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                  isOverLimit
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {content.length}/{lowestLimit} {t('charactersRemaining')}
              </span>
            </div>

            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('postPlaceholder')}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none leading-relaxed"
            />

            {/* Quick Hashtag & AI Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setContent((c) => c + ' #SocialHub #Growth #Tech')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Hash className="w-3 h-3" />
                  <span>+ {isRTL ? 'هاشتاقات مقترحة' : 'Tags'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ai')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>{isRTL ? 'تحسين بالـ AI' : 'Optimize AI'}</span>
                </button>
              </div>

              {isOverLimit && (
                <div className="flex items-center gap-1 text-xs text-rose-600 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'تجاوزت الحد المسموح' : 'Character limit exceeded'}</span>
                </div>
              )}
            </div>

            {/* Media Attachment */}
            <div className="pt-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t('mediaUrlLabel')}
              </label>
              <div className="relative">
                <ImageIcon className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={t('mediaUrlPlaceholder')}
                  className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                    isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Scheduling Mode Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('schedulingOptions')}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScheduleType('now')}
                className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  scheduleType === 'now'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-600/10'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{t('publishNow')}</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('schedule')}
                className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  scheduleType === 'schedule'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-600/10'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{t('scheduleLater')}</span>
              </button>
            </div>

            {scheduleType === 'schedule' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {t('scheduleTimeLabel')}
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting || isOverLimit}
              onClick={() => handleSubmit()}
              className="w-full sm:flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : scheduleType === 'schedule' ? (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>{t('scheduleButton')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('publishButton')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="w-full sm:w-auto py-4 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-4 h-4" />
              <span>{t('saveDraftButton')}</span>
            </button>
          </div>
        </div>

        {/* Right Live Preview: 5 Cols */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>{t('previewTitle')}</span>
              </div>

              {/* Preview platform selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {selectedPlatforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreviewPlatform(p)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      previewPlatform === p ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <PlatformIcon platform={p} size="xs" showBg={false} />
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Post Card for Preview Platform */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Alex Morgan Studio</h4>
                  <p className="text-[10px] text-slate-400">@alexmorgan • Just now</p>
                </div>
              </div>

              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {content.trim() ? content : (
                  <span className="text-slate-400 italic">
                    {isRTL ? 'معاينة نص المنشور ستظهر هنا...' : 'Post text preview will render here in real-time...'}
                  </span>
                )}
              </div>

              {mediaUrl.trim() && (
                <div className="rounded-xl overflow-hidden border border-slate-200 mt-2 max-h-48 bg-slate-900">
                  <img
                    src={mediaUrl}
                    alt="Media preview"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-slate-400 text-xs" dir="ltr">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> 0</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 0</span>
                <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> 0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
