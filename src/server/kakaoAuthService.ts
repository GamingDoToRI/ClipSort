import crypto from 'crypto';
import { getFirebaseAdminApp } from './firebaseAdminHelper.js';
import {
  syncAndAutoUnifyKakaoAccount,
  extractLinkedEmails,
  resolveDisplayEmail,
  type SupportedProvider,
  type LinkedEmailsMap,
} from './accountMergeService.js';

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function cleanEnvValue(val?: string): string {
  if (!val) return '';
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getStateSecret(): string {
  return (
    cleanEnvValue(process.env.AUTH_SECRET) ||
    cleanEnvValue(process.env.KAKAO_CLIENT_SECRET) ||
    cleanEnvValue(process.env.KAKAO_CLIENT_ID) ||
    'clipsort-kakao-oauth-state-secret-2026'
  );
}

function getAppBaseUrl(): string {
  const envAppUrl = cleanEnvValue(process.env.APP_URL);
  if (envAppUrl) {
    return envAppUrl.replace(/\/+$/, '');
  }
  const vercelUrl =
    cleanEnvValue(process.env.VERCEL_PROJECT_PRODUCTION_URL) || cleanEnvValue(process.env.VERCEL_URL);
  if (vercelUrl) {
    const withProtocol = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return withProtocol.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function getKakaoRedirectUri(): string {
  return `${getAppBaseUrl()}/api/auth/kakao/callback`;
}

function createSignedState(): string {
  const ts = Date.now().toString(36);
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${ts}.${nonce}`;
  const sig = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySignedState(state: string): boolean {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  if (!ts || !nonce || !sig) return false;

  const payload = `${ts}.${nonce}`;
  const expectedSig = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('hex');
  if (sig.length !== expectedSig.length) return false;

  const isMatch = crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expectedSig, 'utf8'));
  if (!isMatch) return false;

  const issuedAt = parseInt(ts, 36);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > STATE_EXPIRY_MS) return false;

  return true;
}

function sendPopupResultHtml(
  res: any,
  payload:
    | {
        type: 'KAKAO_OAUTH_SUCCESS';
        customToken: string;
        autoMerged?: boolean;
        migratedCount?: number;
        profile: {
          uid: string;
          nickname: string;
          email: string;
          avatarUrl?: string;
          provider: 'kakao';
          linkedProviders?: SupportedProvider[];
          linkedEmails?: LinkedEmailsMap;
        };
      }
    | {
        type: 'KAKAO_OAUTH_ERROR';
        error: string;
      }
) {
  const serialized = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const isSuccess = payload.type === 'KAKAO_OAUTH_SUCCESS';
  const statusTitle = isSuccess ? '카카오 로그인 완료' : '카카오 로그인 오류';
  const statusDesc = isSuccess
    ? '인증이 완료되었습니다. 창이 자동으로 닫힙니다.'
    : payload.error;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${statusTitle} - ClipSort</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf8ff; color: #131b2e; text-align: center; padding: 24px; }
    .card { max-width: 360px; background: #fff; border: 1px solid #dae2fd; border-radius: 20px; padding: 28px 24px; box-shadow: 0 10px 30px rgba(80,70,229,0.08); }
    h1 { font-size: 17px; margin: 0 0 8px; }
    p { font-size: 13px; color: #464555; line-height: 1.5; margin: 0 0 16px; }
    button { background: #5046e5; color: #fff; border: 0; border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${statusTitle}</h1>
    <p id="msg"></p>
    <button type="button" onclick="window.close()">창 닫기</button>
  </div>
  <script>
    (function () {
      var data = ${serialized};
      document.getElementById('msg').textContent = ${JSON.stringify(statusDesc)};
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(data, '*');
        setTimeout(function () { window.close(); }, 150);
      } else if (data.type === 'KAKAO_OAUTH_SUCCESS') {
        window.location.href = '/';
      }
    })();
  </script>
</body>
</html>`);
}

export async function handleKakaoAuthUrl(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const clientId = cleanEnvValue(process.env.KAKAO_CLIENT_ID);
  if (!clientId) {
    return res.status(503).json({
      success: false,
      code: 'KAKAO_NOT_CONFIGURED',
      error: '카카오 로그인 설정(KAKAO_CLIENT_ID)이 아직 완료되지 않았습니다.',
      redirectUri: getKakaoRedirectUri(),
    });
  }

  const redirectUri = getKakaoRedirectUri();
  const state = createSignedState();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  const url = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  return res.status(200).json({
    success: true,
    url,
    redirectUri,
  });
}

export async function handleKakaoAuthCallback(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { code, state, error, error_description } = req.query || {};

    if (error) {
      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error: String(error_description || error || '카카오 로그인이 취소되었습니다.'),
      });
    }

    if (!code || !state || !verifySignedState(String(state))) {
      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error: '보안 인증(state)이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.',
      });
    }

    const clientId = cleanEnvValue(process.env.KAKAO_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.KAKAO_CLIENT_SECRET);
    if (!clientId) {
      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error: '서버에 KAKAO_CLIENT_ID가 설정되어 있지 않습니다.',
      });
    }

    const redirectUri = getKakaoRedirectUri();

    // 1. Exchange authorization code for Kakao access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code: String(code),
    });
    if (clientSecret) {
      tokenParams.set('client_secret', clientSecret);
    }

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: tokenParams.toString(),
    });

    const tokenData = (await tokenRes.json().catch(() => ({}))) as any;
    if (!tokenRes.ok || !tokenData.access_token) {
      const errorCode = String(tokenData.error_code || '');
      const errorDesc = String(tokenData.error_description || tokenData.error || '');
      console.error('[Kakao OAuth] Token exchange failed:', {
        status: tokenRes.status,
        errorCode,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        hasClientSecret: Boolean(clientSecret),
      });

      let friendlyError =
        errorDesc || '카카오 인증 토큰 발급에 실패했습니다. Redirect URI 설정을 확인해 주세요.';

      if (
        errorCode === 'KOE010' ||
        /bad client credentials/i.test(errorDesc) ||
        tokenData.error === 'invalid_client'
      ) {
        friendlyError = clientSecret
          ? '카카오 Client Secret 값이 일치하지 않습니다. AI Studio의 KAKAO_CLIENT_SECRET에 카카오 개발자 콘솔의 클라이언트 시크릿 코드가 정확히 입력되었는지 확인해 주세요.'
          : '카카오 앱에 Client Secret(보안 코드)이 활성화되어 있습니다. AI Studio 환경변수에 KAKAO_CLIENT_SECRET을 등록하거나, 카카오 개발자 콘솔에서 클라이언트 시크릿을 비활성화해 주세요.';
      }

      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error: friendlyError,
      });
    }

    // 2. Fetch Kakao user profile
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const profileData = (await profileRes.json().catch(() => ({}))) as any;
    if (!profileRes.ok || !profileData.id) {
      console.error('[Kakao OAuth] Profile fetch failed:', profileData);
      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error: '카카오 프로필 정보를 불러오지 못했습니다.',
      });
    }

    const kakaoId = String(profileData.id);
    const kakaoAccount = profileData.kakao_account || {};
    const profile = kakaoAccount.profile || profileData.properties || {};

    const nickname =
      String(profile.nickname || kakaoAccount.name || '').trim() || `카카오사용자_${kakaoId.slice(-4)}`;
    const email = kakaoAccount.email ? String(kakaoAccount.email).trim().toLowerCase() : '';
    const isEmailVerified = Boolean(
      email && kakaoAccount.is_email_valid !== false && kakaoAccount.is_email_verified !== false
    );
    const rawAvatar = profile.profile_image_url || profile.thumbnail_image_url || '';
    const avatarUrl =
      typeof rawAvatar === 'string' && rawAvatar.startsWith('http://')
        ? rawAvatar.replace('http://', 'https://')
        : typeof rawAvatar === 'string'
        ? rawAvatar
        : undefined;

    // 3. Create or update Firebase Auth user & auto-unify verified email accounts under Kakao Master UID
    const { auth: adminAuth, firestore: adminDb, hasServiceAccount } = getFirebaseAdminApp();
    if (!hasServiceAccount || !adminAuth) {
      return sendPopupResultHtml(res, {
        type: 'KAKAO_OAUTH_ERROR',
        error:
          '서버에 FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않아 카카오 계정을 Firebase에 연동할 수 없습니다.',
      });
    }

    const uid = `kakao_${kakaoId}`;
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUser(uid);
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    if (!existingUser) {
      const createPayload: any = {
        uid,
        displayName: nickname,
      };
      if (avatarUrl) {
        createPayload.photoURL = avatarUrl;
      }
      if (email) {
        // Attach email only if not already owned by another UID
        let emailInUse = false;
        try {
          await adminAuth.getUserByEmail(email);
          emailInUse = true;
        } catch {
          emailInUse = false;
        }
        if (!emailInUse) {
          createPayload.email = email;
          createPayload.emailVerified = isEmailVerified;
        }
      }
      existingUser = await adminAuth.createUser(createPayload);
    } else {
      const updatePayload: any = {};
      if (nickname && existingUser.displayName !== nickname) {
        updatePayload.displayName = nickname;
      }
      if (avatarUrl && existingUser.photoURL !== avatarUrl) {
        updatePayload.photoURL = avatarUrl;
      }
      if (Object.keys(updatePayload).length > 0) {
        await adminAuth.updateUser(uid, updatePayload).catch(() => {});
      }
    }

    const unifyResult = await syncAndAutoUnifyKakaoAccount({
      adminAuth,
      adminDb,
      kakaoUid: uid,
      kakaoEmail: email,
      kakaoEmailVerified: isEmailVerified,
      kakaoNickname: nickname,
      kakaoAvatar: avatarUrl,
    });

    const linkedProviders = unifyResult.userAccount.linkedProviders;
    const customToken = await adminAuth.createCustomToken(uid, {
      provider: 'kakao',
      linkedProviders,
    });

    return sendPopupResultHtml(res, {
      type: 'KAKAO_OAUTH_SUCCESS',
      customToken,
      autoMerged: unifyResult.autoMerged,
      migratedCount: unifyResult.migratedCount,
      profile: {
        uid,
        nickname: existingUser?.displayName || nickname,
        email: email || resolveDisplayEmail(existingUser, unifyResult.userAccount),
        avatarUrl,
        provider: 'kakao',
        linkedProviders,
        linkedEmails: extractLinkedEmails(unifyResult.userAccount),
      },
    });
  } catch (err: any) {
    console.error('[Kakao OAuth Callback Error]:', err);
    return sendPopupResultHtml(res, {
      type: 'KAKAO_OAUTH_ERROR',
      error: err?.message || '카카오 로그인 처리 중 서버 오류가 발생했습니다.',
    });
  }
}
