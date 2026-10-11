import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('socialhub_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('socialhub_token') || null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('socialhub_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('socialhub_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('socialhub_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('socialhub_token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  /**
   * Step 1: Submit credentials to receive OTP via email
   */
  const requestLogin = async (email, password) => {
    if (!email || !password) {
      toast.error('يُرجى إدخال البريد الإلكتروني وكلمة المرور');
      return { success: false };
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requireOtp) {
        toast.success(res.data.message || 'تم إرسال رمز التحقق الأمني إلى بريدك الإلكتروني 🔐');
        return {
          requireOtp: true,
          tempToken: res.data.tempToken,
          maskedEmail: res.data.email,
        };
      }

      setUser(res.data.user);
      setToken(res.data.token);
      toast.success(`مرحباً بك مجدداً، ${res.data.user.name}!`);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'بيانات الدخول غير صحيحة';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Step 2: Verify 6-digit OTP code received via email
   */
  const verifyOtp = async (tempToken, otp) => {
    if (!tempToken || !otp) {
      toast.error('يُرجى إدخال رمز التحقق المكون من 6 أرقام');
      return false;
    }

    try {
      const res = await api.post('/auth/verify-otp', { tempToken, otp });
      setUser(res.data.user);
      setToken(res.data.token);
      toast.success(`تم تأكيد الهوية بنجاح! مرحباً ${res.data.user.name}`);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية';
      toast.error(message);
      return false;
    }
  };

  /**
   * Resend OTP code to user email
   */
  const resendOtp = async (tempToken) => {
    try {
      const res = await api.post('/auth/resend-otp', { tempToken });
      toast.success(res.data.message || 'تم إرسال رمز جديد إلى بريدك الإلكتروني 📩');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'تعذر إعادة إرسال الرمز، حاول مجدداً';
      toast.error(message);
      return { success: false };
    }
  };

  /**
   * Register a new company account with 2FA
   */
  const registerCompany = async (name, email, password) => {
    if (!name || !email || !password) {
      toast.error('يُرجى ملء كافة حقول التسجيل');
      return { success: false };
    }

    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.requireOtp) {
        toast.success(res.data.message || 'تم إنشاء الحساب وإرسال رمز التحقق الأمني إلى بريدك الإلكتروني 🔐');
        return {
          requireOtp: true,
          tempToken: res.data.tempToken,
          maskedEmail: res.data.email,
        };
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'تعذر إنشاء الحساب، يُرجى المحاولة مجدداً';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Update company profile details & logo
   */
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      setUser(res.data.user);
      toast.success(res.data.message || 'تم حفظ بيانات الشركة بنجاح!');
      return { success: true, user: res.data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'تعذر تحديث بيانات الشركة';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Refresh profile data from backend
   */
  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };



  /**
   * Fetch all registered client accounts
   */
  const fetchManagedAccounts = async () => {
    try {
      const res = await api.get('/auth/managed-accounts');
      return res.data.accounts || [];
    } catch (e) {
      console.error('Failed to fetch managed accounts:', e);
      return [];
    }
  };

  /**
   * Switch active session to another client company account
   */
  const switchAccount = async (targetUserId) => {
    try {
      const res = await api.post('/auth/switch-account', { targetUserId });
      if (res.data.token && res.data.user) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('socialhub_user', JSON.stringify(res.data.user));
        localStorage.setItem('socialhub_token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        toast.success(res.data.message || `تم التبديل بنجاح إلى: ${res.data.user.name}`);
        // Refresh page to guarantee clean state reload for new tenant
        setTimeout(() => {
          window.location.reload();
        }, 400);
        return true;
      }
      return false;
    } catch (e) {
      const msg = e.response?.data?.message || 'تعذر التبديل إلى هذا الحساب';
      toast.error(msg);
      return false;
    }
  };

  /**
   * Create a new client company account directly
   */
  const createClientAccount = async (clientData) => {
    try {
      const res = await api.post('/auth/create-client', clientData);
      toast.success(res.data.message || 'تم إنشاء حساب العميل بنجاح!');
      return { success: true, client: res.data.client };
    } catch (e) {
      const msg = e.response?.data?.message || 'تعذر إنشاء حساب العميل';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /**
   * Request password reset code via email
   */
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'تم إرسال كود استعادة كلمة المرور إلى بريدك 📩');
      return {
        success: true,
        resetToken: res.data.resetToken,
        maskedEmail: res.data.maskedEmail,
      };
    } catch (err) {
      const message = err.response?.data?.error || 'تعذر إرسال كود الاستعادة، تحقق من البريد';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Confirm password reset with code and new password
   */
  const resetPassword = async (resetToken, code, newPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { resetToken, code, newPassword });
      toast.success(res.data.message || 'تم تحديث كلمة المرور بنجاح! 🔑');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'فشل تحديث كلمة المرور';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('socialhub_user');
    localStorage.removeItem('socialhub_token');
    toast.success('تم تسجيل الخروج بأمان');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    requestLogin,
    registerCompany,
    verifyOtp,
    resendOtp,
    updateProfile,
    refreshProfile,
    fetchManagedAccounts,
    switchAccount,
    createClientAccount,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
