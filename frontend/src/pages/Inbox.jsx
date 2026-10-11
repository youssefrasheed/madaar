import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AtSign,
  User,
  ShieldCheck,
  Check,
  Bot,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import PlatformIcon, { PLATFORM_META } from '../components/PlatformIcon';

const PLATFORM_FILTER_OPTIONS = [
  { id: 'all', label: 'جميع المنصات' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
];

export default function Inbox() {
  const { isRTL, t } = useLanguage();

  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, comments: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'comment' | 'message'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'replied'
  const [searchQuery, setSearchQuery] = useState('');

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedTone, setSelectedTone] = useState('friendly');

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlatform !== 'all') params.append('platform', selectedPlatform);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/inbox?${params.toString()}`);
      setMessages(res.data.messages || []);
      setStats(res.data.stats || { total: 0, unread: 0, comments: 0, messages: 0 });

      // Automatically select the first message if none is selected or current message no longer in list
      if (res.data.messages?.length > 0) {
        if (!selectedMessage || !res.data.messages.some(m => m.id === selectedMessage.id)) {
          setSelectedMessage(res.data.messages[0]);
        } else {
          // Update selected message with fresh replies
          const updated = res.data.messages.find(m => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }
      } else {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to load inbox:', err);
      toast.error(isRTL ? 'تعذر جلب صندوق الرسائل والتعليقات' : 'Failed to fetch inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [selectedPlatform, typeFilter, statusFilter]);

  // Handle message selection & mark read
  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    setReplyText('');
    setAiSuggestions([]);

    if (msg.status === 'unread') {
      try {
        await api.put(`/inbox/${msg.id}/status`, { status: 'read' });
        msg.status = 'read';
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      } catch (e) {
        console.error('Failed to mark read:', e);
      }
    }
  };

  // Submit Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/inbox/${selectedMessage.id}/reply`, {
        reply_text: replyText.trim()
      });

      toast.success(
        isRTL
          ? `تم إرسال الرد بنجاح عبر ${PLATFORM_META[selectedMessage.platform]?.name || selectedMessage.platform}!`
          : `Reply published via ${PLATFORM_META[selectedMessage.platform]?.name || selectedMessage.platform}!`
      );

      // Optimistically update
      const newReply = res.data.reply;
      setSelectedMessage(prev => ({
        ...prev,
        status: 'replied',
        replies: [...(prev.replies || []), newReply]
      }));

      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? {
        ...m,
        status: 'replied',
        replies: [...(m.replies || []), newReply]
      } : m));

      setReplyText('');
      setAiSuggestions([]);
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error(isRTL ? 'تعذر إرسال الرد، حاول مجدداً' : 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Fetch AI Reply Suggestions
  const handleGenerateAiSuggestions = async (tone = selectedTone) => {
    if (!selectedMessage) return;
    setLoadingAi(true);
    try {
      const res = await api.post(`/inbox/${selectedMessage.id}/ai-suggestions`, { tone });
      setAiSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      toast.error(isRTL ? 'تعذر توليد الردود بالذكاء الاصطناعي' : 'Failed to generate AI suggestions');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleUseSuggestion = (suggestionText) => {
    setReplyText(suggestionText);
    toast.success(isRTL ? 'تم نسخ الاقتراح إلى خانة الرد ✨' : 'Suggestion inserted into reply box ✨');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            <span>{isRTL ? 'صندوق الرسائل والتعليقات الموحد' : 'Unified Social Inbox'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRTL
              ? 'متابعة والرد على رسائل واستفسارات وتعليقات العملاء عبر جميع المنصات من مكان واحد'
              : 'Monitor & reply to customer comments and direct messages across all platforms'}
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
            <span>{isRTL ? 'الإجمالي:' : 'Total:'}</span>
            <span className="font-mono">{stats.total}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{isRTL ? 'غير مقروء:' : 'Unread:'}</span>
            <span className="font-mono">{stats.unread}</span>
          </span>
          <button
            onClick={fetchInbox}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title={isRTL ? 'تحديث الصندوق' : 'Refresh Inbox'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs by Platform (لكل منصة بشكل منفصل) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-1 overflow-x-auto">
        {PLATFORM_FILTER_OPTIONS.map((p) => {
          const isActive = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.id !== 'all' && <PlatformIcon platform={p.id} size="xs" showBg={false} />}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Filters (Type, Status, Search) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInbox()}
            placeholder={isRTL ? 'ابحث في محتوى التعليق أو اسم العميل...' : 'Search comments, DMs, or user...'}
            className={`w-full py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm`}
          />
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-4 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'all', label: isRTL ? 'الكل' : 'All' },
            { id: 'comment', label: isRTL ? 'تعليقات 💬' : 'Comments 💬' },
            { id: 'message', label: isRTL ? 'رسائل خاصة 📩' : 'DMs 📩' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                typeFilter === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'all', label: isRTL ? 'الحالة: الكل' : 'All Status' },
            { id: 'unread', label: isRTL ? 'غير مقروء 🔴' : 'Unread 🔴' },
            { id: 'replied', label: isRTL ? 'تم الرد 🟢' : 'Replied 🟢' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left / Master Pane: Messages List (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {isRTL ? `قائمة المحادثات (${messages.length})` : `Conversations (${messages.length})`}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {isRTL ? 'انقر لعرض المحادثة والرد' : 'Click to view & reply'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && messages.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <span className="text-xs font-medium">{isRTL ? 'جاري تحميل المحادثات...' : 'Loading messages...'}</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-600" />
                <h4 className="font-bold text-slate-700 text-sm mb-1">
                  {isRTL ? 'لا توجد رسائل أو تعليقات مطابقة' : 'No matching messages'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isRTL ? 'جرّب تغيير المنصة أو فلتر البحث' : 'Try clearing filters to see messages'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === 'unread';
                const isReplied = msg.status === 'replied';

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 relative ${
                      isSelected ? 'bg-indigo-50/60 border-r-4 border-indigo-600' : ''
                    } ${isUnread ? 'bg-white font-medium' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with Platform Badge */}
                      <div className="relative shrink-0">
                        <img
                          src={msg.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={msg.sender_name}
                          className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                        <span className="absolute -bottom-1 -left-1">
                          <PlatformIcon platform={msg.platform} size="xs" showBg={true} />
                        </span>
                      </div>

                      {/* Content preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] text-slate-400 truncate" dir="ltr">
                            {msg.sender_handle}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            msg.type === 'comment' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {msg.type === 'comment' ? (isRTL ? 'تعليق' : 'Comment') : (isRTL ? 'رسالة خاصة' : 'DM')}
                          </span>
                        </div>

                        <p className={`text-xs truncate leading-relaxed ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                          {msg.content}
                        </p>

                        {/* Status chip */}
                        <div className="mt-2 flex items-center justify-between">
                          {isReplied ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isRTL ? 'تم الرد' : 'Replied'}</span>
                            </span>
                          ) : isUnread ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{isRTL ? 'غير مقروء' : 'Unread'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">{isRTL ? 'مقروء' : 'Read'}</span>
                          )}

                          {msg.replies?.length > 0 && (
                            <span className="text-[10px] text-indigo-600 font-bold">
                              {isRTL ? `${msg.replies.length} ردود` : `${msg.replies.length} replies`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right / Detail Pane: Active Conversation & Reply (7 columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedMessage.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={selectedMessage.sender_name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                    />
                    <span className="absolute -bottom-1 -left-1">
                      <PlatformIcon platform={selectedMessage.platform} size="xs" showBg={true} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>{selectedMessage.sender_name}</span>
                      <span className="text-xs text-slate-400 font-mono font-normal" dir="ltr">
                        {selectedMessage.sender_handle}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{PLATFORM_META[selectedMessage.platform]?.name || selectedMessage.platform}</span>
                      <span>•</span>
                      <span>{selectedMessage.type === 'comment' ? (isRTL ? 'تعليق على منشور' : 'Post Comment') : (isRTL ? 'رسالة مباشرة (DM)' : 'Direct Message')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedMessage.status === 'replied'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {selectedMessage.status === 'replied' ? (isRTL ? 'تم الرد' : 'Replied') : (isRTL ? 'نشط' : 'Active')}
                  </span>
                </div>
              </div>

              {/* Post Context Banner (If Comment) */}
              {selectedMessage.post_title && (
                <div className="px-5 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold shrink-0">{isRTL ? 'المنشور المشار إليه:' : 'On Post:'}</span>
                    <span className="text-indigo-700 truncate font-medium">{selectedMessage.post_title}</span>
                  </div>
                </div>
              )}

              {/* Conversation History Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                {/* Incoming message bubble */}
                <div className="flex items-start gap-3">
                  <img
                    src={selectedMessage.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt="sender"
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 mt-1"
                  />
                  <div className="max-w-[85%] bg-white border border-slate-200 p-4 rounded-3xl rounded-tr-none shadow-sm space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-800">{selectedMessage.sender_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(selectedMessage.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>

                {/* Company Replies (if any) */}
                {selectedMessage.replies?.map((r) => (
                  <div key={r.id} className="flex items-start justify-end gap-3">
                    <div className="max-w-[85%] bg-indigo-600 text-white p-4 rounded-3xl rounded-tl-none shadow-md shadow-indigo-600/10 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-indigo-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                          <span>{isRTL ? 'رد الشركة الرسمي' : 'Official Reply'}</span>
                        </span>
                        <span className="text-[10px] text-indigo-200">
                          {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-white leading-relaxed">
                        {r.reply_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Quick Reply Assistant Bar */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isRTL ? 'الرد الذكي بالـ AI (Gemini):' : 'AI Smart Reply (Gemini):'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedTone}
                      onChange={(e) => {
                        setSelectedTone(e.target.value);
                        handleGenerateAiSuggestions(e.target.value);
                      }}
                      className="text-[11px] font-bold bg-white border border-indigo-200 rounded-lg px-2 py-1 text-indigo-900 focus:outline-none"
                    >
                      <option value="friendly">{isRTL ? 'ودود ومرحب 🌟' : 'Friendly'}</option>
                      <option value="professional">{isRTL ? 'رسمي واحترافي 👔' : 'Professional'}</option>
                      <option value="sales">{isRTL ? 'تسويقي وتوجيه 🛒' : 'Sales / CTA'}</option>
                      <option value="support">{isRTL ? 'دعم فني سريع 🛠️' : 'Support'}</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleGenerateAiSuggestions(selectedTone)}
                      disabled={loadingAi}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Zap className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
                      <span>{isRTL ? 'توليد اقتراحات' : 'Generate'}</span>
                    </button>
                  </div>
                </div>

                {/* Suggestions chips */}
                {aiSuggestions.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5 animate-in fade-in duration-200">
                    {aiSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        onClick={() => handleUseSuggestion(sug.text)}
                        className="bg-white hover:bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                            {sug.tone}
                          </span>
                          <p className="text-xs text-slate-700 truncate group-hover:text-indigo-900">
                            {sug.text}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 shrink-0 group-hover:underline">
                          {isRTL ? 'استخدام الرد ↵' : 'Use ↵'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Compose Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isRTL
                        ? `اكتب ردك المباشر لـ ${selectedMessage.sender_name}... (سيتم نشره عبر ${PLATFORM_META[selectedMessage.platform]?.name || selectedMessage.platform})`
                        : `Write reply to ${selectedMessage.sender_name}...`}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-40 shrink-0 h-11"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        <span>{isRTL ? 'إرسال الرد' : 'Send Reply'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                {isRTL ? 'اختر تعليقاً أو رسالة للبدء بالرد' : 'Select a message to start replying'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {isRTL
                  ? 'يمكنك التبديل بين المنصات المختلفة في القائمة واختيار أي استفسار للرد عليه فوراً مع توليد ردود ذكية بالـ AI.'
                  : 'Filter by platform and click any comment to open conversation and reply.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
