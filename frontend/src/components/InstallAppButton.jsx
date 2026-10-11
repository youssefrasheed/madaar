import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InstallAppButton({ className = '', variant = 'sidebar' }) {
  const { isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

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

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
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
    if (isIos) {
      setShowIosModal(true);
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
      // Browser doesn't support automatic prompt or it's Desktop Safari
      setShowIosModal(true);
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

        {/* Instructions Modal */}
        {showIosModal && (
          <InstallInstructionsModal isRTL={isRTL} onClose={() => setShowIosModal(false)} />
        )}
      </>
    );
  }

  // Variant 2: Sidebar Card
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

      {/* Instructions Modal */}
      {showIosModal && (
        <InstallInstructionsModal isRTL={isRTL} onClose={() => setShowIosModal(false)} />
      )}
    </>
  );
}

/**
 * Universal Install Guide Modal for iOS Safari / Mac Safari
 */
function InstallInstructionsModal({ isRTL, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white text-right relative"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4 mx-auto">
          <Download className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-white text-center mb-2">
          {isRTL ? 'تثبيت مَـدَار كتطبيق على جهازك' : 'Install Madaar on your Device'}
        </h3>
        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
          {isRTL
            ? 'يعمل مَـدَار كتطبيق مستقل (PWA) فائق السرعة دون الحاجة للتحميل من المتجر.'
            : 'Madaar runs as a standalone progressive web app with zero store downloads required.'}
        </p>

        <div className="space-y-3.5 text-xs">
          {/* Mac / PC Chrome/Edge */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
            <Monitor className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                {isRTL ? 'على الماك والكمبيوتر (Chrome / Edge / Safari):' : 'On Mac & PC:'}
              </span>
              <span className="text-slate-300">
                {isRTL
                  ? 'اضغط على أيقونة التثبيت ⊕ في شريط عنوان المتصفح بالأعلى، أو من قائمة المتصفح اختر «تثبيت التطبيق».'
                  : 'Click the install icon ⊕ in the browser address bar, or choose "Install App" from browser menu.'}
              </span>
            </div>
          </div>

          {/* iOS / iPhone */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                {isRTL ? 'على آيفون وآيباد (Safari):' : 'On iPhone & iPad:'}
              </span>
              <span className="text-slate-300">
                {isRTL
                  ? 'اضغط على زر المشاركة (Share ⎋) أسفل المتصفح، ثم اختر «إضافة إلى الشاشة الرئيسية ➕».'
                  : 'Tap the Share button ⎋ in Safari, then select "Add to Home Screen ➕".'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white transition-all"
        >
          {isRTL ? 'فهمت، حسناً' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
