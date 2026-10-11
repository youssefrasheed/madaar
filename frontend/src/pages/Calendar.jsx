import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Send,
  Calendar as CalendarIcon,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlatformIcon, { PLATFORM_META } from '../components/PlatformIcon';
import api from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Calendar() {
  const navigate = useNavigate();
  const { isRTL, t, lang } = useLanguage();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateLocale = lang === 'ar' ? ar : enUS;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts');
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Find posts for a date
  const getPostsForDay = (day) => {
    return posts.filter((post) => {
      try {
        const rawDate = post.scheduled_at || post.published_at || post.created_at;
        if (!rawDate) return false;
        const postDate = parseISO(rawDate);
        return isSameDay(postDate, day);
      } catch (e) {
        return false;
      }
    });
  };

  const selectedDayPosts = getPostsForDay(selectedDate);

  // Real Database Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(p => p.id !== id));
      toast.success(isRTL ? 'تم حذف المنشور من قاعدة البيانات' : 'Post removed from database');
    } catch (err) {
      toast.error(isRTL ? 'فشل حذف المنشور' : 'Failed to delete post');
    }
  };

  // Real Database Instant Publish
  const handlePublishNow = async (id) => {
    try {
      await api.post(`/posts/${id}/publish`);
      toast.success(isRTL ? 'تم نشر المنشور فوراً بنجاح!' : 'Post published immediately!');
      fetchPosts();
    } catch (err) {
      toast.error(isRTL ? 'فشل نشر المنشور' : 'Failed to publish post');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('calendarTitle')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('calendarSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
            title={isRTL ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={goToToday}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            {t('today')}
          </button>

          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
            <button
              onClick={isRTL ? nextMonth : prevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </span>
            <button
              onClick={isRTL ? prevMonth : nextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/compose')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newPost')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar + Day Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid: 8 Cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const dayDate = addMonths(startDate, 0);
              dayDate.setDate(startDate.getDate() + i);
              return (
                <div key={i} className="truncate">
                  {format(dayDate, 'EEE', { locale: dateLocale })}
                </div>
              );
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dayPosts = getPostsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[92px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                      : inCurrentMonth
                      ? 'border-slate-100 hover:border-slate-200 bg-white'
                      : 'border-transparent bg-slate-50/50 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrentDay
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'text-indigo-600 font-extrabold'
                          : 'text-slate-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {dayPosts.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {dayPosts.length}
                      </span>
                    )}
                  </div>

                  {/* Post Badges preview on day */}
                  <div className="space-y-1 mt-1">
                    {dayPosts.slice(0, 2).map((p) => {
                      const platforms = Array.isArray(p.platforms) ? p.platforms : JSON.parse(p.platforms || '[]');
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100/90 text-[10px] text-slate-700 font-medium truncate"
                        >
                          <PlatformIcon platform={platforms[0]} size="xs" showBg={false} />
                          <span className="truncate">{p.content}</span>
                        </div>
                      );
                    })}
                    {dayPosts.length > 2 && (
                      <span className="text-[9px] font-bold text-indigo-600 block text-center">
                        +{dayPosts.length - 2} {isRTL ? 'المزيد' : 'more'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel: 4 Cols */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <span>{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDayPosts.length} {isRTL ? 'منشورات مسجلة لهذا اليوم' : 'scheduled releases'}
            </p>
          </div>

          {selectedDayPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs">{t('noPostsOnDay')}</p>
              <button
                onClick={() => navigate('/compose')}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors"
              >
                + {t('newPost')}
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto">
              {selectedDayPosts.map((post) => {
                const platforms = Array.isArray(post.platforms) ? post.platforms : JSON.parse(post.platforms || '[]');
                const isScheduled = post.status === 'scheduled';

                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {platforms.map((plat) => (
                          <PlatformIcon key={plat} platform={plat} size="xs" showBg={true} />
                        ))}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          post.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : post.status === 'scheduled'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t(post.status)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400">
                      <span>
                        {post.scheduled_at
                          ? `${t('scheduledFor')} ${post.scheduled_at.slice(11, 16)}`
                          : post.published_at
                          ? `${t('publishedAt')} ${post.published_at.slice(11, 16)}`
                          : t('draft')}
                      </span>

                      <div className="flex items-center gap-2">
                        {isScheduled && (
                          <button
                            onClick={() => handlePublishNow(post.id)}
                            title={t('publishImmediately')}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>{t('publishImmediately')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          title={t('deletePost')}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
