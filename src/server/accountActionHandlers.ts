import {
  sendOtpVerificationEmail,
  verifyOtpCode,
  completeEmailSignup,
} from './emailAuthService.js';
import { getFirebaseAdminApp } from './firebaseAdminHelper.js';

export async function handleSendVerificationCode(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email, purpose } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: '이메일 주소를 입력해 주세요.',
      });
    }

    const result = await sendOtpVerificationEmail(email, purpose);
    return res.status(result.success ? 200 : 429).json(result);
  } catch (error: any) {
    console.warn('[Send Code Notice]:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || '인증번호 발송 처리 중 오류가 발생했습니다.',
    });
  }
}

export async function handleVerifyCode(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: '이메일과 6자리 인증번호를 모두 입력해 주세요.',
      });
    }

    const result = await verifyOtpCode(email, code);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.warn('[Verify Code Notice]:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || '인증번호 검증 처리 중 오류가 발생했습니다.',
    });
  }
}

export async function handleCompleteSignup(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email, password, nickname, approvalToken, allowPasswordUpdate } = req.body || {};
    if (!email || !password || !approvalToken) {
      return res.status(400).json({
        success: false,
        error: '이메일, 비밀번호, 가입 승인 토큰이 모두 필요합니다.',
      });
    }

    const result = await completeEmailSignup({
      email,
      password,
      nickname,
      approvalToken,
      allowPasswordUpdate: Boolean(allowPasswordUpdate),
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.code === 'EMAIL_ALREADY_EXISTS' || error.message?.includes('이미 등록된')) {
      console.warn('[Complete Signup Notice]:', error.message);
    } else {
      console.error('[Complete Signup API Error]:', error.message);
    }
    return res.status(400).json({
      success: false,
      code: error.code || 'SIGNUP_ERROR',
      error: error.message || '회원가입 처리 중 오류가 발생했습니다.',
    });
  }
}

export async function handleDeleteAccount(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 허용됩니다.',
    });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.body?.idToken;

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰(idToken)이 필요합니다.',
      });
    }

    const { auth: adminAuth, firestore: adminDb, hasServiceAccount } = getFirebaseAdminApp();

    if (!hasServiceAccount || !adminAuth) {
      return res.status(200).json({
        success: true,
        clientFallback: true,
        message: '클라이언트 측 Firebase Auth 및 Firestore 삭제를 수행해 주세요.',
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 인증 토큰입니다.',
      });
    }

    let deletedDocsCount = 0;
    if (adminDb) {
      const snapshot = await adminDb.collection('videos').where('userId', '==', uid).get();
      if (!snapshot.empty) {
        for (let i = 0; i < snapshot.docs.length; i += 400) {
          const batch = adminDb.batch();
          snapshot.docs.slice(i, i + 400).forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }
        deletedDocsCount = snapshot.size;
      }

      const linkedSnap = await adminDb.collection('account_links').where('masterUid', '==', uid).get();
      if (!linkedSnap.empty) {
        const batch = adminDb.batch();
        linkedSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      await adminDb.collection('account_links').doc(uid).delete().catch(() => {});
      await adminDb.collection('user_accounts').doc(uid).delete().catch(() => {});
    }

    await adminAuth.deleteUser(uid);

    return res.status(200).json({
      success: true,
      deletedDocsCount,
      message: '회원 탈퇴 및 모든 데이터가 영구적으로 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[Delete Account API Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '회원 탈퇴 처리 중 서버 오류가 발생했습니다.',
    });
  }
}
