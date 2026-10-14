import fs from 'fs';
import path from 'path';

let cachedFirebaseApiKey: string | null = null;
let cachedFirebaseProjectId: string | null = null;

/**
 * Retrieve Firebase web API key and project ID from environment variables
 * or local firebase-applet-config.json file.
 */
export function getFirebaseConfig(): { apiKey: string; projectId: string } {
  if (cachedFirebaseApiKey && cachedFirebaseProjectId) {
    return { apiKey: cachedFirebaseApiKey, projectId: cachedFirebaseProjectId };
  }

  let apiKey =
    process.env.FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    '';
  let projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    '';

  if (!apiKey || !projectId) {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!apiKey && parsed.apiKey) apiKey = parsed.apiKey;
        if (!projectId && parsed.projectId) projectId = parsed.projectId;
      }
    } catch {
      // Configuration file not found or inaccessible
    }
  }

  cachedFirebaseApiKey = apiKey;
  cachedFirebaseProjectId = projectId;

  return { apiKey: cachedFirebaseApiKey, projectId: cachedFirebaseProjectId };
}

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Verify a Firebase ID Token using Google Identity Toolkit accounts:lookup REST API.
 * This cryptographically validates the token against Google's Auth servers
 * without requiring heavy Google Cloud SDKs or service account private key JSON files.
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseUser | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  const cleanToken = idToken.trim();
  if (!cleanToken) {
    return null;
  }

  const { apiKey } = getFirebaseConfig();
  if (!apiKey) {
    console.error(
      '[Firebase Auth] Firebase API Key를 찾을 수 없습니다. VITE_FIREBASE_API_KEY 또는 firebase-applet-config.json을 확인하세요.'
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: cleanToken }),
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!response.ok) {
      const errData = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      console.warn(
        '[Firebase Auth] ID 토큰 검증 실패:',
        errData?.error?.message || response.statusText
      );
      return null;
    }

    const data = (await response.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };

    const user = data.users?.[0];
    if (!user || !user.localId) {
      console.warn('[Firebase Auth] 사용자 레코드를 찾을 수 없습니다.');
      return null;
    }

    return {
      uid: user.localId,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    console.error('[Firebase Auth] 토큰 검증 중 통신 오류:', error);
    return null;
  }
}

/**
 * Check whether a Firebase UID is authorized as an administrator.
 * Supports comma-separated UIDs in the ADMIN_UID environment variable.
 */
export function isAuthorizedAdmin(uid: string): boolean {
  const adminUidEnv = process.env.ADMIN_UID;
  if (!adminUidEnv || !adminUidEnv.trim()) {
    console.warn('[Admin Auth] ADMIN_UID 환경변수가 서버에 등록되어 있지 않습니다.');
    return false;
  }

  const allowedUids = adminUidEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return allowedUids.includes(uid.trim());
}
