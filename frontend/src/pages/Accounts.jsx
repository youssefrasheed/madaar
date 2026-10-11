import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  Plus,
  Edit3,
  X,
  Key,
  Building,
  AtSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlatformIcon, { PLATFORM_META } from '../components/PlatformIcon';
import api from '../api/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import OAuthConsent from './OAuthConsent';

const ALL_PLATFORMS = [
  { platform: 'facebook', defaultName: 'Facebook Business Page', limit: 63206, defaultFollowers: 0 },
  { platform: 'instagram', defaultName: 'Instagram Professional', limit: 2200, defaultFollowers: 0 },
  { platform: 'twitter', defaultName: 'X / Twitter Company Profile', limit: 280, defaultFollowers: 0 },
  { platform: 'linkedin', defaultName: 'LinkedIn Organization Page', limit: 3000, defaultFollowers: 0 },
  { platform: 'tiktok', defaultName: 'TikTok Business Account', limit: 2200, defaultFollowers: 0 },
  { platform: 'youtube', defaultName: 'YouTube Official Channel', limit: 5000, defaultFollowers: 0 },
  { platform: 'snapchat', defaultName: 'Snapchat Public Profile', limit: 250, defaultFollowers: 0 },
];

export default function Accounts() {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const [dbAccounts, setDbAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'connected' | 'disconnected'
  const [actionId, setActionId] = useState(null);

  // Modal State for Connecting / Editing an Account via API
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlatform, setModalPlatform] = useState(null);
  const [apiToken, setApiToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [fetchingApi, setFetchingApi] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [instantConnecting, setInstantConnecting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setDbAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts from database:', err);
      toast.error(isRTL ? 'تعذر جلب الحسابات من قاعدة البيانات' : 'Failed to fetch accounts from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Listen for OAuth completion from popup window
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'MADAAR_OAUTH_SUCCESS') {
        const platformName = PLATFORM_META[event.data.platform]?.name || event.data.platform;
        toast.success(
          isRTL
            ? `تم تفويض وربط حساب ${platformName} بنجاح! 🎉`
            : `Connected ${platformName} successfully! 🎉`
        );
        fetchAccounts();
      }
    };

    // Listen for cross-window storage event as fallback
    const handleStorageChange = (e) => {
      if (e.key === 'madaar_oauth_success' && e.newValue) {
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Support multiple accounts per platform while showing unconnected channels
  const connectedItems = dbAccounts.map((a) => ({
    platform: a.platform,
    dbId: a.id,
    name: a.account_name,
    accountId: a.account_id,
    connected: true,
    followers: a.followers_count !== undefined ? a.followers_count : 0,
    avatar: a.profile_pic || null,
    limit: ALL_PLATFORMS.find((p) => p.platform === a.platform)?.limit || 280,
  }));

  const disconnectedPlatforms = ALL_PLATFORMS.filter(
    (p) => !dbAccounts.some((a) => a.platform === p.platform)
  ).map((p) => ({
    platform: p.platform,
    dbId: null,
    name: user?.name ? `${user.name} - ${PLATFORM_META[p.platform]?.name}` : p.defaultName,
    accountId: `@${(user?.name || 'company').toLowerCase().replace(/\s+/g, '_')}`,
    connected: false,
    followers: 0,
    avatar: null,
    limit: p.limit,
  }));

  const accountsList = [...connectedItems, ...disconnectedPlatforms];

  // Open authentic interactive OAuth Login & Consent Popup
  const openOAuthPopup = (platformKey) => {
    const width = 600;
    const height = 750;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

    // If platform is facebook or twitter, route directly to real official OAuth endpoint!
    const token = localStorage.getItem('token') || '';
    const isRealOAuth = (platformKey === 'facebook' || platformKey === 'twitter');
    const targetUrl = isRealOAuth
      ? `https://api.jooart.uk/api/auth/${platformKey}?token=${token}`
      : `/oauth/authorize?platform=${platformKey}`;

    if (isRealOAuth) {
      try {
        const popup = window.open(
          targetUrl,
          `oauth_${platformKey}`,
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,scrollbars=yes`
        );
        // If popup blocker intervened or mobile view, navigate directly to official OAuth!
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = targetUrl;
        }
      } catch (err) {
        window.location.href = targetUrl;
      }
      return;
    }

    try {
      const popup = window.open(
        targetUrl,
        `oauth_${platformKey}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,scrollbars=yes`
      );

      // If popup blocker intervened or mobile view, open modal directly
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        const acct = accountsList.find((a) => a.platform === platformKey) || { platform: platformKey };
        setModalPlatform(acct);
        setModalOpen(true);
      }
    } catch (err) {
      const acct = accountsList.find((a) => a.platform === platformKey) || { platform: platformKey };
      setModalPlatform(acct);
      setModalOpen(true);
    }
  };

  const openConnectModal = (account) => {
    openOAuthPopup(account.platform);
  };

  // 1-Click Instant OAuth for business clients (Zero developer setup)
  const handleInstantOAuth = async () => {
    if (!modalPlatform) return;
    setInstantConnecting(true);
    try {
      const res = await api.post('/accounts/oauth/authorize-instant', {
        platform: modalPlatform.platform,
      });
      if (res.data.success) {
        toast.success(
          isRTL
            ? `تم تفويض وربط حساب ${PLATFORM_META[modalPlatform.platform]?.name} بنجاح بضغطة زر! 🎉`
            : `Connected ${PLATFORM_META[modalPlatform.platform]?.name} successfully via 1-Click OAuth! 🎉`
        );
        setModalOpen(false);
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Instant OAuth error:', err);
      const msg = err.response?.data?.error || err.message;
      toast.error(msg || (isRTL ? 'تعذر إتمام عملية التفويض' : 'Failed to authorize account'));
    } finally {
      setInstantConnecting(false);
    }
  };

  const handleAutoFetch = async (overrideToken = null) => {
    const tokenToUse = overrideToken !== null ? overrideToken : apiToken;
    if (!tokenToUse || !tokenToUse.trim()) {
      toast.error(isRTL ? 'يُرجى إدخال رمز الـ API / Access Token' : 'Please enter API / Access Token');
      return null;
    }

    setFetchingApi(true);
    try {
      const res = await api.post('/accounts/fetch-info', {
        platform: modalPlatform.platform,
        access_token: tokenToUse.trim(),
        page_id: pageId.trim() || undefined,
      });
      if (res.data.success && res.data.account) {
        setFetchedData(res.data.account);
        toast.success(
          isRTL
            ? `تم سحب بيانات الحساب والتحقق بنجاح من ${PLATFORM_META[modalPlatform.platform]?.name}! ⚡`
            : 'Account data fetched & verified successfully!'
        );
        return res.data.account;
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast.error(msg || (isRTL ? 'تعذر سحب البيانات من الـ API' : 'Failed to fetch from API'));
      return null;
    } finally {
      setFetchingApi(false);
    }
  };

  const handleQuickDemoConnect = async () => {
    const demoToken = `token_${modalPlatform.platform}_verified_${Date.now().toString().slice(-5)}`;
    setApiToken(demoToken);
    await handleAutoFetch(demoToken);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    let accountToSave = fetchedData;

    if (!accountToSave) {
      if (!apiToken.trim()) {
        toast.error(isRTL ? 'يُرجى إدخال رمز الـ API وسحب البيانات أولاً' : 'Please enter API Token and fetch data first');
        return;
      }
      accountToSave = await handleAutoFetch();
    }

    if (!accountToSave) return;

    setActionId(modalPlatform.platform);
    try {
      await api.post('/accounts', {
        platform: modalPlatform.platform,
        account_name: accountToSave.account_name,
        account_id: accountToSave.account_id,
        access_token: apiToken.trim() || `token_${modalPlatform.platform}_verified`,
        profile_pic: accountToSave.profile_pic,
        followers_count: Number(accountToSave.followers_count) || 0,
      });

      toast.success(
        isRTL
          ? `تم ربط حساب «${accountToSave.account_name}» بنجاح لحساب الشركة!`
          : `Connected «${accountToSave.account_name}» successfully to company account!`
      );
      setModalOpen(false);
      await fetchAccounts();
    } catch (err) {
      console.error('Account connect error:', err);
      toast.error(isRTL ? 'حدث خطأ أثناء حفظ الحساب' : 'Failed to save account');
    } finally {
      setActionId(null);
    }
  };

  const handleDisconnect = async (account) => {
    if (!account.dbId) return;
    setActionId(account.platform);
    try {
      await api.delete(`/accounts/${account.dbId}`);
      toast.success(
        isRTL
          ? `تم فصل حساب ${account.name} بنجاح من قاعدة البيانات`
          : `Disconnected ${account.name} from database`
      );
      await fetchAccounts();
    } catch (err) {
      console.error('Account disconnect error:', err);
      toast.error(isRTL ? 'حدث خطأ أثناء فصل الحساب' : 'Failed to disconnect account');
    } finally {
      setActionId(null);
    }
  };

  const filteredAccounts = accountsList.filter((acc) => {
    if (filter === 'connected') return acc.connected;
    if (filter === 'disconnected') return !acc.connected;
    return true;
  });

  const connectedCount = accountsList.filter((a) => a.connected).length;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Number(num).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('accountsTitle')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRTL
              ? `إدارة وربط حسابات السوشيال ميديا الخاصة بشركة: ${user?.name || 'الشركة'}`
              : `Manage and connect social media channels for: ${user?.name || 'Company'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add & Authorize Channel Button */}
          <button
            type="button"
            onClick={() => {
              const firstDisconnected = accountsList.find((a) => !a.connected);
              openOAuthPopup(firstDisconnected ? firstDisconnected.platform : 'twitter');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إضافة وتفويض حساب جديد' : 'Add & Authorize Channel'}</span>
          </button>

          {/* Filters */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto">
            {[
              { id: 'all', label: t('allAccounts') },
              { id: 'connected', label: t('connectedOnly') },
              { id: 'disconnected', label: t('disconnectedOnly') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info status strip */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            {connectedCount}/{accountsList.length}
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <span>
                {isRTL
                  ? `${connectedCount} من ${accountsList.length} منصات متصلة بحساب (${user?.name || user?.email})`
                  : `${connectedCount} of ${accountsList.length} channels connected to (${user?.name || user?.email})`}
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                SQLite Live
              </span>
            </h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              {isRTL
                ? 'الحسابات المتصلة ستظهر تلقائياً في صفحة إنشاء المنشورات، التقويم، والإحصائيات التراكمية.'
                : 'Connected channels appear in Compose, Calendar, and Analytics automatically.'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAccounts}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white px-3.5 py-2 rounded-xl border border-indigo-200 self-start sm:self-auto transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isRTL ? 'تحديث ومزامنة' : 'Refresh Channels'}</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAccounts.map((account) => {
          const isActing = actionId === account.platform;
          return (
            <div
              key={account.platform}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                account.connected
                  ? 'border-indigo-100 ring-1 ring-indigo-500/10 hover:shadow-md'
                  : 'border-slate-200/60 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {account.connected && account.avatar ? (
                      <div className="relative shrink-0">
                        <img
                          src={account.avatar}
                          alt={account.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm bg-slate-100"
                        />
                        <span className="absolute -bottom-1 -left-1">
                          <PlatformIcon platform={account.platform} size="xs" showBg={true} />
                        </span>
                      </div>
                    ) : (
                      <PlatformIcon platform={account.platform} size="md" />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {PLATFORM_META[account.platform]?.name || account.platform}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[170px]">
                        {account.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      account.connected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {account.connected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{t('connected')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>{t('disconnected')}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 py-4 my-2 border-y border-slate-100 bg-slate-50/60 rounded-2xl px-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {t('followers')}
                    </span>
                    <span className="text-base font-black text-slate-800">
                      {account.connected ? formatNumber(account.followers) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {t('characterLimit')}
                    </span>
                    <span className="text-base font-black text-slate-800">
                      {account.limit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {account.connected && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                    <AtSign className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{account.accountId}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2">
                {account.connected ? (
                  <>
                    <button
                      onClick={() => openConnectModal(account)}
                      disabled={isActing}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'تعديل البيانات' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(account)}
                      disabled={isActing}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
                    >
                      {isActing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{t('disconnect')}</span>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openConnectModal(account)}
                    disabled={isActing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isActing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{isRTL ? `ربط حساب ${PLATFORM_META[account.platform]?.name}` : `Connect ${PLATFORM_META[account.platform]?.name}`}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONNECT / EDIT ACCOUNT MODAL (Interactive OAuth Dialog Fallback / Mobile View) */}
      {modalOpen && modalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg my-auto relative">
            <OAuthConsent
              embeddedPlatform={modalPlatform.platform}
              onEmbeddedSuccess={(savedAccount) => {
                setModalOpen(false);
                fetchAccounts();
                toast.success(
                  isRTL
                    ? `تم تفويض وربط حساب ${PLATFORM_META[modalPlatform.platform]?.name || ''} بنجاح! 🎉`
                    : `Connected ${PLATFORM_META[modalPlatform.platform]?.name || ''} successfully! 🎉`
                );
              }}
              onEmbeddedCancel={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
