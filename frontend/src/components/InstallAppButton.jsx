import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Check, X, Share2, PlusSquare, Copy, Compass, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

export default function InstallAppButton({ className = '', variant = 'sidebar' }) {
  const { isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ isFirefox: false, isIos: false, isChrome: false, isEdge: false });

  useEffect(() => {
    // Check if already in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isFx = /firefox|fxios/.test(ua);
    const isEdg = /edg\//.test(ua);
    const isChr = /chrome|crios/.test(ua) && !isEdg;

    setBrowserInfo({
      isFirefox: isFx,
      isIos: isIosDevice,
      isChrome: isChr,
      isEdge: isEdg,
    });

    if (isIosDevice || isFx) {
      setIsInstallable(true);
    }

    // Listen for Chromium / Mac / Windows install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (browserInfo.isIos || browserInfo.isFirefox) {
      setShowGuideModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    return null; // Don't show if already running inside installed standalone app
  }

  // Variant 1: Compact button for Login page
  if (variant === 'login') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-cyan-300 border border-cyan-500/30 shadow-md backdrop-blur-sm text-xs font-bold transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isRTL ? 'تحميل كتطبيق (Mac / PC / Mobile)' : 'Install Web App'}</span>
        </button>

        {showGuideModal && (
          <InstallInstructionsModal
            isRTL={isRTL}
            browserInfo={browserInfo}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Variant 2: Top Header Button
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/80 shadow-sm text-xs font-bold transition-all ${className}`}
          title={isRTL ? 'تثبيت المنصة كتطبيق' : 'Install Madaar App'}
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">
            {isRTL ? 'تثبيت التطبيق' : 'Install App'}
          </span>
        </button>

        {showGuideModal && (
          <InstallInstructionsModal
            isRTL={isRTL}
            browserInfo={browserInfo}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Variant 3: Sidebar Card
  return (
    <>
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 shadow-lg text-right ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-white">
            {isRTL ? 'تطبيق مَـدَار' : 'Madaar App'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          {isRTL
            ? 'حمّل المنصة كتطبيق سطح مكتب للماك والويندوز أو على هاتفك لسرعة الوصول.'
            : 'Install Madaar on your Mac, Windows PC, or smartphone for instant access.'}
        </p>
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isRTL ? 'تثبيت التطبيق الآن' : 'Install App Now'}</span>
        </button>
      </div>

      {showGuideModal && (
        <InstallInstructionsModal
          isRTL={isRTL}
          browserInfo={browserInfo}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
}

/**
 * Universal Install Guide Modal with dedicated Firefox, Chrome/Edge, and Safari instructions
 */
function InstallInstructionsModal({ isRTL, browserInfo, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(isRTL ? 'تم نسخ الرابط! يمكنك فتحه في Chrome لتثبيته فوراً 🚀' : 'Link copied! Open in Chrome to install 🚀');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white text-right relative max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 mx-auto">
          <Download className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-white text-center mb-1.5">
          {isRTL ? 'تثبيت مَـدَار كتطبيق على جهازك' : 'Install Madaar on your Device'}
        </h3>
        <p className="text-xs text-slate-400 text-center mb-5 leading-relaxed">
          {isRTL
            ? 'يعمل مَـدَار كتطبيق ويب تقدمي فائق السرعة (PWA) دون الحاجة للتحميل من متجر التطبيقات.'
            : 'Madaar runs as a standalone progressive web app with zero store downloads required.'}
        </p>

        {/* FIREFOX SPECIFIC SECTION */}
        {browserInfo.isFirefox && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Globe className="w-4 h-4 shrink-0" />
              <span>
                {isRTL
                  ? 'ملاحظة لمستخدمي متصفح فايرفوكس (Firefox):'
                  : 'Notice for Firefox Users:'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isRTL
                ? 'متصفح فايرفوكس المكتبي (Desktop Firefox) لا يدعم تثبيت تطبيقات الـ PWA كبرنامج مستقل على سطح المكتب تلقائياً (لذلك لا تظهر أيقونة التثبيت ⊕ في شريط العنوان).'
                : 'Desktop Firefox does not support standalone PWA desktop installs natively (no install icon in the address bar).'}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copied
                    ? (isRTL ? 'تم نسخ الرابط!' : 'Copied!')
                    : (isRTL ? 'نسخ رابط المنصة لفتحه في Chrome' : 'Copy link to open in Chrome')}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Chrome / Edge / Brave Desktop */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
            <Monitor className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white block mb-0.5">
                {isRTL ? 'على الكمبيوتر والماك (Google Chrome / Microsoft Edge):' : 'On PC & Mac (Chrome / Edge):'}
              </span>
              <span className="text-slate-300 leading-relaxed block">
                {isRTL
                  ? 'اضغط على أيقونة التثبيت ⊕ في أقصى شريط عنوان المتصفح بالأعلى، أو من قائمة المتصفح (⋮) اختر «تثبيت مَـدَار». سيصبح لديك تطبيق مستقل تماماً على سطح المكتب وشريط المهام.'
                  : 'Click the install icon ⊕ in the address bar, or from menu (⋮) choose "Install Madaar". It will become a standalone app on your desktop & taskbar.'}
              </span>
            </div>
          </div>

          {/* Firefox Alternative inside Firefox */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
            <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white block mb-0.5">
                {isRTL ? 'داخل متصفح فايرفوكس (Firefox):' : 'Inside Firefox:'}
              </span>
              <span className="text-slate-300 leading-relaxed block">
                {isRTL
                  ? 'اضغط Ctrl + D (أو Cmd + D في الماك) لإضافة الصفحة للشريط الرئيسي، أو انقر بالزر الأيمن على علامة التبويب واختر «تثبيت التبويب (Pin Tab)». أما على هواتف Android فيمكنك الضغط على القائمة (⋮) ثم «تثبيت». '
                  : 'Press Ctrl + D (or Cmd + D on Mac) to bookmark, or right click the tab and choose "Pin Tab". On Firefox Android, tap (⋮) then "Install".'}
              </span>
            </div>
          </div>

          {/* iOS / iPhone */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white block mb-0.5">
                {isRTL ? 'على آيفون وآيباد (Safari):' : 'On iPhone & iPad (Safari):'}
              </span>
              <span className="text-slate-300 leading-relaxed block">
                {isRTL
                  ? 'اضغط على زر المشاركة (Share ⎋) أسفل شاشة سفاري، ثم مرر واختر «إضافة إلى الشاشة الرئيسية ➕».'
                  : 'Tap the Share button ⎋ in Safari, then select "Add to Home Screen ➕".'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white transition-all shadow-md"
        >
          {isRTL ? 'فهمت، حسناً' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
