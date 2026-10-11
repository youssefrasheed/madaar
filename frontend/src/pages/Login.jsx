import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Globe,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import MadaarLogo from '../components/MadaarLogo';
import HologramOrbitAnimation from '../components/HologramOrbitAnimation';

export default function Login() {
  const { isRTL, language, toggleLanguage } = useLanguage();
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA state
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Forgot / Reset Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const { requestLogin, registerCompany, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Step: Forgot Password - Request Code via Email
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error(isRTL ? 'يُرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(resetEmail.trim());
    setLoading(false);
    if (res.success) {
      setResetToken(res.resetToken);
      setMaskedEmail(res.maskedEmail || resetEmail);
      setResetOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setStep('forgot_otp');
    }
  };

  // Step: Reset Password - Confirm Code & Set New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.trim().length < 6) {
      toast.error(isRTL ? 'يُرجى إدخال رمز الأمان المكون من 6 أرقام' : 'Please enter the 6-digit security code');
      return;
    }
    if (newPassword.length < 6) {
      toast.error(isRTL ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await resetPassword(resetToken, resetOtp.trim(), newPassword);
    setLoading(false);
    if (res.success) {
      setPassword(newPassword);
      setEmail(resetEmail);
      setStep('credentials');
      setMode('login');
    }
  };

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await requestLogin(email, password);
    setLoading(false);

    if (res.requireOtp) {
      setTempToken(res.tempToken);
      setMaskedEmail(res.maskedEmail || email);
      setOtp('');
      setStep('otp');
      setCountdown(60);
    } else if (res.success) {
      navigate('/dashboard');
    }
  };

  // Step 1: Register Company Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error(isRTL ? 'يُرجى إدخال اسم الشركة أو المؤسسة' : 'Please enter company name');
      return;
    }
    if (!email.trim()) {
      toast.error(isRTL ? 'يُرجى إدخال البريد الإلكتروني الرسمي للشركة' : 'Please enter company email');
      return;
    }
    if (password.length < 6) {
      toast.error(isRTL ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isRTL ? 'كلمة المرور وتأكيدها غير متطابقين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await registerCompany(companyName.trim(), email.trim(), password);
    setLoading(false);

    if (res.requireOtp) {
      setTempToken(res.tempToken);
      setMaskedEmail(res.maskedEmail || email);
      setOtp('');
      setStep('otp');
      setCountdown(60);
    }
  };

  // Step 2: Submit 6-digit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error(isRTL ? 'يُرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const ok = await verifyOtp(tempToken, otp.trim());
    setLoading(false);

    if (ok) {
      navigate('/dashboard');
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    const res = await resendOtp(tempToken);
    setResending(false);
    if (res?.success) {
      setCountdown(60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Floating Language Switcher in top corner */}
      <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} z-30`}>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-md backdrop-blur-sm text-xs font-bold transition-all"
        >
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>{language === 'ar' ? '🇬🇧 English' : '🇪🇬 العربية'}</span>
        </button>
      </div>

      {/* Visual Branding Panel */}
      <div className={`hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-16 flex-col justify-between overflow-hidden ${isRTL ? 'border-l border-slate-800 order-1' : 'border-r border-slate-800 order-1'}`}>
        {/* Hologram Orbital Animation for Social Media Platforms */}
        <HologramOrbitAnimation />

        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <MadaarLogo isRTL={isRTL} size="lg" />
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {isRTL ? 'نظام حماية الحسابات والمصادقة الثنائية (2FA) مفعل' : 'Two-Factor Authentication (2FA) Active'}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
            {isRTL
              ? 'مَـدَار: أمّن حسابات شركتك وانشر بذكاء في 7 منصات من شاشة واحدة.'
              : 'Madaar: Secure company accounts & publish across 7 platforms in one orbit.'}
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            {isRTL
              ? 'المركز الموحد لإدارة شبكات التواصل الاجتماعي للشركات. تسجيل دخول محمي بكود 2FA لضمان حماية مطلقة لكافة حسابات فيسبوك، إنستجرام، لينكدإن، إكس وتيك توك.'
              : 'Enterprise social media command center. Secured with email 2FA OTP protecting all your connected company channels.'}
          </p>

          <div className="mt-8 space-y-3">
            {[
              isRTL ? 'مصادقة ثنائية برمز OTP مشفر يُرسل لبريد الشركة' : '2FA OTP security sent straight to work email',
              isRTL ? 'حماية الـ Access Tokens وصلاحيات النشر المشفرة' : 'Encrypted OAuth tokens & publishing credentials',
              isRTL ? 'جدولة ذكية مع تحليل أفضل أوقات النشر بالـ AI (Gemini)' : 'Smart AI scheduling powered by Google Gemini',
              isRTL ? 'تقارير يومية وأسبوعية تفصيلية لكل حساب' : 'Detailed daily & weekly performance reporting',
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} مَـدَار | Madaar Enterprise • {isRTL ? 'أقصى درجات الأمان والخصوصية' : 'Maximum Security & Compliance'}
        </div>
      </div>

      {/* Form Panel */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-slate-50 overflow-y-auto ${isRTL ? 'order-2' : 'order-2'}`}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 my-auto">

          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <MadaarLogo light={true} size="md" isRTL={isRTL} />
          </div>

          {/* STEP 1: CREDENTIALS (LOGIN / REGISTER TABS) */}
          {step === 'credentials' && (
            <>
              {/* Top Mode Tabs */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setEmail(''); setPassword(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setEmail(''); setPassword(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isRTL ? 'إنشاء حساب شركة جديد' : 'Register Company'}
                </button>
              </div>

              {/* Header Icon & Title */}
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                  {mode === 'login' ? (
                    <ShieldCheck className="w-7 h-7 text-indigo-600" />
                  ) : (
                    <Building2 className="w-7 h-7 text-indigo-600" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'login'
                    ? (isRTL ? 'تسجيل الدخول الآمن' : 'Secure Sign In')
                    : (isRTL ? 'تسجيل حساب شركة جديد' : 'Create Company Workspace')}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'login'
                    ? (isRTL ? 'أدخل بريدك وكلمة المرور وسيتم إرسال رمز تحقق مؤقت (2FA)' : 'Enter your credentials to receive your one-time 2FA security code')
                    : (isRTL ? 'أنشئ حساب شركتك وسيتم حمايته فوراً برمز تحقق أمني (2FA)' : 'Set up your company workspace secured with instant 2FA')}
                </p>
              </div>

              {/* MODE 1: LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'كلمة المرور' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1`}
                        tabIndex={-1}
                        aria-label={showPassword ? (isRTL ? 'إخفاء كلمة المرور' : 'Hide password') : (isRTL ? 'إظهار كلمة المرور' : 'Show password')}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setStep('forgot_email');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                      >
                        {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isRTL ? 'متابعة وإرسال رمز التحقق' : 'Continue & Send OTP'}</span>
                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 2: REGISTER COMPANY FORM */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'اسم الشركة أو المؤسسة' : 'Company / Brand Name'}
                    </label>
                    <div className="relative">
                      <Building2 className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={isRTL ? 'مثال: شركة الأفق للإعلام والتسويق' : 'e.g. Horizon Media LLC'}
                        className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'البريد الإلكتروني الرسمي للشركة' : 'Official Work Email'}
                    </label>
                    <div className="relative">
                      <Mail className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@yourcompany.com"
                        className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'كلمة المرور' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1`}
                        tabIndex={-1}
                        aria-label={showPassword ? (isRTL ? 'إخفاء كلمة المرور' : 'Hide password') : (isRTL ? 'إظهار كلمة المرور' : 'Show password')}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <Lock className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1`}
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? (isRTL ? 'إخفاء تأكيد كلمة المرور' : 'Hide password confirmation') : (isRTL ? 'إظهار تأكيد كلمة المرور' : 'Show password confirmation')}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {isRTL
                        ? 'مستوى حماية مشدد: فور إنشاء الحساب، سيتم إرسال كود تحقق (2FA) لتأكيد البريد وتأمين حسابات الشركة.'
                        : 'High security: An instant 2FA OTP code will be sent to your email to verify domain ownership and activate your hub.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isRTL ? 'إنشاء حساب الشركة وتفعيل الأمان' : 'Create Account & Enable 2FA'}</span>
                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* STEP 2: 2FA OTP VERIFICATION */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-sm animate-pulse">
                  <KeyRound className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {isRTL ? 'رمز التحقق الأمني (2FA)' : '2FA Security Code'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {isRTL ? 'تم إرسال كود تحقق أمني مكون من 6 أرقام إلى:' : 'A 6-digit verification code was sent to:'}
                </p>
                <div className="inline-block mt-1 font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs" dir="ltr">
                  {maskedEmail}
                </div>
              </div>

              {/* Security info box */}
              <div className="mb-6 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-right">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs mb-1">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{isRTL ? 'يصلك الرمز حصرياً عبر البريد الإلكتروني' : 'Code is delivered exclusively via email'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isRTL
                    ? 'لحماية حساباتك وأمان بيانات الشركة، تم إرسال رمز التحقق الأمني المكون من 6 أرقام إلى بريدك الإلكتروني فقط. يُرجى تفقد صندوق الوارد (Inbox) أو مجلد الرسائل غير المرغوب فيها (Spam).'
                    : 'For your security, the 6-digit OTP code is sent only to your email. Please check your inbox or spam folder.'}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
                    {isRTL ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter 6-digit Code'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full py-4 text-center text-3xl font-mono font-bold tracking-[14px] bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? 'تأكيد الهوية ودخول المنصة' : 'Verify Identity & Launch Hub'}</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{isRTL ? 'الرجوع للخلف' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resending}
                  className={`font-semibold flex items-center gap-1 transition-colors ${
                    countdown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {countdown > 0
                      ? (isRTL ? `إعادة الإرسال بعد (${countdown}ث)` : `Resend in (${countdown}s)`)
                      : (isRTL ? 'إعادة إرسال الرمز' : 'Resend Code')}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* STEP 3: FORGOT PASSWORD - ENTER EMAIL */}
          {step === 'forgot_email' && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                  <KeyRound className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isRTL ? 'استعادة كلمة المرور' : 'Reset Password'}
                </h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {isRTL
                    ? 'أدخل بريدك الإلكتروني المسجل، وسنرسل لك رمز أمان مكون من 6 أرقام لإعادة تعيين كلمة المرور عبر الإيميل.'
                    : 'Enter your registered email address and we will send you a 6-digit verification code.'}
                </p>
              </div>

              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    {isRTL ? 'البريد الإلكتروني المسجل' : 'Registered Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? 'إرسال رمز الاستعادة إلى البريد' : 'Send Recovery Code to Email'}</span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{isRTL ? 'الرجوع لتسجيل الدخول' : 'Back to Sign In'}</span>
                </button>
              </div>
            </>
          )}

          {/* STEP 4: FORGOT PASSWORD - ENTER OTP & NEW PASSWORD */}
          {step === 'forgot_otp' && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm animate-pulse">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isRTL ? 'تعيين كلمة المرور الجديدة' : 'Set New Password'}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  {isRTL ? 'تم إرسال رمز أمان مكون من 6 أرقام إلى بريدك:' : 'A 6-digit recovery code was sent to:'}
                </p>
                <div className="inline-block mt-1 font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs" dir="ltr">
                  {maskedEmail}
                </div>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 text-center">
                    {isRTL ? 'رمز الأمان (6 أرقام من الإيميل)' : 'Security Code (6 digits from email)'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full py-3 text-center text-2xl font-mono font-bold tracking-[10px] bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1`}
                      tabIndex={-1}
                      aria-label="Toggle password"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`w-5 h-5 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full ${isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className={`absolute ${isRTL ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1`}
                      tabIndex={-1}
                      aria-label="Toggle confirm password"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-5 h-5 text-indigo-600" /> : <Eye className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || resetOtp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRTL ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{isRTL ? 'إلغاء والعودة لتسجيل الدخول' : 'Cancel & Back to Sign In'}</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
