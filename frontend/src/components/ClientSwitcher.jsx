import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ClientSwitcher() {
  const { user, fetchManagedAccounts, switchAccount, createClientAccount } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);

  // New Client Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    const list = await fetchManagedAccounts();
    setAccounts(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const handleSwitch = async (targetId) => {
    if (targetId === user?.id) {
      setIsOpen(false);
      return;
    }
    setSwitchingId(targetId);
    await switchAccount(targetId);
    setSwitchingId(null);
    setIsOpen(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error(isRTL ? 'يُرجى إدخال اسم العميل أو الشركة' : 'Please enter client name');
      return;
    }

    setCreating(true);
    const res = await createClientAccount({
      name: clientName.trim(),
      email: clientEmail.trim(),
      industry: clientIndustry.trim() || (isRTL ? 'التسويق وإدارة المحتوى' : 'Digital Marketing'),
    });
    setCreating(false);

    if (res.success) {
      setCreateModalOpen(false);
      setClientName('');
      setClientEmail('');
      setClientIndustry('');
      // Reload accounts list
      await loadAccounts();
      // Ask to switch now
      if (res.client?.id) {
        handleSwitch(res.client.id);
      }
    }
  };

  return (
    <div className="relative">
      {/* Active Client Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all border border-slate-200/90 shadow-sm group"
        title={isRTL ? 'تبديل حساب العميل / الشركة' : 'Switch Client / Company'}
      >
        <div className="relative">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Logo"
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300 group-hover:ring-indigo-400 transition-all shrink-0"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="text-right leading-tight max-w-[140px] truncate hidden sm:block">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              {isRTL ? 'العميل الحالي' : 'Active Client'}
            </span>
          </div>
          <span className="text-xs font-black text-slate-900 truncate block">
            {user?.name || 'Company'}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div
            className={`absolute top-full mt-2.5 z-50 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden ${
              isRTL ? 'left-0' : 'right-0'
            }`}
          >
            {/* Header / Active Tenant Details */}
            <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isRTL ? 'مساحة عمل العميل النشط' : 'Active Client Workspace'}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {isRTL ? 'بيانات معزولة 100%' : '100% Isolated'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Avatar"
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-400/40 shrink-0 bg-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">
                    {user?.name || 'Company Name'}
                  </h4>
                  <p className="text-xs text-slate-300 truncate font-mono" dir="ltr">
                    {user?.email}
                  </p>
                  {user?.industry && (
                    <p className="text-[11px] text-indigo-200/80 truncate mt-0.5">
                      {user.industry}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                  className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'تعديل بروفايل وشعار العميل' : 'Edit Client Profile'}</span>
                </button>
              </div>
            </div>

            {/* Client Accounts List */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {isRTL ? 'تبديل بين حسابات العملاء' : 'Switch Client Accounts'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {accounts.length} {isRTL ? 'عملاء مسجلين' : 'clients'}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1.5">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {isRTL ? 'جاري تحميل الحسابات...' : 'Loading accounts...'}
                </div>
              ) : accounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {isRTL ? 'لا توجد حسابات أخرى حالياً' : 'No other client accounts'}
                </div>
              ) : (
                accounts.map((acc) => {
                  const isActive = acc.id === user?.id;
                  const isSwitching = switchingId === acc.id;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => !isActive && handleSwitch(acc.id)}
                      className={`p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50/80 border border-indigo-200/60'
                          : 'hover:bg-slate-100/80 active:bg-slate-200/60'
                      }`}
                    >
                      <img
                        src={acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={acc.name}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0 bg-slate-100"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {acc.name}
                          </h5>
                          {isActive && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                              {isRTL ? 'الحالي' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {acc.accounts_count || 0} {isRTL ? 'منصات متصلة' : 'channels'} • {acc.posts_count || 0} {isRTL ? 'منشورات' : 'posts'}
                        </p>
                      </div>

                      {isActive ? (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : isSwitching ? (
                        <span className="text-[10px] font-bold text-indigo-600 animate-pulse">
                          {isRTL ? 'تبديل...' : 'Switching...'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 shrink-0">
                          {isRTL ? 'تبديل' : 'Switch'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Add New Client Action */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCreateModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
                <span>{isRTL ? '+ إضافة عميل / حساب شركة جديد' : '+ Add New Client Account'}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Create New Client Workspace */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isRTL ? 'إضافة عميل / شركة جديدة' : 'Add New Client / Company'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRTL ? 'إنشاء مساحة عمل مستقلة ومنفصلة تماماً' : 'Create a completely isolated workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRTL ? 'اسم العميل أو الشركة *' : 'Client / Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRTL ? 'مثال: شركة الأندلس للتقنية' : 'e.g. Al-Andalus Tech'}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRTL ? 'مجال النشاط / الصناعة' : 'Industry / Sector'}
                </label>
                <input
                  type="text"
                  placeholder={isRTL ? 'مثال: عقارات، مطاعم، تجارة إلكترونية' : 'e.g. Real Estate, F&B'}
                  value={clientIndustry}
                  onChange={(e) => setClientIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRTL ? 'البريد الإلكتروني للعميل (اختياري)' : 'Client Email (Optional)'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="client@company.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 text-emerald-800 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isRTL
                    ? 'ضمان العزل: كل حساب يتم إنشاؤه يحصل على مساحة خاصة به في قاعدة البيانات ولا تتداخل قنواته أو منشوراته أو رسائله مع أي عميل آخر.'
                    : 'Isolation Guarantee: Every client workspace gets strictly separated database records with zero cross-tenant contamination.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
                >
                  {creating ? (isRTL ? 'جاري الإنشاء...' : 'Creating...') : (isRTL ? 'إنشاء مساحة العميل' : 'Create Workspace')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
