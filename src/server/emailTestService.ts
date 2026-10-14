import { Resend } from 'resend';
import {
  verifyFirebaseIdToken,
  isAuthorizedAdmin,
} from './firebaseAuthHelper.js';

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequestTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit rules: max 5 requests per 10 minutes, with a 10-second cooldown between consecutive requests
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const COOLDOWN_MS = 10 * 1000; // 10 seconds

/**
 * In-memory sliding rate limiter per admin UID / IP.
 */
export function checkEmailRateLimit(key: string): {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, windowStart: now, lastRequestTime: now });
    return { allowed: true };
  }

  // 1. Cooldown check
  const elapsedSinceLast = now - entry.lastRequestTime;
  if (elapsedSinceLast < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - elapsedSinceLast) / 1000);
    return {
      allowed: false,
      message: `이메일 발송 요청이 너무 빠릅니다. ${waitSec}초 후에 다시 시도해 주세요.`,
      retryAfterSeconds: waitSec,
    };
  }

  // 2. Sliding window reset
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now, lastRequestTime: now });
    return { allowed: true };
  }

  // 3. Request count limit
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetSec = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      message: `이메일 발송 요청 한도를 초과했습니다 (10분당 최대 ${MAX_REQUESTS_PER_WINDOW}회). ${resetSec}초 후에 다시 시도해 주세요.`,
      retryAfterSeconds: resetSec,
    };
  }

  entry.count += 1;
  entry.lastRequestTime = now;
  return { allowed: true };
}

/**
 * Mask email address for safe responses and logs (e.g., te***@domain.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Direct call to Resend SDK to send the test email.
 * - From: ClipSort <onboarding@resend.dev>
 * - To: process.env.RESEND_TEST_EMAIL
 * - Subject: [ClipSort] 이메일 발송 테스트
 */
export async function sendTestEmailDirect(): Promise<{ id?: string; sentTo: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('서버 환경변수 RESEND_API_KEY가 설정되어 있지 않습니다.');
  }

  const testEmail = process.env.RESEND_TEST_EMAIL;
  if (!testEmail || !testEmail.trim()) {
    throw new Error('서버 환경변수 RESEND_TEST_EMAIL이 설정되어 있지 않습니다.');
  }

  const resend = new Resend(apiKey.trim());

  const subject = '[ClipSort] 이메일 발송 테스트';
  const textBody = `안녕하세요!

ClipSort 이메일 발송 테스트에 성공했습니다.

이 메일이 정상적으로 도착했다면 이메일 인증 기능을 구현할 준비가 완료된 것입니다.`;

  const htmlBody = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 24px 24px 20px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ClipSort</h1>
            </td>
            <td align="right">
              <span style="font-size: 11px; font-weight: 600; color: #c7d2fe; background-color: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 9999px;">이메일 연동 테스트</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;">안녕하세요!</h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
          ClipSort 이메일 발송 테스트에 성공했습니다.
        </p>
        <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">
          이 메일이 정상적으로 도착했다면 이메일 인증 기능을 구현할 준비가 완료된 것입니다.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #64748b; line-height: 1.6;">
            <tr>
              <td style="width: 80px; font-weight: 600; color: #475569;">발신 주소:</td>
              <td>ClipSort &lt;onboarding@resend.dev&gt;</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #475569;">수신 대상:</td>
              <td>${maskEmail(testEmail)}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #475569;">발송 시각:</td>
              <td>${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          본 메일은 ClipSort Resend 연동 확인용 테스트 발송 메일입니다.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: 'ClipSort <onboarding@resend.dev>',
    to: [testEmail.trim()],
    subject,
    text: textBody,
    html: htmlBody,
  });

  if (error) {
    console.error('[Resend Error] 이메일 발송 실패 원인:', error);
    throw new Error(error.message || 'Resend 발송 API 오류가 발생했습니다.');
  }

  return {
    id: data?.id,
    sentTo: maskEmail(testEmail.trim()),
  };
}

/**
 * Universal Request Handler for both Express routes and Vercel Serverless Functions.
 */
export async function handleSendTestEmail(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    // 1. Extract Firebase ID token from Authorization header or body
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let token = '';

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.body?.idToken && typeof req.body.idToken === 'string') {
      token = req.body.idToken.trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error:
          '인증 토큰(Firebase ID Token)이 필요합니다. "Authorization: Bearer <token>" 헤더 또는 body의 { idToken: "..." }으로 전달해 주세요.',
      });
    }

    // 2. Validate ADMIN_UID configuration on server
    const adminUid = process.env.ADMIN_UID?.trim();
    if (!adminUid) {
      console.warn('[ClipSort Admin Auth] ADMIN_UID 환경변수가 서버에 등록되어 있지 않습니다.');
      return res.status(500).json({
        success: false,
        error:
          '서버에 ADMIN_UID 환경변수가 등록되어 있지 않습니다. Vercel 또는 .env에 관리자 UID를 설정해 주세요.',
      });
    }

    // 3. Cryptographically verify Firebase ID token
    const verifiedUser = await verifyFirebaseIdToken(token);
    if (!verifiedUser || !verifiedUser.uid) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 Firebase ID 토큰입니다.',
      });
    }

    // 4. Verify Administrator permissions
    if (!isAuthorizedAdmin(verifiedUser.uid)) {
      console.warn(`[ClipSort Admin Auth] 권한 없는 사용자의 접근 차단: UID=${verifiedUser.uid}`);
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다. 등록된 관리자 UID만 테스트 이메일을 발송할 수 있습니다.',
      });
    }

    // 5. Rate limiting check per admin UID
    const rateLimit = checkEmailRateLimit(verifiedUser.uid);
    if (!rateLimit.allowed) {
      if (rateLimit.retryAfterSeconds && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', rateLimit.retryAfterSeconds.toString());
      }
      return res.status(429).json({
        success: false,
        error: rateLimit.message,
      });
    }

    // 6. Send the test email via Resend
    const result = await sendTestEmailDirect();
    console.log(
      `[ClipSort Email API] 테스트 이메일 발송 성공 (UID: ${verifiedUser.uid}, Resend ID: ${result.id})`
    );

    return res.status(200).json({
      success: true,
      message: '테스트 이메일이 성공적으로 발송되었습니다.',
      emailId: result.id,
      recipient: result.sentTo,
    });
  } catch (err: any) {
    console.error('[ClipSort Email API] 내부 처리 예외 발생:', err);
    return res.status(500).json({
      success: false,
      error: err.message || '이메일 발송 처리 중 오류가 발생했습니다.',
    });
  }
}
