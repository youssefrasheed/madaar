import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Globe,
  Phone,
  Briefcase,
  MapPin,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Save,
  RefreshCw,
  Camera,
  Link as LinkIcon,
  Sparkles,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80',
];

const INDUSTRIES = [
  'التسويق الرقمي والإعلام',
  'تقنية المعلومات والبرمجيات',
  'التجارة الإلكترونية والتجزئة',
  'استشارات الأعمال وإدارة المشاريع',
  'العقارات والتطوير العقاري',
  'الخدمات المالية والبنوك',
  'الرعاية الصحية والمستحضرات الطبية',
  'التعليم والتدريب',
  'أخرى'
];

export default function Profile() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { isRTL, t } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    website: '',
    phone: '',
    industry: 'التسويق الرقمي والإعلام',
    country: 'مصر',
  });

  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  // Sync form with user from auth context
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        bio: user.bio || '',
        website: user.website || '',
        phone: user.phone || '',
        industry: user.industry || 'التسويق الرقمي والإعلام',
        country: user.country || 'مصر',
      });
      setLogoUrlInput(user.avatar || '');
    }
  }, [user]);

  // Handle local file upload (converts to Base64 data URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يُرجى اختيار ملف صورة صالح' : 'Please select a valid image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت' : 'Image size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setFormData((prev) => ({ ...prev, avatar: base64 }));
      toast.success(isRTL ? 'تم تجهيز صورة الشعار الجديدة' : 'Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) return;
    setFormData((prev) => ({ ...prev, avatar: logoUrlInput.trim() }));
    toast.success(isRTL ? 'تم تطبيق رابط الشعار' : 'Logo URL applied');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(isRTL ? 'اسم الشركة مطلوب' : 'Company name is required');
      return;
    }

    setSaving(true);
    await updateProfile(formData);
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <span>{isRTL ? 'بروفايل الشركة وإعدادات الهوية' : 'Company Profile & Identity'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRTL
              ? 'تخصيص شعار الشركة، الاسم الرسمي، نبذة الأعمال، ومعلومات التواصل'
              : 'Customize company logo, official brand name, bio, and business contact info'}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isRTL ? 'حساب مؤمّن بنظام 2FA' : '2FA Protected Account'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Company Logo & Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm text-center">
            <div className="relative inline-block mx-auto mb-4 group">
              <img
                src={formData.avatar}
                alt={formData.name || 'Company'}
                className="w-32 h-32 rounded-3xl object-cover ring-4 ring-indigo-50 shadow-md border border-slate-200 mx-auto"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                }}
              />
              <label
                htmlFor="logo-upload"
                className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-105"
                title={isRTL ? 'رفع صورة من جهازك' : 'Upload from device'}
              >
                <Camera className="w-4 h-4" />
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h3 className="text-lg font-black text-slate-900 truncate">
              {formData.name || (isRTL ? 'اسم الشركة' : 'Company Name')}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate" dir="ltr">
              {formData.email}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                {formData.industry || 'Business'}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {formData.country || 'Global'}
              </span>
            </div>

            {/* Logo Options */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-right space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{isRTL ? 'تغيير الشعار:' : 'Change Logo:'}</span>
                <button
                  type="button"
                  onClick={() => setCustomUrlMode(!customUrlMode)}
                  className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{customUrlMode ? (isRTL ? 'إلغاء الرابط' : 'Cancel') : (isRTL ? 'إدخال رابط صورة' : 'Image URL')}</span>
                </button>
              </div>

              {customUrlMode ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    {isRTL ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload-btn"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRTL ? 'رفع صورة من جهازك' : 'Upload from your Mac'}</span>
                  <input
                    id="logo-upload-btn"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Security Summary Badge */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isRTL ? 'حماية الحساب والمصادقة' : 'Account Security'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRTL
                ? 'كافة بيانات الدخول وتوكينات السوشيال ميديا مشفرة بقاعدة بيانات SQLite. تسجيل الدخول محمي بكود OTP يُرسل للإيميل فقط.'
                : 'All credentials and social tokens are encrypted. 2FA OTP codes are sent exclusively to your email.'}
            </p>
          </div>
        </div>

        {/* Right Column: Company Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {isRTL ? 'البيانات الأساسية للشركة' : 'Primary Company Details'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRTL ? 'تظهر هذه البيانات في لوحة التحكم وتقارير المنصات المجدولة' : 'Shown across your hub dashboards and reporting'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'اسم الشركة أو البراند' : 'Company / Brand Name'} *
                </label>
                <div className="relative">
                  <Building2 className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isRTL ? 'مثال: شركة الأفق للحلول الرقمية' : 'e.g. Acme Corporation'}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'البريد الإلكتروني للشركة' : 'Official Work Email'}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed text-left font-mono`}
                    dir="ltr"
                    title={isRTL ? 'لا يمكن تعديل البريد الأساسي لأسباب أمنية' : 'Email is locked for security'}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'الموقع الإلكتروني' : 'Official Website'}
                </label>
                <div className="relative">
                  <Globe className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left font-mono`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'رقم الهاتف للتواصل' : 'Contact Phone'}
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left`}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'مجال العمل والصناعة' : 'Industry'}
                </label>
                <div className="relative">
                  <Briefcase className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isRTL ? 'الدولة / المقر الرئيسي' : 'Country / Location'}
                </label>
                <div className="relative">
                  <MapPin className={`w-4 h-4 text-slate-400 absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder={isRTL ? 'مثال: مصر، السعودية، الإمارات' : 'e.g. Egypt, UAE, Saudi Arabia'}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {isRTL ? 'نبذة تعريفية عن الشركة' : 'Company Bio / Description'}
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={isRTL ? 'اكتب نبذة مختصرة عن نشاط الشركة وخدماتها...' : 'Brief description of your company services and mission...'}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
              />
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isRTL ? 'حفظ تعديلات الشركة' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
