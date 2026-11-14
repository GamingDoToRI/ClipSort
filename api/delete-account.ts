import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAdminApp } from '../src/server/firebaseAdminHelper.js';

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
      // If server does not have service account, tell client to complete client-side deletion
      return res.status(200).json({
        success: true,
        clientFallback: true,
        message: '클라이언트 측 Firebase Auth 및 Firestore 삭제를 수행해 주세요.',
      });
    }

    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 인증 토큰입니다.',
      });
    }

    // 1. Delete all user's video documents & account unification links from Firestore if adminDb is available
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

      // Clean up any account_links pointing to this UID and user_accounts record
      const linkedSnap = await adminDb.collection('account_links').where('masterUid', '==', uid).get();
      if (!linkedSnap.empty) {
        const batch = adminDb.batch();
        linkedSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      await adminDb.collection('account_links').doc(uid).delete().catch(() => {});
      await adminDb.collection('user_accounts').doc(uid).delete().catch(() => {});
    }

    // 2. Delete user account from Firebase Auth
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleDeleteAccount(req, res);
}
