import type { Auth, UserRecord, DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from './firebaseAdminHelper.js';

export type SupportedProvider = 'kakao' | 'google' | 'email';

export interface LinkedEmailsMap {
  kakao?: string;
  google?: string;
  email?: string;
}

export interface UnifiedAccountRecord {
  masterUid: string;
  primaryProvider: SupportedProvider;
  linkedProviders: SupportedProvider[];
  kakaoEmail?: string;
  kakaoEmailVerified?: boolean;
  kakaoNickname?: string;
  kakaoAvatar?: string;
  googleUid?: string;
  googleEmail?: string;
  emailUid?: string;
  emailAddress?: string;
  updatedAt: number;
}

export function detectProviderFromAuthUser(
  userRecord?: UserRecord | null,
  decoded?: Partial<DecodedIdToken> | null
): SupportedProvider {
  const uid = userRecord?.uid || decoded?.uid || '';
  if (uid.startsWith('kakao_') || decoded?.provider === 'kakao') {
    return 'kakao';
  }
  const hasGoogleProvider =
    userRecord?.providerData?.some((p) => p.providerId === 'google.com') ||
    decoded?.firebase?.sign_in_provider === 'google.com';
  if (hasGoogleProvider) {
    return 'google';
  }
  return 'email';
}

export function extractLinkedEmails(data?: Partial<UnifiedAccountRecord> | null): LinkedEmailsMap {
  const result: LinkedEmailsMap = {};
  if (data?.kakaoEmail) result.kakao = data.kakaoEmail;
  if (data?.googleEmail) result.google = data.googleEmail;
  if (data?.emailAddress) result.email = data.emailAddress;
  return result;
}

export function resolveDisplayEmail(
  authUser?: UserRecord | null,
  accountData?: Partial<UnifiedAccountRecord> | null
): string {
  return (
    authUser?.email ||
    accountData?.kakaoEmail ||
    accountData?.googleEmail ||
    accountData?.emailAddress ||
    ''
  );
}

/**
 * Resolves a UID to its master UID via `account_links` (up to 3 hops to guard against cycles).
 */
export async function resolveMasterUid(adminDb: Firestore, uid: string): Promise<string> {
  let current = uid;
  for (let i = 0; i < 3; i++) {
    const snap = await adminDb.collection('account_links').doc(current).get();
    if (!snap.exists) break;
    const nextUid = snap.data()?.masterUid;
    if (!nextUid || typeof nextUid !== 'string' || nextUid === current) break;
    current = nextUid;
  }
  return current;
}

/**
 * Migrates all Firestore `videos` documents from `fromUid` to `toUid`,
 * deduplicating identical active URLs already stored under `toUid`.
 */
export async function migrateUserVideos(
  adminDb: Firestore,
  fromUid: string,
  toUid: string
): Promise<{ migratedCount: number; deduplicatedCount: number }> {
  if (!fromUid || !toUid || fromUid === toUid) {
    return { migratedCount: 0, deduplicatedCount: 0 };
  }

  const [fromSnap, toSnap] = await Promise.all([
    adminDb.collection('videos').where('userId', '==', fromUid).get(),
    adminDb.collection('videos').where('userId', '==', toUid).get(),
  ]);

  if (fromSnap.empty) {
    return { migratedCount: 0, deduplicatedCount: 0 };
  }

  const existingActiveUrls = new Set<string>();
  toSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (!d.inTrash && d.status !== 'trash_purged' && typeof d.url === 'string' && d.url.trim()) {
      existingActiveUrls.add(d.url.trim());
    }
  });

  let migratedCount = 0;
  let deduplicatedCount = 0;
  const CHUNK_SIZE = 400;

  for (let i = 0; i < fromSnap.docs.length; i += CHUNK_SIZE) {
    const chunk = fromSnap.docs.slice(i, i + CHUNK_SIZE);
    const batch = adminDb.batch();

    chunk.forEach((doc) => {
      const d = doc.data();
      const normUrl = typeof d.url === 'string' ? d.url.trim() : '';
      const isActive = !d.inTrash && d.status !== 'trash_purged';

      if (isActive && normUrl && existingActiveUrls.has(normUrl)) {
        batch.delete(doc.ref);
        deduplicatedCount += 1;
      } else {
        batch.update(doc.ref, { userId: toUid });
        migratedCount += 1;
        if (isActive && normUrl) {
          existingActiveUrls.add(normUrl);
        }
      }
    });

    await batch.commit();
  }

  return { migratedCount, deduplicatedCount };
}

/**
 * Links `secondaryUid` into `masterUid` in Firestore, consolidates any transitive links,
 * merges metadata into `user_accounts/{masterUid}`, and migrates videos.
 */
export async function linkAccountPair(params: {
  adminAuth: Auth;
  adminDb: Firestore;
  masterUid: string;
  masterProvider: SupportedProvider;
  masterEmail?: string;
  masterNickname?: string;
  masterAvatar?: string;
  secondaryUid: string;
  secondaryProvider: SupportedProvider;
  secondaryEmail?: string;
}): Promise<{
  migratedCount: number;
  deduplicatedCount: number;
  userAccount: UnifiedAccountRecord;
}> {
  const {
    adminAuth,
    adminDb,
    masterUid,
    masterProvider,
    masterEmail = '',
    masterNickname,
    masterAvatar,
    secondaryUid,
    secondaryProvider,
    secondaryEmail = '',
  } = params;

  const now = Date.now();

  const [masterAccountSnap, secondaryAccountSnap] = await Promise.all([
    adminDb.collection('user_accounts').doc(masterUid).get(),
    adminDb.collection('user_accounts').doc(secondaryUid).get(),
  ]);

  const masterExisting = (masterAccountSnap.exists ? masterAccountSnap.data() : {}) as Partial<UnifiedAccountRecord>;
  const secondaryExisting = (secondaryAccountSnap.exists ? secondaryAccountSnap.data() : {}) as Partial<UnifiedAccountRecord>;

  const providerSet = new Set<SupportedProvider>([
    masterProvider,
    secondaryProvider,
    ...(Array.isArray(masterExisting.linkedProviders) ? masterExisting.linkedProviders : []),
    ...(Array.isArray(secondaryExisting.linkedProviders) ? secondaryExisting.linkedProviders : []),
  ]);

  const cleanMasterEmail = masterEmail.trim().toLowerCase();
  const cleanSecondaryEmail = secondaryEmail.trim().toLowerCase();

  const mergedAccount: UnifiedAccountRecord = {
    masterUid,
    primaryProvider: masterUid.startsWith('kakao_') ? 'kakao' : masterExisting.primaryProvider || masterProvider,
    linkedProviders: Array.from(providerSet),
    kakaoEmail:
      masterExisting.kakaoEmail ||
      secondaryExisting.kakaoEmail ||
      (masterProvider === 'kakao' ? cleanMasterEmail : '') ||
      (secondaryProvider === 'kakao' ? cleanSecondaryEmail : '') ||
      '',
    kakaoEmailVerified: Boolean(
      masterExisting.kakaoEmailVerified || secondaryExisting.kakaoEmailVerified
    ),
    kakaoNickname: masterNickname || masterExisting.kakaoNickname || secondaryExisting.kakaoNickname || '',
    kakaoAvatar: masterAvatar || masterExisting.kakaoAvatar || secondaryExisting.kakaoAvatar || '',
    googleUid:
      masterExisting.googleUid ||
      secondaryExisting.googleUid ||
      (secondaryProvider === 'google' ? secondaryUid : masterProvider === 'google' ? masterUid : undefined),
    googleEmail:
      masterExisting.googleEmail ||
      secondaryExisting.googleEmail ||
      (secondaryProvider === 'google' ? cleanSecondaryEmail : masterProvider === 'google' ? cleanMasterEmail : '') ||
      '',
    emailUid:
      masterExisting.emailUid ||
      secondaryExisting.emailUid ||
      (secondaryProvider === 'email' ? secondaryUid : masterProvider === 'email' ? masterUid : undefined),
    emailAddress:
      masterExisting.emailAddress ||
      secondaryExisting.emailAddress ||
      (secondaryProvider === 'email' ? cleanSecondaryEmail : masterProvider === 'email' ? cleanMasterEmail : '') ||
      '',
    updatedAt: now,
  };

  // Remove undefined keys for Firestore write safety
  const sanitizedAccount = Object.fromEntries(
    Object.entries(mergedAccount).filter(([, v]) => v !== undefined)
  );

  // 1. Write primary user_accounts record & secondary link mapping
  await Promise.all([
    adminDb.collection('user_accounts').doc(masterUid).set(sanitizedAccount, { merge: true }),
    adminDb.collection('account_links').doc(secondaryUid).set({
      masterUid,
      provider: secondaryProvider,
      email: cleanSecondaryEmail,
      linkedAt: now,
    }),
  ]);

  // 2. Re-point any existing links that previously targeted secondaryUid
  const transitiveLinks = await adminDb
    .collection('account_links')
    .where('masterUid', '==', secondaryUid)
    .get();
  if (!transitiveLinks.empty) {
    const batch = adminDb.batch();
    transitiveLinks.docs.forEach((doc) => {
      if (doc.id !== masterUid) {
        batch.update(doc.ref, { masterUid });
      }
    });
    await batch.commit();
  }

  // Remove secondaryUid's obsolete user_accounts doc if present
  if (secondaryAccountSnap.exists && secondaryUid !== masterUid) {
    await adminDb.collection('user_accounts').doc(secondaryUid).delete().catch(() => {});
  }

  // 3. Migrate & deduplicate videos
  const { migratedCount, deduplicatedCount } = await migrateUserVideos(adminDb, secondaryUid, masterUid);

  // 4. Sync custom claims on masterUid (best effort)
  await adminAuth
    .setCustomUserClaims(masterUid, {
      provider: mergedAccount.primaryProvider,
      linkedProviders: mergedAccount.linkedProviders,
    })
    .catch(() => {});

  return {
    migratedCount,
    deduplicatedCount,
    userAccount: mergedAccount,
  };
}

/**
 * Ensures Kakao user metadata exists in `user_accounts/{kakaoUid}` and automatically unifies
 * with an existing verified Google/Email account if their verified email matches.
 * Kakao UID (`kakao_${kakaoId}`) is always designated as the Master UID.
 */
export async function syncAndAutoUnifyKakaoAccount(params: {
  adminAuth: Auth;
  adminDb: Firestore | null;
  kakaoUid: string;
  kakaoEmail?: string;
  kakaoEmailVerified: boolean;
  kakaoNickname: string;
  kakaoAvatar?: string;
}): Promise<{
  autoMerged: boolean;
  mergedFromProvider?: SupportedProvider;
  migratedCount: number;
  userAccount: UnifiedAccountRecord;
}> {
  const {
    adminAuth,
    adminDb,
    kakaoUid,
    kakaoEmail = '',
    kakaoEmailVerified,
    kakaoNickname,
    kakaoAvatar,
  } = params;

  const cleanEmail = kakaoEmail.trim().toLowerCase();
  const defaultRecord: UnifiedAccountRecord = {
    masterUid: kakaoUid,
    primaryProvider: 'kakao',
    linkedProviders: ['kakao'],
    kakaoEmail: cleanEmail,
    kakaoEmailVerified,
    kakaoNickname,
    kakaoAvatar: kakaoAvatar || '',
    updatedAt: Date.now(),
  };

  if (!adminDb) {
    return {
      autoMerged: false,
      migratedCount: 0,
      userAccount: defaultRecord,
    };
  }

  const accountRef = adminDb.collection('user_accounts').doc(kakaoUid);
  const existingSnap = await accountRef.get();
  const existingData = (existingSnap.exists ? existingSnap.data() : {}) as Partial<UnifiedAccountRecord>;

  const initialProviders = Array.from(
    new Set<SupportedProvider>([
      'kakao',
      ...(Array.isArray(existingData.linkedProviders) ? existingData.linkedProviders : []),
    ])
  );

  let currentAccount: UnifiedAccountRecord = {
    ...defaultRecord,
    ...existingData,
    masterUid: kakaoUid,
    primaryProvider: 'kakao',
    linkedProviders: initialProviders,
    kakaoEmail: cleanEmail || existingData.kakaoEmail || '',
    kakaoEmailVerified: Boolean(kakaoEmailVerified || existingData.kakaoEmailVerified),
    kakaoNickname: kakaoNickname || existingData.kakaoNickname || '',
    kakaoAvatar: kakaoAvatar || existingData.kakaoAvatar || '',
    updatedAt: Date.now(),
  };

  const sanitizedInitial = Object.fromEntries(
    Object.entries(currentAccount).filter(([, v]) => v !== undefined)
  );
  await accountRef.set(sanitizedInitial, { merge: true });

  // Automatic email-based unification when Kakao email is verified
  if (cleanEmail && kakaoEmailVerified) {
    let existingAuthUser: UserRecord | null = null;
    try {
      existingAuthUser = await adminAuth.getUserByEmail(cleanEmail);
    } catch {
      existingAuthUser = null;
    }

    if (existingAuthUser && existingAuthUser.uid !== kakaoUid && existingAuthUser.emailVerified) {
      const secondaryProvider = detectProviderFromAuthUser(existingAuthUser);
      const existingLinkSnap = await adminDb.collection('account_links').doc(existingAuthUser.uid).get();
      const alreadyLinkedToThisMaster =
        existingLinkSnap.exists && existingLinkSnap.data()?.masterUid === kakaoUid;

      const linkResult = await linkAccountPair({
        adminAuth,
        adminDb,
        masterUid: kakaoUid,
        masterProvider: 'kakao',
        masterEmail: cleanEmail,
        masterNickname: kakaoNickname,
        masterAvatar: kakaoAvatar,
        secondaryUid: existingAuthUser.uid,
        secondaryProvider,
        secondaryEmail: existingAuthUser.email || cleanEmail,
      });

      currentAccount = linkResult.userAccount;
      return {
        autoMerged: !alreadyLinkedToThisMaster,
        mergedFromProvider: secondaryProvider,
        migratedCount: linkResult.migratedCount,
        userAccount: currentAccount,
      };
    }
  }

  return {
    autoMerged: false,
    migratedCount: 0,
    userAccount: currentAccount,
  };
}

function extractIdTokenFromReq(req: any, bodyField = 'idToken'): string {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.body && typeof req.body[bodyField] === 'string') {
    return req.body[bodyField].trim();
  }
  return '';
}

/**
 * POST /api/auth/resolve-session
 * Resolves the active Firebase ID token:
 * 1) If this account is linked to a Kakao Master UID (explicitly or via matching verified email),
 *    returns `redirected: true` + `switchCustomToken` so the client switches to the Master UID.
 * 2) Otherwise returns unified `linkedProviders`, `linkedEmails`, and resolved email metadata.
 */
export async function handleResolveSession(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const idToken = extractIdTokenFromReq(req, 'idToken');
    if (!idToken) {
      return res.status(401).json({ success: false, error: '인증 토큰이 필요합니다.' });
    }

    const { auth: adminAuth, firestore: adminDb, hasServiceAccount } = getFirebaseAdminApp();
    if (!hasServiceAccount || !adminAuth || !adminDb) {
      return res.status(200).json({
        success: true,
        redirected: false,
        serverLinkingAvailable: false,
      });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 1. Check explicit account_links mapping
    const resolvedMasterUid = await resolveMasterUid(adminDb, uid);
    if (resolvedMasterUid !== uid) {
      try {
        const [masterUser, masterAccountSnap] = await Promise.all([
          adminAuth.getUser(resolvedMasterUid),
          adminDb.collection('user_accounts').doc(resolvedMasterUid).get(),
        ]);
        const accountData = (masterAccountSnap.exists ? masterAccountSnap.data() : {}) as Partial<UnifiedAccountRecord>;
        const masterProvider = detectProviderFromAuthUser(masterUser);
        const linkedProviders = Array.from(
          new Set<SupportedProvider>([
            masterProvider,
            ...(Array.isArray(accountData.linkedProviders) ? accountData.linkedProviders : []),
          ])
        );

        const switchCustomToken = await adminAuth.createCustomToken(resolvedMasterUid, {
          provider: masterProvider,
          linkedProviders,
        });

        return res.status(200).json({
          success: true,
          redirected: true,
          autoMerged: false,
          masterUid: resolvedMasterUid,
          switchCustomToken,
          profile: {
            uid: resolvedMasterUid,
            nickname: masterUser.displayName || accountData.kakaoNickname || '클립사용자',
            email: resolveDisplayEmail(masterUser, accountData),
            avatarUrl: masterUser.photoURL || accountData.kakaoAvatar || undefined,
            provider: masterProvider,
            linkedProviders,
            linkedEmails: extractLinkedEmails(accountData),
          },
        });
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
          await adminDb.collection('account_links').doc(uid).delete().catch(() => {});
        } else {
          throw err;
        }
      }
    }

    // 2. If user signed in with Google/Email (verified), check if a Kakao Master account shares the verified email
    const loginEmail = decoded.email?.trim().toLowerCase() || '';
    if (!uid.startsWith('kakao_') && loginEmail && decoded.email_verified) {
      const matchingKakaoSnap = await adminDb
        .collection('user_accounts')
        .where('kakaoEmail', '==', loginEmail)
        .where('kakaoEmailVerified', '==', true)
        .limit(1)
        .get();

      if (!matchingKakaoSnap.empty) {
        const kakaoDoc = matchingKakaoSnap.docs[0]!;
        const kakaoMasterUid = kakaoDoc.id;

        if (kakaoMasterUid !== uid && kakaoMasterUid.startsWith('kakao_')) {
          try {
            const masterUser = await adminAuth.getUser(kakaoMasterUid);
            const secondaryUser = await adminAuth.getUser(uid);
            const secondaryProvider = detectProviderFromAuthUser(secondaryUser, decoded);

            const linkResult = await linkAccountPair({
              adminAuth,
              adminDb,
              masterUid: kakaoMasterUid,
              masterProvider: 'kakao',
              masterEmail: loginEmail,
              secondaryUid: uid,
              secondaryProvider,
              secondaryEmail: loginEmail,
            });

            const switchCustomToken = await adminAuth.createCustomToken(kakaoMasterUid, {
              provider: 'kakao',
              linkedProviders: linkResult.userAccount.linkedProviders,
            });

            return res.status(200).json({
              success: true,
              redirected: true,
              autoMerged: true,
              migratedCount: linkResult.migratedCount,
              masterUid: kakaoMasterUid,
              switchCustomToken,
              profile: {
                uid: kakaoMasterUid,
                nickname:
                  masterUser.displayName ||
                  linkResult.userAccount.kakaoNickname ||
                  secondaryUser.displayName ||
                  '클립사용자',
                email: resolveDisplayEmail(masterUser, linkResult.userAccount),
                avatarUrl:
                  masterUser.photoURL ||
                  linkResult.userAccount.kakaoAvatar ||
                  secondaryUser.photoURL ||
                  undefined,
                provider: 'kakao' as SupportedProvider,
                linkedProviders: linkResult.userAccount.linkedProviders,
                linkedEmails: extractLinkedEmails(linkResult.userAccount),
              },
            });
          } catch (err: any) {
            if (err?.code !== 'auth/user-not-found') {
              console.warn('[ResolveSession] Auto-merge check warning:', err?.message);
            }
          }
        }
      }
    }

    // 3. Normal session: return unified metadata for current UID
    const [authUser, accountSnap] = await Promise.all([
      adminAuth.getUser(uid),
      adminDb.collection('user_accounts').doc(uid).get(),
    ]);
    const accountData = (accountSnap.exists ? accountSnap.data() : {}) as Partial<UnifiedAccountRecord>;
    const provider = detectProviderFromAuthUser(authUser, decoded);
    const linkedProviders = Array.from(
      new Set<SupportedProvider>([
        provider,
        ...(Array.isArray(accountData.linkedProviders) ? accountData.linkedProviders : []),
      ])
    );

    const linkedEmails = extractLinkedEmails(accountData);
    if (provider === 'google' && authUser.email && !linkedEmails.google) {
      linkedEmails.google = authUser.email;
    } else if (provider === 'email' && authUser.email && !linkedEmails.email) {
      linkedEmails.email = authUser.email;
    } else if (provider === 'kakao' && (authUser.email || accountData.kakaoEmail) && !linkedEmails.kakao) {
      linkedEmails.kakao = authUser.email || accountData.kakaoEmail;
    }

    return res.status(200).json({
      success: true,
      redirected: false,
      masterUid: uid,
      profile: {
        uid,
        nickname: authUser.displayName || accountData.kakaoNickname || authUser.email?.split('@')[0] || '클립사용자',
        email: resolveDisplayEmail(authUser, accountData),
        avatarUrl: authUser.photoURL || accountData.kakaoAvatar || undefined,
        provider,
        linkedProviders,
        linkedEmails,
      },
    });
  } catch (err: any) {
    console.error('[ResolveSession Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || '세션 동기화 확인 중 오류가 발생했습니다.',
    });
  }
}

/**
 * POST /api/auth/merge-accounts
 * Explicitly links and merges two verified accounts (`currentIdToken` + `linkingIdToken`).
 * Rule: Whenever a Kakao account is part of the pair, Kakao (`kakao_*`) ALWAYS becomes the Master UID.
 */
export async function handleMergeAccounts(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const currentIdToken = extractIdTokenFromReq(req, 'currentIdToken');
    const linkingIdToken =
      typeof req.body?.linkingIdToken === 'string' ? req.body.linkingIdToken.trim() : '';

    if (!currentIdToken || !linkingIdToken) {
      return res.status(400).json({
        success: false,
        error: '계정 연결을 위해 두 계정의 인증 토큰이 모두 필요합니다.',
      });
    }

    const { auth: adminAuth, firestore: adminDb, hasServiceAccount } = getFirebaseAdminApp();
    if (!hasServiceAccount || !adminAuth || !adminDb) {
      return res.status(503).json({
        success: false,
        error: '서버의 Firebase 관리자 권한이 설정되지 않아 계정을 병합할 수 없습니다.',
      });
    }

    const [decodedA, decodedB] = await Promise.all([
      adminAuth.verifyIdToken(currentIdToken),
      adminAuth.verifyIdToken(linkingIdToken),
    ]);

    const [resolvedUidA, resolvedUidB] = await Promise.all([
      resolveMasterUid(adminDb, decodedA.uid),
      resolveMasterUid(adminDb, decodedB.uid),
    ]);

    if (resolvedUidA === resolvedUidB) {
      const masterUser = await adminAuth.getUser(resolvedUidA);
      const accountSnap = await adminDb.collection('user_accounts').doc(resolvedUidA).get();
      const accountData = (accountSnap.exists ? accountSnap.data() : {}) as Partial<UnifiedAccountRecord>;
      const provider = detectProviderFromAuthUser(masterUser);

      return res.status(200).json({
        success: true,
        alreadyLinked: true,
        masterUid: resolvedUidA,
        migratedCount: 0,
        deduplicatedCount: 0,
        profile: {
          uid: resolvedUidA,
          nickname: masterUser.displayName || accountData.kakaoNickname || '클립사용자',
          email: resolveDisplayEmail(masterUser, accountData),
          avatarUrl: masterUser.photoURL || accountData.kakaoAvatar || undefined,
          provider,
          linkedProviders: accountData.linkedProviders || [provider],
          linkedEmails: extractLinkedEmails(accountData),
        },
        message: '이미 하나로 연결·통합된 계정입니다.',
      });
    }

    // Kakao-first Master selection rule
    let masterUid = resolvedUidA;
    let secondaryUid = resolvedUidB;
    let masterDecoded: DecodedIdToken = decodedA;
    let secondaryDecoded: DecodedIdToken = decodedB;

    if (!resolvedUidA.startsWith('kakao_') && resolvedUidB.startsWith('kakao_')) {
      masterUid = resolvedUidB;
      secondaryUid = resolvedUidA;
      masterDecoded = decodedB;
      secondaryDecoded = decodedA;
    }

    const [masterUser, secondaryUser] = await Promise.all([
      adminAuth.getUser(masterUid),
      adminAuth.getUser(secondaryUid),
    ]);

    const masterProvider = detectProviderFromAuthUser(masterUser, masterDecoded);
    const secondaryProvider = detectProviderFromAuthUser(secondaryUser, secondaryDecoded);

    const { migratedCount, deduplicatedCount, userAccount } = await linkAccountPair({
      adminAuth,
      adminDb,
      masterUid,
      masterProvider,
      masterEmail: masterUser.email || masterDecoded.email || '',
      masterNickname: masterUser.displayName || undefined,
      masterAvatar: masterUser.photoURL || undefined,
      secondaryUid,
      secondaryProvider,
      secondaryEmail: secondaryUser.email || secondaryDecoded.email || '',
    });

    const customToken = await adminAuth.createCustomToken(masterUid, {
      provider: userAccount.primaryProvider,
      linkedProviders: userAccount.linkedProviders,
    });

    return res.status(200).json({
      success: true,
      alreadyLinked: false,
      masterUid,
      switchedFromSecondary: decodedA.uid !== masterUid,
      customToken,
      migratedCount,
      deduplicatedCount,
      profile: {
        uid: masterUid,
        nickname: masterUser.displayName || userAccount.kakaoNickname || secondaryUser.displayName || '클립사용자',
        email: resolveDisplayEmail(masterUser, userAccount),
        avatarUrl: masterUser.photoURL || userAccount.kakaoAvatar || secondaryUser.photoURL || undefined,
        provider: userAccount.primaryProvider,
        linkedProviders: userAccount.linkedProviders,
        linkedEmails: extractLinkedEmails(userAccount),
      },
      message:
        migratedCount > 0
          ? `계정이 하나로 통합되었고 기존 북마크 ${migratedCount}개가 안전하게 병합되었습니다.`
          : '계정이 카카오 대표 계정으로 안전하게 통합되었습니다.',
    });
  } catch (err: any) {
    console.error('[MergeAccounts Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || '계정 연결 및 병합 중 오류가 발생했습니다.',
    });
  }
}
