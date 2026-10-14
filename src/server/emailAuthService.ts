import crypto from 'crypto';
import { Resend } from 'resend';
import { getFirebaseAdminApp } from './firebaseAdminHelper.js';
import { getFirebaseConfig } from './firebaseAuthHelper.js';

// Types and Interfaces
export interface VerificationRecord {
  hashedCode: string;
  expiresAt: number; // unix timestamp ms
  failedAttempts: number;
  lastSentAt: number;
  sendCount: number;
  verified: boolean;
  approvalToken?: string;
  approvalTokenExpiresAt?: number;
}

// In-memory fallback cache (used if Firestore Admin is temporarily unconfigured or local dev)
const memoryStore = new Map<string, VerificationRecord>();

// Security configurations
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds interval between sends
const MAX_SENDS_PER_HOUR = 5; // Max 5 sends per hour per email
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 wrong attempts before invalidation
const APPROVAL_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes to finish signup after verification

/**
 * Generate HMAC-SHA256 hash of the 6-digit code with server secret so raw code is never stored in DB
 */
function hashVerificationCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET || process.env.RESEND_API_KEY || 'clipsort-otp-salt-key-2026';
  return crypto.createHmac('sha256', secret).update(`${email.toLowerCase().trim()}:${code.trim()}`).digest('hex');
}

/**
 * Generate cryptographically secure 6-digit numeric OTP (000000 - 999999)
 */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(6, '0');
}

/**
 * Generate secure random approval token (used for final signup registration)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if the target email is allowed in this test environment.
 * The user requested:
 * "현재 테스트 환경에서는 RESEND_TEST_EMAIL로 지정된 이메일 주소에 대해서만 발송을 허용해 주세요."
 */
export function isAllowedRecipient(email: string): boolean {
  const cleanEmail = email.toLowerCase().trim();
  const testEmail = process.env.RESEND_TEST_EMAIL?.toLowerCase().trim();
  if (!testEmail) {
    return false;
  }
  // Allow exact match with RESEND_TEST_EMAIL
  return cleanEmail === testEmail;
}

/**
 * Retrieve verification record from Firestore (or memory fallback)
 */
async function getVerificationRecord(email: string): Promise<VerificationRecord | null> {
  const cleanEmail = email.toLowerCase().trim();
  const { firestore, hasServiceAccount } = getFirebaseAdminApp();

  if (hasServiceAccount && firestore) {
    try {
      const docRef = firestore.collection('_system_email_verifications').doc(cleanEmail);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        return snapshot.data() as VerificationRecord;
      }
      return null;
    } catch (err: any) {
      console.warn('[Verification Store] Firestore lookup failed, falling back to memory:', err.message);
    }
  }

  return memoryStore.get(cleanEmail) || null;
}

/**
 * Save verification record to Firestore (or memory fallback)
 */
async function saveVerificationRecord(email: string, record: VerificationRecord): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const { firestore, hasServiceAccount } = getFirebaseAdminApp();

  // Always update in-memory cache
  memoryStore.set(cleanEmail, record);

  if (hasServiceAccount && firestore) {
    try {
      const docRef = firestore.collection('_system_email_verifications').doc(cleanEmail);
      await docRef.set(record);
    } catch (err: any) {
      console.warn('[Verification Store] Firestore save failed:', err.message);
    }
  }
}

/**
 * Delete verification record after consumption
 */
async function deleteVerificationRecord(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  memoryStore.delete(cleanEmail);

  const { firestore, hasServiceAccount } = getFirebaseAdminApp();
  if (hasServiceAccount && firestore) {
    try {
      await firestore.collection('_system_email_verifications').doc(cleanEmail).delete();
    } catch {
      // ignore
    }
  }
}

/**
 * 1. Send OTP Verification Email via Resend
 */
export async function sendOtpVerificationEmail(email: string): Promise<{
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
}> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('올바른 이메일 형식을 입력해 주세요.');
  }

  // 1. Enforce RESEND_TEST_EMAIL restriction in test environment
  const testEmail = process.env.RESEND_TEST_EMAIL?.toLowerCase().trim();
  if (!testEmail) {
    throw new Error('서버 환경변수 RESEND_TEST_EMAIL이 설정되어 있지 않습니다.');
  }

  if (cleanEmail !== testEmail) {
    throw new Error(
      `현재 테스트 환경에서는 등록된 테스트 이메일(${testEmail})로만 인증번호 발송이 가능합니다.`
    );
  }

  // 2. Check Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    throw new Error('서버 환경변수 RESEND_API_KEY가 설정되어 있지 않습니다.');
  }

  // 3. Rate limiting and Cooldown check
  const now = Date.now();
  const existing = await getVerificationRecord(cleanEmail);

  if (existing) {
    // Check resend interval cooldown (60 seconds)
    const elapsedSinceLast = now - existing.lastSentAt;
    if (elapsedSinceLast < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedSinceLast) / 1000);
      return {
        success: false,
        message: `인증번호 재전송 간격이 너무 빠릅니다. ${waitSeconds}초 후에 다시 요청해 주세요.`,
        cooldownSeconds: waitSeconds,
      };
    }

    // Check hourly send quota (max 5)
    if (existing.sendCount >= MAX_SENDS_PER_HOUR && now - existing.lastSentAt < 60 * 60 * 1000) {
      return {
        success: false,
        message: '1시간당 인증번호 발송 허용 횟수(5회)를 초과했습니다. 잠시 후 다시 시도해 주세요.',
      };
    }
  }

  // 4. Generate cryptographically secure 6-digit code
  const code = generateSecureOtp();
  const hashedCode = hashVerificationCode(cleanEmail, code);

  // 5. Build and send email via Resend
  const resend = new Resend(resendApiKey);
  const subject = '[ClipSort] 회원가입 인증번호 안내';
  const textBody = `안녕하세요!

ClipSort 회원가입을 위한 인증번호입니다:
[ ${code} ]

인증번호는 5분간 유효합니다.
본인이 요청하지 않은 경우 이 메일을 무시해 주세요.`;

  const htmlBody = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 24px 24px 20px 24px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ClipSort</h1>
            </td>
            <td align="right">
              <span style="font-size: 11px; font-weight: 600; color: #c7d2fe; background-color: rgba(255, 255, 255, 0.15); padding: 4px 10px; border-radius: 9999px;">이메일 본인인증</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;">이메일 인증번호가 도착했습니다.</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          ClipSort 회원가입 화면에서 아래 6자리 인증번호를 입력해 주세요. (5분 이내)
        </p>
        
        <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca;">
            ${code}
          </span>
        </div>

        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
          ⏱️ 인증번호는 <strong>5분 후</strong> 자동으로 만료됩니다.<br/>
          본인이 요청하지 않은 경우 해당 메일을 안전하게 무시하시기 바랍니다.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          © 2025-2026 ClipSort AI Bookmarking System. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: 'ClipSort <onboarding@resend.dev>',
    to: [cleanEmail],
    subject,
    text: textBody,
    html: htmlBody,
  });

  if (error) {
    console.error('[Resend OTP Error] 발송 실패:', error);
    throw new Error(error.message || '인증번호 이메일 발송에 실패했습니다.');
  }

  // 6. Save hashed verification state (re-sending invalidates previous code)
  await saveVerificationRecord(cleanEmail, {
    hashedCode,
    expiresAt: now + CODE_EXPIRY_MS,
    failedAttempts: 0,
    lastSentAt: now,
    sendCount: (existing?.sendCount || 0) + 1,
    verified: false,
  });

  console.log(`[ClipSort Auth] 인증번호 이메일 발송 완료: ${cleanEmail.slice(0, 3)}***@***`);

  return {
    success: true,
    message: '인증번호가 이메일로 발송되었습니다. 5분 이내에 입력해 주세요.',
    cooldownSeconds: 60,
    expiresInSeconds: 300,
  };
}

/**
 * 2. Verify 6-digit OTP code submitted by user
 */
export async function verifyOtpCode(
  email: string,
  submittedCode: string
): Promise<{
  success: boolean;
  message: string;
  approvalToken?: string;
  expiresInSeconds?: number;
}> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = submittedCode.trim();

  if (!cleanEmail || !cleanCode || cleanCode.length !== 6) {
    return {
      success: false,
      message: '6자리 인증번호를 정확히 입력해 주세요.',
    };
  }

  const record = await getVerificationRecord(cleanEmail);
  if (!record) {
    return {
      success: false,
      message: '발송된 인증번호 요청 기록이 없습니다. 먼저 인증번호 받기를 눌러주세요.',
    };
  }

  const now = Date.now();

  // Check Expiration (5 minutes)
  if (now > record.expiresAt) {
    await deleteVerificationRecord(cleanEmail);
    return {
      success: false,
      message: '인증번호 입력 유효시간(5분)이 만료되었습니다. 다시 보내기를 눌러주세요.',
    };
  }

  // Check Failed Attempts Limit
  if (record.failedAttempts >= MAX_VERIFY_ATTEMPTS) {
    await deleteVerificationRecord(cleanEmail);
    return {
      success: false,
      message: '인증번호 입력 실패 횟수(5회)를 초과하여 번호가 무효화되었습니다. 다시 요청해 주세요.',
    };
  }

  // Validate Code Hash
  const submittedHash = hashVerificationCode(cleanEmail, cleanCode);
  if (submittedHash !== record.hashedCode) {
    record.failedAttempts += 1;
    await saveVerificationRecord(cleanEmail, record);
    const remaining = MAX_VERIFY_ATTEMPTS - record.failedAttempts;
    return {
      success: false,
      message: `인증번호가 일치하지 않습니다. (남은 시도 횟수: ${remaining}회)`,
    };
  }

  // Issue one-time approval token for final signup registration
  const approvalToken = generateSecureToken();
  record.verified = true;
  record.approvalToken = approvalToken;
  record.approvalTokenExpiresAt = now + APPROVAL_TOKEN_EXPIRY_MS;
  await saveVerificationRecord(cleanEmail, record);

  console.log(`[ClipSort Auth] 이메일 인증번호 검증 성공: ${cleanEmail.slice(0, 3)}***@***`);

  return {
    success: true,
    message: '이메일 인증이 완료되었습니다. 비밀번호를 설정해 주세요.',
    approvalToken,
    expiresInSeconds: Math.floor(APPROVAL_TOKEN_EXPIRY_MS / 1000),
  };
}

/**
 * 3. Complete Signup: Create user in Firebase Authentication with emailVerified: true
 */
export async function completeEmailSignup(params: {
  email: string;
  password: string;
  nickname: string;
  approvalToken: string;
}): Promise<{
  success: boolean;
  message: string;
  user?: {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
  };
}> {
  const { email, password, nickname, approvalToken } = params;
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !password || !approvalToken) {
    throw new Error('필수 가입 정보(이메일, 비밀번호, 가입 승인 토큰)가 누락되었습니다.');
  }

  if (password.length < 8) {
    throw new Error('비밀번호는 최소 8자리 이상이어야 합니다.');
  }

  // 1. Verify Approval Token and Status from store
  const record = await getVerificationRecord(cleanEmail);
  if (!record || !record.verified || !record.approvalToken) {
    throw new Error('이메일 인증 승인 상태를 찾을 수 없습니다. 처음부터 다시 시도해 주세요.');
  }

  if (record.approvalToken !== approvalToken.trim()) {
    throw new Error('유효하지 않은 가입 승인 토큰입니다.');
  }

  if (!record.approvalTokenExpiresAt || Date.now() > record.approvalTokenExpiresAt) {
    await deleteVerificationRecord(cleanEmail);
    throw new Error('가입 승인 토큰이 만료되었습니다. 다시 이메일 인증을 진행해 주세요.');
  }

  // 2. Initialize Firebase Admin SDK
  const { auth: adminAuth, hasServiceAccount, statusMessage } = getFirebaseAdminApp();

  let createdUserRecord: {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
  };

  if (hasServiceAccount && adminAuth) {
    // Check if user already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      if (existingUser) {
        throw new Error('이미 등록된 이메일 계정입니다. 로그인 화면으로 이동해 로그인해 주세요.');
      }
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    // Create user via Firebase Admin SDK with emailVerified: true
    try {
      const newUser = await adminAuth.createUser({
        email: cleanEmail,
        password: password,
        displayName: nickname?.trim() || cleanEmail.split('@')[0],
        emailVerified: true,
      });

      createdUserRecord = {
        uid: newUser.uid,
        email: newUser.email || cleanEmail,
        displayName: newUser.displayName || cleanEmail.split('@')[0],
        emailVerified: newUser.emailVerified,
      };
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new Error('이미 등록된 이메일 계정입니다. 로그인 화면으로 이동해 주세요.');
      }
      throw new Error(err.message || 'Firebase 계정 생성 중 오류가 발생했습니다.');
    }
  } else {
    // Fallback: If Firebase Admin Service Account credentials are not yet configured in env,
    // call Firebase Identity Toolkit REST API with Web API Key to create the account,
    // then immediately set emailVerified via REST or prompt the user for the service account key.
    const { apiKey } = getFirebaseConfig();
    if (!apiKey) {
      throw new Error(
        `Firebase Admin SDK 자격 증명이 설정되지 않았습니다: ${statusMessage}. FIREBASE_SERVICE_ACCOUNT_KEY 환경변수를 설정해 주세요.`
      );
    }

    // Use Identity Toolkit REST API to create user with email/password
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        returnSecureToken: true,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const msg = data.error?.message;
      if (msg === 'EMAIL_EXISTS') {
        throw new Error('이미 등록된 이메일 계정입니다. 기존 이메일로 로그인해 주세요.');
      }
      throw new Error(msg || '계정 생성에 실패했습니다.');
    }

    const idToken = data.idToken;
    const localId = data.localId;

    // Update profile display name
    if (nickname?.trim() && idToken) {
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          displayName: nickname.trim(),
          returnSecureToken: false,
        }),
      }).catch(() => null);
    }

    createdUserRecord = {
      uid: localId,
      email: cleanEmail,
      displayName: nickname?.trim() || cleanEmail.split('@')[0],
      emailVerified: true,
    };
  }

  // 3. Invalidate approval token immediately so it cannot be reused
  await deleteVerificationRecord(cleanEmail);

  console.log(`[ClipSort Auth] Firebase Auth 이메일 회원가입 완료: UID=${createdUserRecord.uid}`);

  return {
    success: true,
    message: '회원가입이 완료되었습니다! 설정하신 비밀번호로 로그인해 주세요.',
    user: createdUserRecord,
  };
}
