import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  PenSquare,
  CalendarDays,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Sparkles,
  Bot,
  Menu,
  X,
  PlusCircle,
  Globe,
  Share2,
  Building2,
  MessageSquare,
  CheckCheck,
  Inbox as InboxIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PlatformIcon from './PlatformIcon';
import MadaarLogo from './MadaarLogo';
import ClientSwitcher from './ClientSwitcher';

const SIDEBAR_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isRTL, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('accounts'), path: '/accounts', icon: Users2 },
    { name: t('compose'), path: '/compose', icon: PenSquare },
    { name: t('calendar'), path: '/calendar', icon: CalendarDays },
    { name: t('inbox'), path: '/inbox', icon: MessageSquare },
    { name: t('analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('companyProfile'), path: '/profile', icon: Building2 },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success(isRTL ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read');
    } catch (err) {
      toast.error(isRTL ? 'فشل تحديث الإشعارات' : 'Failed to update notifications');
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotificationsOpen(false);
      navigate('/inbox');
    } catch (err) {
      navigate('/inbox');
    }
  };

  const formatNotifTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return isRTL ? 'الآن' : 'just now';
      if (diffMins < 60) return `${diffMins} ${isRTL ? 'د' : 'm'}`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ${isRTL ? 'س' : 'h'}`;
      return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const aiNavItems = [
    { name: t('aiFeatures'), path: '/ai', icon: Sparkles },
    { name: t('aiAssistant'), path: '/assistant', icon: Bot },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: RIGHT on RTL, LEFT on LTR */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col w-72 bg-[#0f172a] text-slate-200 transition-all duration-300 ease-in-out ${
          isRTL
            ? `border-l border-slate-800 ${mobileMenuOpen ? 'right-0' : '-right-72 lg:right-0'} left-auto`
            : `border-r border-slate-800 ${mobileMenuOpen ? 'left-0' : '-left-72 lg:left-0'} right-auto`
        }`}
      >
        {/* Brand Header - Centered & Enlarged */}
        <div className="relative min-h-[96px] py-4 px-6 flex items-center justify-center border-b border-slate-800/80">
          <MadaarLogo isRTL={isRTL} size="sidebar" className="mx-auto" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={`lg:hidden absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="px-5 pt-5 pb-2">
          <button
            onClick={() => {
              navigate('/compose');
              setMobileMenuOpen(false);
            }}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>{t('newPost')}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.path === '/inbox' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500 text-white shadow-sm shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* AI Section Divider */}
          <div className="pt-4 pb-1.5 px-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('aiFeatures')}
            </span>
          </div>

          {aiNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-400 font-semibold border border-purple-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 text-purple-400" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Connected Platform Status */}
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t('connectedChannels')}
              </span>
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                {t('live')}
              </span>
            </div>
            <div className="px-2 py-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-around">
              {SIDEBAR_PLATFORMS.map((platform) => (
                <div key={platform} className="relative group cursor-pointer" onClick={() => navigate('/accounts')}>
                  <PlatformIcon platform={platform} size="xs" showBg={false} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1120]">
          <div className="flex items-center justify-between">
            <div
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1 hover:opacity-90 transition-opacity"
              title={t('companyProfile')}
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Profile"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">
                  {user?.name || 'Company Profile'}
                </p>
                <p className="text-xs text-slate-400 truncate leading-normal" dir="ltr">
                  {user?.email || 'admin@madaar.io'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t('signOut')}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (margins adapt to sidebar side) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isRTL ? 'lg:mr-72 lg:ml-0' : 'lg:ml-72 lg:mr-0'}`}>
        {/* Top Navbar */}
        <header className="h-18 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block w-72">
              <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className={`w-full py-2 bg-slate-100/80 text-sm rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 ${
                  isRTL ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4 text-left'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Client / Company Switcher (Multi-Tenant Workspace Selector) */}
            <ClientSwitcher />

            {/* Language Switcher Button */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300"
              title="Toggle Language / تبديل اللغة"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>{isRTL ? '🇬🇧 English' : '🇪🇬 العربية'}</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  notificationsOpen
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={t('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center ring-2 ring-white shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {notificationsOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div
                    className={`absolute top-full mt-2.5 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden ${
                      isRTL ? 'left-0 sm:left-0' : 'right-0 sm:right-0'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">
                          {t('notifications')}
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} {isRTL ? 'جديد' : 'new'}
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-12 px-4 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">{isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                              !notif.is_read
                                ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              <PlatformIcon platform={notif.platform} size="sm" showBg={true} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatNotifTime(notif.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer link to Social Inbox */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/inbox');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl hover:bg-indigo-50/80 transition-colors"
                      >
                        <InboxIcon className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'عرض كل الرسائل والتعليقات في الصندوق' : 'Open Social Inbox'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
