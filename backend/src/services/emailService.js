/**
 * Email Service — Handles 2FA Security Codes & Notifications
 * Uses Nodemailer with SMTP configuration or smart development fallback
 */

const nodemailer = require('nodemailer');
const axios = require('axios');

let transporter = null;

/**
 * Send email via Resend API
 */
async function sendViaResend(toEmail, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM_EMAIL || 'مَـدَار | Madaar Security <noreply@jooart.uk>';
  const replyTo = process.env.RESEND_REPLY_TO || 'no-reply@jooart.uk';

  try {
    const res = await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [toEmail],
        subject,
        html,
        reply_to: replyTo,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`[EmailService/Resend] Email sent to ${toEmail} successfully! ID: ${res.data.id}`);
    return { success: true, messageId: res.data.id };
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error(`[EmailService/Resend] Failed to send email to ${toEmail}:`, errorDetails);
    return { success: false, error: errorDetails };
  }
}

// Initialize transporter based on environment variables
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`[EmailService] Configured SMTP client for ${SMTP_USER}@${SMTP_HOST}`);
  } else {
    // Development / fallback mode (logs to console)
    transporter = null;
    console.log('[EmailService] SMTP not configured. OTP codes will be displayed in console/logs.');
  }

  return transporter;
}

/**
 * Send 2FA Verification Email
 * @param {string} toEmail 
 * @param {string} code (6-digit numeric OTP)
 * @param {string} userName
 */
async function send2FACode(toEmail, code, userName = 'المستخدم') {
  const mailClient = getTransporter();

  const subject = `🔐 رمز التحقق لتسجيل الدخول: ${code} — مَـدَار | Madaar`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 36px 24px 28px; text-align: center; color: #ffffff; }
    .avatar-wrapper { display: inline-block; width: 68px; height: 68px; border-radius: 20px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); border: 2px solid rgba(255, 255, 255, 0.2); background: #0f172a; }
    .avatar-img { width: 68px; height: 68px; object-fit: cover; display: block; border-radius: 18px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
    .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); border: 1px solid #818cf8; color: #c7d2fe; font-size: 12px; padding: 4px 12px; border-radius: 999px; }
    .body { padding: 32px 28px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .code-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #4338ca; font-family: monospace; display: inline-block; margin-bottom: 20px; user-select: all; }
    .expiry { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 24px; }
    .security-note { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; text-align: right; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="avatar-wrapper">
        <img class="avatar-img" src="https://madaar.jooart.uk/pwa-192.png" alt="مَـدَار" width="68" height="68" />
      </div>
      <div class="logo">مَـدَار | Madaar</div>
      <div class="badge">نظام حماية الحسابات والمصادقة الثنائية (2FA)</div>
    </div>
    <div class="body">
      <div class="title">مرحباً ${userName} 👋</div>
      <div class="desc">
        تم استلام طلب تسجيل دخول إلى حساب شركتك في منصة <strong>مَـدَار (Madaar)</strong>.<br>
        أدخل الرمز التالي لتأكيد هويتك وتأمين حسابات السوشيال ميديا الخاصة بك:
      </div>
      <div class="code-box">${code}</div>
      <div class="expiry">⏱️ هذا الرمز صالح لمدة 10 دقائق فقط</div>
      <div class="security-note">
        ⚠️ <strong>تنبيه أمان:</strong> إذا لم تقم بمحاولة تسجيل الدخول بنفسك، فهذا يعني أن شخصاً ما حاول الوصول لحسابك. يُرجى تغيير كلمة المرور فوراً لتأمين حساباتك.
      </div>
    </div>
    <div class="footer">
      فريق أمان مَـدَار | Madaar Enterprise Security • رسالة آلية مشفرة لحماية حسابك
    </div>
  </div>
</body>
</html>
  `;

  // Prominently log to console for development/admin visibility
  console.log('====================================================');
  console.log(`🔐 [2FA SECURITY CODE] Generated for: ${toEmail}`);
  console.log(`👉 CODE: ${code}`);
  console.log(`⏰ Valid for 10 minutes`);
  console.log('====================================================');

  // Try sending via Resend first (No-Reply professional delivery)
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend(toEmail, subject, html);
    if (resendResult && resendResult.success) {
      return resendResult;
    }
  }

  if (mailClient) {
    try {
      const info = await mailClient.sendMail({
        from: process.env.SMTP_FROM || `"SocialHub Security" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html,
      });
      console.log(`[EmailService] OTP email sent successfully to ${toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Local/Dev return
  return { success: true, localLog: true };
}

/**
 * Send Password Reset Code Email
 * @param {string} toEmail 
 * @param {string} code (6-digit numeric OTP)
 * @param {string} userName
 */
async function sendPasswordResetCode(toEmail, code, userName = 'المستخدم') {
  const mailClient = getTransporter();

  const subject = `🔑 رمز استعادة كلمة المرور: ${code} — مَـدَار | Madaar`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 36px 24px 28px; text-align: center; color: #ffffff; }
    .avatar-wrapper { display: inline-block; width: 68px; height: 68px; border-radius: 20px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); border: 2px solid rgba(255, 255, 255, 0.2); background: #0f172a; }
    .avatar-img { width: 68px; height: 68px; object-fit: cover; display: block; border-radius: 18px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
    .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); border: 1px solid #818cf8; color: #c7d2fe; font-size: 12px; padding: 4px 12px; border-radius: 999px; }
    .body { padding: 32px 28px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .code-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #4338ca; font-family: monospace; display: inline-block; margin-bottom: 20px; user-select: all; }
    .expiry { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 24px; }
    .security-note { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; text-align: right; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="avatar-wrapper">
        <img class="avatar-img" src="https://madaar.jooart.uk/pwa-192.png" alt="مَـدَار" width="68" height="68" />
      </div>
      <div class="logo">مَـدَار | Madaar</div>
      <div class="badge">استعادة كلمة المرور وتأمين الحساب</div>
    </div>
    <div class="body">
      <div class="title">مرحباً ${userName} 👋</div>
      <div class="desc">
        تلقينا طلباً لتعيين كلمة مرور جديدة لحسابك في منصة <strong>مَـدَار</strong>.<br>
        استخدم رمز الأمان التالي لإتمام تعيين كلمة المرور الجديدة:
      </div>
      <div class="code-box">${code}</div>
      <div class="expiry">⏱️ هذا الرمز صالح للاستخدام لمدة 15 دقيقة فقط</div>
      <div class="security-note">
        ⚠️ <strong>تنبيه أمان:</strong> إذا لم تقم بطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية كما هي دون تغيير.
      </div>
    </div>
    <div class="footer">
      فريق أمان مَـدَار | Madaar Enterprise Security • رسالة آلية مشفرة لحماية حسابك
    </div>
  </div>
</body>
</html>
  `;

  console.log('====================================================');
  console.log(`🔑 [PASSWORD RESET CODE] Generated for: ${toEmail}`);
  console.log(`👉 CODE: ${code}`);
  console.log(`⏰ Valid for 15 minutes`);
  console.log('====================================================');

  // Try sending via Resend first (No-Reply professional delivery)
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend(toEmail, subject, html);
    if (resendResult && resendResult.success) {
      return resendResult;
    }
  }

  if (mailClient) {
    try {
      const info = await mailClient.sendMail({
        from: process.env.SMTP_FROM || `"Madaar Security" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html,
      });
      console.log(`[EmailService] Password reset email sent to ${toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send reset email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: true, localLog: true };
}

module.exports = {
  send2FACode,
  sendPasswordResetCode,
};
