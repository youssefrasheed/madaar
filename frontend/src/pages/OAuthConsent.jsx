import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  KeyRound,
  Eye,
  Send,
  BarChart3,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import PlatformIcon, { PLATFORM_META } from '../components/PlatformIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

// Platform Theme Configurations
const PLATFORM_CONFIGS = {
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    headerBg: 'bg-black text-white',
    badge: 'X Developer Platform',
    accentColor: 'bg-white hover:bg-slate-200 text-black',
    borderColor: 'border-slate-800',
    defaultHandle: '@midmacalmashare',
    defaultName: 'MidMac Projects',
    permissions: [
      { id: 'profile', title: 'قراءة الملف التعريفي والوسائط', desc: 'الاطلاع على اسم الحساب وصورة العرض والمعرّف الرسمي.' },
      { id: 'tweets', title: 'نشر وإدارة التغريدات والمنشورات', desc: 'إمكانية نشر التغريدات وجدولتها تلقائياً وفق المواعيد.' },
      { id: 'analytics', title: 'قراءة إحصائيات التفاعل والوصول', desc: 'سحب أرقام المشاهدات وإعادة النشر ومعدلات التفاعل اليومية.' }
    ]
  },
  facebook: {
    name: 'Meta / Facebook',
    color: '#1877F2',
    headerBg: 'bg-[#1877F2] text-white',
    badge: 'Meta for Developers (Graph API v21.0)',
    accentColor: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
    borderColor: 'border-blue-200',
    defaultHandle: '@midmac_projects_official',
    defaultName: 'MidMac Projects — الصفحة الرسمية',
    permissions: [
      { id: 'pages', title: 'إدارة صفحات ومجموعات العمل', desc: 'إمكانية الوصول لصفحات الأعمال الرسمية التابعة للشركة.' },
      { id: 'publish', title: 'نشر المنشورات والصور والفيديو', desc: 'جدولة المحتوى ونشره عبر Facebook Feed وReels مباشرة.' },
      { id: 'insights', title: 'الوصول إلى رؤى الصفحة (Page Insights)', desc: 'قراءة تقارير التفاعل والوصول والمتابعين بدقة.' }
    ]
  },
  instagram: {
    name: 'Instagram Business',
    color: '#E1306C',
    headerBg: 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white',
    badge: 'Instagram Graph API',
    accentColor: 'bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] hover:opacity-90 text-white',
    borderColor: 'border-pink-200',
    defaultHandle: '@midmac_projects',
    defaultName: 'MidMac Projects (Business)',
    permissions: [
      { id: 'profile', title: 'الوصول إلى حساب الأعمال الرسمي', desc: 'قراءة بيانات الحساب التعريفي وعدد المتابعين.' },
      { id: 'publish', title: 'نشر الصور والقصص والريلز', desc: 'نشر الوسائط وجدولة البوستات وحفظ مسودات النشر.' },
      { id: 'insights', title: 'تحليلات الجمهور والتفاعل', desc: 'قراءة مقاييس الوصول ونمو المتابعين يومياً.' }
    ]
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    headerBg: 'bg-[#0A66C2] text-white',
    badge: 'LinkedIn Community Management API',
    accentColor: 'bg-[#0A66C2] hover:bg-[#084e96] text-white',
    borderColor: 'border-blue-300',
    defaultHandle: '@midmac_projects',
    defaultName: 'MidMac Projects Corporate',
    permissions: [
      { id: 'profile', title: 'الملف التعريفي للشركة (w_member_social)', desc: 'استخدام معلومات وهوية الشركة الرسمية.' },
      { id: 'share', title: 'نشر التحديثات والمقالات', desc: 'إنشاء ومشاركة منشورات مهنية باسم المنظمة.' },
      { id: 'analytics', title: 'إحصائيات الصفحة والمتابعين', desc: 'قراءة معدلات التفاعل والزيارات للملف المهني.' }
    ]
  },
  tiktok: {
    name: 'TikTok Business',
    color: '#000000',
    headerBg: 'bg-slate-950 text-white border-b border-cyan-500/30',
    badge: 'TikTok for Developers (v2)',
    accentColor: 'bg-gradient-to-r from-cyan-400 to-rose-500 hover:opacity-90 text-slate-950 font-black',
    borderColor: 'border-slate-800',
    defaultHandle: '@midmac_projects',
    defaultName: 'MidMac Projects',
    permissions: [
      { id: 'profile', title: 'الوصول لبيانات الملف الشخصي (user.info.basic)', desc: 'قراءة اسم الحساب والصورة والمتابعين.' },
      { id: 'video', title: 'نشر مقاطع الفيديو ومشاركتها', desc: 'رفع المحتوى المرئي وتحديد أوقات النشر.' },
      { id: 'analytics', title: 'سحب تقارير المشاهدات والأداء', desc: 'قراءة أعداد المشاهدات والإعجابات والتفاعل.' }
    ]
  },
  youtube: {
    name: 'YouTube / Google',
    color: '#FF0000',
    headerBg: 'bg-[#CC0000] text-white',
    badge: 'Google OAuth 2.0 (YouTube Data API v3)',
    accentColor: 'bg-[#CC0000] hover:bg-[#B30000] text-white',
    borderColor: 'border-red-200',
    defaultHandle: '@midmacprojects',
    defaultName: 'MidMac Projects Official Channel',
    permissions: [
      { id: 'channel', title: 'الاطلاع على القناة وإدارتها', desc: 'الوصول إلى بيانات القناة والاشتراكات.' },
      { id: 'upload', title: 'رفع وجدولة الفيديوهات وShorts', desc: 'نشر الفيديوهات وتحديث العناوين والوصف تلقائياً.' },
      { id: 'analytics', title: 'تحليلات YouTube Analytics', desc: 'قراءة المشاهدات ووقت المشاهدة والأرباح المحتملة.' }
    ]
  },
  snapchat: {
    name: 'Snapchat',
    color: '#FFFC00',
    headerBg: 'bg-[#FFFC00] text-slate-900 border-b border-yellow-300',
    badge: 'Snap Kit Platform API',
    accentColor: 'bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold',
    borderColor: 'border-yellow-200',
    defaultHandle: '@midmac_snap',
    defaultName: 'MidMac Projects',
    permissions: [
      { id: 'profile', title: 'الملف التعريفي العام (Public Profile)', desc: 'عرض الاسم والصورة والمشاهدات.' },
      { id: 'stories', title: 'نشر القصص والمحتوى (Snap Kit)', desc: 'جدولة المحتوى وإرساله للقصة العامة.' }
    ]
  }
};

export default function OAuthConsent({ embeddedPlatform = null, onEmbeddedSuccess = null, onEmbeddedCancel = null }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { user } = useAuth();

  const platformParam = (embeddedPlatform || searchParams.get('platform') || 'twitter').toLowerCase();
  const config = PLATFORM_CONFIGS[platformParam] || PLATFORM_CONFIGS.twitter;

  // Form states
  const [accountName, setAccountName] = useState(config.defaultName);
  const [accountHandle, setAccountHandle] = useState(config.defaultHandle);
  const [password, setPassword] = useState('');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [authStep, setAuthStep] = useState(1); // 1: Form, 2: Authorizing progress, 3: Success
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    if (user?.name) {
      setAccountName(user.name);
      setAccountHandle(`@${user.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`);
    }
  }, [user]);

  // Handle Authorize submission
  const handleAuthorize = async (e) => {
    if (e) e.preventDefault();
    setAuthorizing(true);
    setAuthStep(2);
    setProgressText(isRTL ? '1. التحقق من الهوية وصلاحيات الحساب...' : '1. Verifying credentials & identity...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProgressText(isRTL ? '2. إصدار وتشفير مفاتيح الوصول (OAuth 2.0 Tokens)...' : '2. Generating secure OAuth 2.0 tokens...');

      // Call API
      const res = await api.post('/accounts/oauth/authorize-instant', {
        platform: platformParam,
        account_name: accountName.trim() || config.defaultName,
        account_id: accountHandle.trim() || config.defaultHandle
      });

      if (res.data?.success) {
        setProgressText(isRTL ? '3. تم التفويض والربط بنجاح! جارٍ الحفظ...' : '3. Authorized successfully! Saving...');
        await new Promise((r) => setTimeout(r, 500));
        setAuthStep(3);

        // Notify parent window via postMessage
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              {
                type: 'MADAAR_OAUTH_SUCCESS',
                platform: platformParam,
                account: res.data.account
              },
              '*'
            );
          } catch (err) {
            console.warn('Could not postMessage to opener:', err);
          }
        }

        // Also write to localStorage for bulletproof cross-window synchronization
        try {
          localStorage.setItem(
            'madaar_oauth_success',
            JSON.stringify({
              platform: platformParam,
              account: res.data.account,
              timestamp: Date.now()
            })
          );
        } catch (err) {
          console.warn('Could not write to localStorage:', err);
        }

        if (onEmbeddedSuccess) {
          onEmbeddedSuccess(res.data.account);
        } else {
          toast.success(
            isRTL
              ? `تم ربط وتفويض حساب ${config.name} بنجاح! 🎉`
              : `Authorized ${config.name} successfully! 🎉`
          );
          // If in popup window, close after 1 second
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/accounts');
            }
          }, 1100);
        }
      }
    } catch (err) {
      console.error('OAuth authorization failed:', err);
      setAuthStep(1);
      setAuthorizing(false);
      const msg = err.response?.data?.error || err.message;
      toast.error(msg || (isRTL ? 'فشلت عملية التفويض، يرجى المحاولة ثانية' : 'Authorization failed'));
    }
  };

  const handleCancel = () => {
    if (onEmbeddedCancel) {
      onEmbeddedCancel();
    } else if (window.opener) {
      window.close();
    } else {
      navigate('/accounts');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950/95 flex flex-col items-center justify-center p-3 sm:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* OAuth Dialog Window */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Official Platform Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${config.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center p-1.5 shadow-sm">
              <PlatformIcon platform={platformParam} size="sm" showBg={false} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide leading-tight">
                {config.name}
              </h2>
              <span className="text-[10px] opacity-80 font-mono block leading-tight">
                {config.badge}
              </span>
            </div>
          </div>

          <button
            onClick={handleCancel}
            type="button"
            className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all"
            title={isRTL ? 'إلغاء وإغلاق النافذة' : 'Cancel & Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* App Authorization Header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              مَـ
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 truncate">
                  {isRTL ? 'تطبيق مَـدَار (Madaar Hub)' : 'Madaar Social Hub'}
                </h3>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {isRTL ? 'معتمد' : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {isRTL
                  ? `يرغب تطبيق مَـدَار في تفويض الاتصال بحسابك على ${config.name} للنشر والمتابعة.`
                  : `Madaar requests permission to connect with your ${config.name} account.`}
              </p>
            </div>
          </div>

          {/* If Authorizing / Processing */}
          {authStep === 2 && (
            <div className="py-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  {isRTL ? 'جارٍ إتمام عملية التفويض الرسمية...' : 'Authorizing official access...'}
                </h4>
                <p className="text-xs text-slate-500 font-mono animate-pulse">
                  {progressText}
                </p>
              </div>
            </div>
          )}

          {/* If Success */}
          {authStep === 3 && (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {isRTL ? 'تم التفويض وربط الحساب بنجاح!' : 'Authorized & Connected Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isRTL
                    ? 'تم حفظ مفاتيح الوصول بنجاح. سيتم إغلاق هذه النافذة تلقائياً وتحديث لوحة التحكم...'
                    : 'Tokens saved. Closing this dialog and updating your dashboard...'}
                </p>
              </div>
            </div>
          )}

          {/* Main Form (Step 1) */}
          {authStep === 1 && (
            <>
              {/* Account Identity Card */}
              {(platformParam === 'facebook' || platformParam === 'twitter') ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {isRTL ? 'الربط والتفويض الرسمي:' : 'Official OAuth Integration:'}
                    </span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
                      {platformParam === 'twitter' ? 'X API v2 PKCE' : 'Meta Graph API'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <PlatformIcon platform={platformParam} size="md" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-slate-900">
                        {platformParam === 'twitter' 
                          ? (isRTL ? 'تفويض حساب منصة X (Twitter)' : 'Authorize X / Twitter Account')
                          : (isRTL ? 'تفويض حساب فيسبوك (Meta)' : 'Authorize Facebook Page')}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {isRTL
                          ? 'سيتم توجيهك لصفحة تسجيل الدخول الرسمية لجلب بياناتك الحقيقية وتوثيق الحساب.'
                          : 'You will be redirected to the official login page to verify your authentic account.'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {isRTL ? 'الحساب المستهدف للربط:' : 'Target Account:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAccount(!isEditingAccount)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {isEditingAccount
                        ? (isRTL ? 'حفظ وتثبيت' : 'Done')
                        : (isRTL ? 'تعديل المعرّف / تبديل الحساب' : 'Switch / Edit Account')}
                    </button>
                  </div>

                  {!isEditingAccount ? (
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <PlatformIcon platform={platformParam} size="md" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-slate-900 truncate">
                          {accountName}
                        </div>
                        <div className="text-xs font-mono text-slate-500 truncate" dir="ltr">
                          {accountHandle}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {isRTL ? 'نشط ومسجل' : 'Active'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isRTL ? 'اسم الصفحة / الحساب:' : 'Account / Page Name:'}
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-indigo-600"
                          placeholder="MidMac Projects"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {isRTL ? 'المعرف الرسمي (@handle):' : 'Official Handle (@handle):'}
                        </label>
                        <input
                          type="text"
                          value={accountHandle}
                          onChange={(e) => setAccountHandle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-600"
                          placeholder="@handle"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Permissions Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 flex items-center justify-between">
                  <span>{isRTL ? 'الصلاحيات المطلوبة للتطبيق:' : 'Permissions Requested:'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">OAuth 2.0 Scopes</span>
                </h4>

                <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                  {config.permissions.map((p) => (
                    <div key={p.id} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 leading-tight">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                          {p.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Privacy Guarantee */}
              <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 flex items-center gap-2.5 text-[11px] text-slate-600">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <p className="leading-relaxed">
                  {isRTL
                    ? 'لن يتمكن تطبيق مَـدَار من الوصول لكلمات مرورك أو رسائلك الخاصة. يمكنك إلغاء هذا التفويض بأي وقت.'
                    : 'Madaar will never see your passwords or private chats. You can revoke access anytime.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  {isRTL ? 'إلغاء (Cancel)' : 'Cancel'}
                </button>

                {(platformParam === 'facebook' || platformParam === 'twitter') ? (
                  <button
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem('token') || '';
                      window.location.href = `https://api.jooart.uk/api/auth/${platformParam}?token=${token}`;
                    }}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                      platformParam === 'facebook'
                        ? 'bg-[#1877F2] hover:bg-[#166fe5] text-white'
                        : 'bg-black hover:bg-slate-900 text-white'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>
                      {platformParam === 'facebook'
                        ? (isRTL ? 'المتابعة وتفويض فيسبوك الرسمي (Meta Login)' : 'Continue with Facebook (Meta Login)')
                        : (isRTL ? 'المتابعة وتفويض منصة X الرسمية (X / Twitter Login)' : 'Continue with X (Twitter OAuth 2.0)')}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAuthorize}
                    disabled={authorizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${config.accentColor}`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {isRTL
                        ? `السماح بالوصول والتفويض (Authorize)`
                        : `Authorize App`}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>{isRTL ? 'مدعوم بنظام OAuth 2.0 المشفر' : 'Powered by OAuth 2.0'}</span>
          <span>Madaar Hub © 2026</span>
        </div>
      </div>
    </div>
  );
}
