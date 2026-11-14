import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LinkInputArea } from './components/LinkInputArea';
import { CategoryTabs } from './components/CategoryTabs';
import { VideoCardList } from './components/VideoCardList';
import { CategoryChangeModal } from './components/CategoryChangeModal';
import { Toast } from './components/Toast';
import { AuthFlowModal } from './components/auth/AuthFlowModal';
import { BottomNavBar } from './components/navigation/BottomNavBar';
import { RecentTimelineView } from './components/recent/RecentTimelineView';
import { SettingsView } from './components/settings/SettingsView';
import { MyInfoSubView } from './components/settings/MyInfoSubView';
import { ChangePasswordSubView } from './components/settings/ChangePasswordSubView';
import { ThemeColorSubView } from './components/settings/ThemeColorSubView';
import { DisplayModeSubView } from './components/settings/DisplayModeSubView';
import { TermsDetailSubView } from './components/settings/TermsDetailSubView';
import { PrivacyDetailSubView } from './components/settings/PrivacyDetailSubView';
import { VersionInfoSubView } from './components/settings/VersionInfoSubView';
import { ContactSubView } from './components/settings/ContactSubView';
import { OpenSourceSubView } from './components/settings/OpenSourceSubView';
import { TrashView } from './components/trash/TrashView';
import { AdminEmailTestPanel } from './components/dev/AdminEmailTestPanel';
import { PWAInstallModal } from './components/pwa/PWAInstallModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { BookmarkSearchBar, PlatformFilter, SortOrderType } from './components/BookmarkSearchBar';
import {
  VideoBookmark,
  TrashItem,
  UserProfile,
  MainTabType,
  SettingsSubPage,
  DisplayMode,
  ThemeColorOption,
  VideoLinkStatus,
} from './types';
import { STANDARD_CATEGORIES } from './mockData';
import {
  saveVideoToFirestore,
  updateVideoInFirestore,
  moveVideoToTrashInFirestore,
  restoreVideoFromTrashInFirestore,
  deleteVideoFromFirestore,
  deleteAllUserVideosFromFirestore,
  subscribeToVideos,
} from './services/videoFirestoreService';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithCustomToken,
  getSecondaryAuth,
  signOut,
  onAuthStateChanged,
  updateProfile,
  testFirestoreConnection,
} from './lib/firebase';
import { classifyContentClientSide } from './services/classificationClient';
import { initAnalytics, trackEvent, trackTabView } from './lib/analytics';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTabType>('storage');
  const [settingsSubPage, setSettingsSubPage] = useState<SettingsSubPage>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackTabView(activeTab);
  }, [activeTab]);

  // Theme & Display Mode State
  const [themeColor, setThemeColor] = useState<ThemeColorOption>(() => {
    try {
      const saved = localStorage.getItem('clipsort_theme_color');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 'kinetic_indigo',
      name: '시그니처 인디고',
      sub: 'Kinetic Indigo',
      hex: '#5046e5',
    };
  });

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem('clipsort_display_mode');
      if (saved) return saved as DisplayMode;
    } catch {
      // ignore
    }
    return 'system';
  });

  // Apply dark mode class to HTML root if dark mode
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_display_mode', displayMode);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (displayMode === 'dark') {
      root.classList.add('dark');
    } else if (displayMode === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [displayMode]);

  // Save themeColor to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_theme_color', JSON.stringify(themeColor));
    } catch {
      // ignore
    }
  }, [themeColor]);

  // Active Category filter
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('latest');

  // Custom User Categories (Added by user via modal)
  const [userCategories, setUserCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('clipsort_user_categories');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Deleted Categories history (used so AI never re-classifies into these)
  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('clipsort_deleted_categories');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Save userCategories
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_user_categories', JSON.stringify(userCategories));
    } catch {
      // ignore
    }
  }, [userCategories]);

  // Save deletedCategories
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_deleted_categories', JSON.stringify(deletedCategories));
    } catch {
      // ignore
    }
  }, [deletedCategories]);

  // Bookmarks state (persistent in localStorage & synced with Firestore)
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>(() => {
    try {
      const savedUser = localStorage.getItem('clipsort_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      // If user is not logged in or in guest mode, do not show any saved videos
      if (!parsedUser || !parsedUser.isLoggedIn) {
        return [];
      }
      const saved = localStorage.getItem('clipsort_bookmarks');
      if (saved) {
        const parsed: VideoBookmark[] = JSON.parse(saved);
        // Normalize specific subcategories into standard broad categories
        return parsed.map((b) => {
          let category = b.category;
          if (category === '요리' || category === '맛집') {
            category = '음식';
          } else if (category === '야구' || category === '스포츠') {
            category = '운동';
          }
          return { ...b, category };
        });
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Trash state
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
      const savedUser = localStorage.getItem('clipsort_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      if (!parsedUser || !parsedUser.isLoggedIn) {
        return [];
      }
      const saved = localStorage.getItem('clipsort_trash');
      if (saved) {
        const parsed: TrashItem[] = JSON.parse(saved);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return parsed.filter((item) => now - item.deletedAt < thirtyDaysMs);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // User Profile state (Defaults to Guest mode for new visitors/mobile)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('clipsort_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      isLoggedIn: false,
      nickname: '게스트',
      email: '',
      provider: 'email',
    };
  });

  // Loading state for link saving & AI classification
  const [isLoading, setIsLoading] = useState(false);
  const saveAbortControllerRef = useRef<AbortController | null>(null);

  // Stop / Cancel in-flight AI analysis & link saving
  const handleCancelSave = () => {
    if (saveAbortControllerRef.current) {
      saveAbortControllerRef.current.abort();
      saveAbortControllerRef.current = null;
    }
    setIsLoading(false);
    showToast('AI 분석 및 저장이 취소되었습니다.');
  };

  // Highlight recently added item
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videoToChange, setVideoToChange] = useState<VideoBookmark | null>(null);
  const [videoToDeleteConfirm, setVideoToDeleteConfirm] = useState<VideoBookmark | null>(null);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);

  // Trash notification badge
  const [hasUnreadTrash, setHasUnreadTrash] = useState(false);

  // Clear badge when switching to trash tab
  useEffect(() => {
    if (activeTab === 'trash') {
      setHasUnreadTrash(false);
    }
  }, [activeTab]);

  // Check URL parameter or storage flag for PWA install (when opened from iframe to top-level tab)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isParamInstall = params.get('pwa') === 'install';
      const isHashInstall = window.location.hash.includes('pwa-install');
      const isStorageInstall = localStorage.getItem('clipsort_open_pwa_install') === 'true';

      if (isParamInstall || isHashInstall || isStorageInstall) {
        localStorage.removeItem('clipsort_open_pwa_install');
        setIsPWAInstallOpen(true);

        // Clean up URL parameters cleanly without triggering a reload
        if (isParamInstall || isHashInstall) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastCategoryHint, setToastCategoryHint] = useState<string | undefined>(undefined);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | undefined>(undefined);

  const showToast = useCallback(
    (msg: string, categoryHint?: string, onUndo?: () => void) => {
      setToastMessage(msg);
      setToastCategoryHint(categoryHint);
      setToastUndoAction(onUndo ? () => onUndo : undefined);
    },
    []
  );

  const resolvingUidRef = useRef<string | null>(null);

  // Listen to Firebase Auth state changes for persistent login across page refreshes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const provider =
          fbUser.providerData[0]?.providerId === 'google.com'
            ? 'google'
            : fbUser.uid.startsWith('kakao_')
            ? 'kakao'
            : 'email';

        let savedAvatar: string | undefined;
        try {
          savedAvatar = localStorage.getItem(`clipsort_avatar_${fbUser.uid}`) || undefined;
        } catch {
          // ignore
        }

        setUser((prev) => ({
          isLoggedIn: true,
          uid: fbUser.uid,
          nickname: fbUser.displayName || fbUser.email?.split('@')[0] || '클립사용자',
          email: fbUser.email || (prev.uid === fbUser.uid ? prev.email : '') || '',
          avatarUrl: savedAvatar || fbUser.photoURL || undefined,
          provider,
          linkedProviders: prev.uid === fbUser.uid ? prev.linkedProviders : undefined,
          linkedEmails: prev.uid === fbUser.uid ? prev.linkedEmails : undefined,
        }));

        // Resolve unified Kakao-first session & linked provider metadata from server
        if (resolvingUidRef.current !== fbUser.uid) {
          resolvingUidRef.current = fbUser.uid;
          try {
            const idToken = await fbUser.getIdToken();
            const res = await fetch('/api/auth/resolve-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ idToken }),
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
              if (data.redirected && data.switchCustomToken) {
                resolvingUidRef.current = null;
                await signInWithCustomToken(auth, data.switchCustomToken);
                if (data.autoMerged) {
                  showToast('동일 이메일 계정이 카카오 대표 계정으로 자동 통합되었습니다.');
                }
                return;
              }
              if (data.profile && auth.currentUser?.uid === fbUser.uid) {
                const p = data.profile;
                setUser((prev) => ({
                  ...prev,
                  isLoggedIn: true,
                  uid: fbUser.uid,
                  nickname: p.nickname || prev.nickname,
                  email: p.email || prev.email,
                  avatarUrl: savedAvatar || p.avatarUrl || prev.avatarUrl,
                  provider: p.provider || prev.provider,
                  linkedProviders: p.linkedProviders || prev.linkedProviders,
                  linkedEmails: p.linkedEmails || prev.linkedEmails,
                }));
              }
            }
          } catch (resolveErr) {
            console.warn('Session resolution check warning:', resolveErr);
          } finally {
            if (resolvingUidRef.current === fbUser.uid) {
              resolvingUidRef.current = null;
            }
          }
        }
      } else {
        resolvingUidRef.current = null;
        setUser({
          isLoggedIn: false,
          nickname: '게스트',
          email: '',
          provider: 'email',
        });
      }
    });

    return () => unsubscribeAuth();
  }, [showToast]);

  // Validate Firestore connection on boot and sync bookmarks when logged in
  useEffect(() => {
    testFirestoreConnection().catch((err) => console.warn('Firestore test connection:', err));

    // When logged out or guest, clear bookmarks and trash, and do not listen to Firestore
    if (!user.isLoggedIn || !user.uid) {
      setBookmarks([]);
      setTrashItems([]);
      return;
    }

    const currentUserId = user.uid;

    // Subscribe to Firestore for real-time video sync when logged in (partitioned by currentUserId)
    const unsubscribe = subscribeToVideos(currentUserId, (firestoreVideos) => {
      if (firestoreVideos && firestoreVideos.length > 0) {
        const normalized = firestoreVideos.map((v) => {
          let category = v.category;
          if (category === '요리' || category === '맛집') {
            category = '음식';
          } else if (category === '야구' || category === '스포츠') {
            category = '운동';
          }
          return { ...v, category };
        });

        const activeVideos = normalized.filter((v) => !v.inTrash && v.status !== 'trash_purged');
        const trashVideos: TrashItem[] = normalized
          .filter((v) => v.inTrash && v.status !== 'trash_purged')
          .map((v) => ({
            id: `trash_${v.id}`,
            video: v,
            deletedAt: v.trashedAt || Date.now(),
          }));

        setBookmarks(activeVideos);
        setTrashItems(trashVideos);
      } else {
        // If Firestore is empty for this user, check local saved bookmarks to preserve prior data
        try {
          const saved = localStorage.getItem('clipsort_bookmarks');
          if (saved) {
            const localVideos: VideoBookmark[] = JSON.parse(saved);
            if (localVideos.length > 0) {
              setBookmarks(localVideos);
              // Migrate local bookmarks to this user's UID in Firestore
              localVideos.forEach((v) => {
                saveVideoToFirestore({ ...v, userId: currentUserId }, currentUserId).catch(() => {});
              });
            }
          }
        } catch {
          // ignore
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.isLoggedIn, user.uid]);

  // Save bookmarks to localStorage only when user is logged in
  useEffect(() => {
    if (!user.isLoggedIn) return;
    try {
      localStorage.setItem('clipsort_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks, user.isLoggedIn]);


  // Save trash to localStorage & purge expired items (> 30 days) only when logged in
  useEffect(() => {
    if (!user.isLoggedIn) return;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const validItems = trashItems.filter((item) => now - item.deletedAt < thirtyDaysMs);

    if (validItems.length !== trashItems.length) {
      setTrashItems(validItems);
    }

    try {
      localStorage.setItem('clipsort_trash', JSON.stringify(validItems));
    } catch {
      // ignore
    }
  }, [trashItems, user.isLoggedIn]);

  // Save user to localStorage
  useEffect(() => {
    try {
      if (user.isLoggedIn) {
        localStorage.setItem('clipsort_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('clipsort_user');
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Explicit Logout Handler using Firebase signOut
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
    setUser({
      isLoggedIn: false,
      nickname: '게스트',
      email: '',
      provider: 'email',
    });
    setBookmarks([]);
    setTrashItems([]);
    try {
      localStorage.removeItem('clipsort_user');
      localStorage.removeItem('clipsort_bookmarks');
      localStorage.removeItem('clipsort_trash');
    } catch {
      // ignore
    }
    showToast('로그아웃 되었습니다.');
  }, [showToast]);

  // 회원 탈퇴 및 북마크 데이터 영구 삭제 핸들러
  const handleDeleteAccount = useCallback(async () => {
    const currentUid = user.uid;
    const currentUser = auth.currentUser;

    try {
      // 1. Firebase Auth ID 토큰 획득 (서버 검증용)
      const idToken = currentUser ? await currentUser.getIdToken(true).catch(() => null) : null;

      // 2. 서버 측 삭제 API 호출 (/api/delete-account)
      let serverHandled = false;
      if (idToken) {
        try {
          const res = await fetch('/api/delete-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ idToken }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.success && !data?.clientFallback) {
            serverHandled = true;
          }
        } catch (serverErr) {
          console.warn('Server delete account warning, proceeding with client cleanup:', serverErr);
        }
      }

      // 3. Firestore 영상 북마크 영구 일괄 삭제 (클라이언트 측 백업 보증)
      if (currentUid) {
        await deleteAllUserVideosFromFirestore(currentUid).catch((e) =>
          console.warn('Client deleteAllUserVideos warning:', e)
        );
      }

      // 4. Firebase Auth 계정 삭제 (클라이언트 측)
      if (!serverHandled && currentUser) {
        try {
          await currentUser.delete();
        } catch (authDeleteErr: any) {
          console.warn('Client auth user.delete error:', authDeleteErr);
        }
      }

      // 5. Firebase 로그아웃 및 로컬 스토리지 초기화
      try {
        await signOut(auth);
      } catch {
        // ignore
      }

      setUser({
        isLoggedIn: false,
        nickname: '게스트',
        email: '',
        provider: 'email',
      });
      setBookmarks([]);
      setTrashItems([]);

      try {
        localStorage.removeItem('clipsort_user');
        localStorage.removeItem('clipsort_bookmarks');
        localStorage.removeItem('clipsort_trash');
        localStorage.removeItem('clipsort_saved_id');
        localStorage.removeItem('clipsort_auto_login');
        localStorage.removeItem('clipsort_user_categories');
      } catch {
        // ignore
      }

      setSettingsSubPage(null);
      setActiveTab('storage');
      showToast('회원 탈퇴 및 모든 북마크 데이터가 안전하게 삭제되었습니다.');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      showToast('회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
      throw err;
    }
  }, [user.uid, showToast]);

  // Link & merge a Google account into the active unified account (Kakao remains Primary UID)
  const handleLinkGoogleAccount = useCallback(async () => {
    if (!auth.currentUser) {
      showToast('로그인 후 계정을 연결할 수 있습니다.');
      return;
    }

    const secondaryAuth = getSecondaryAuth();
    try {
      const currentIdToken = await auth.currentUser.getIdToken(true);
      const googleCred = await signInWithPopup(secondaryAuth, googleProvider);
      const linkingIdToken = await googleCred.user.getIdToken(true);
      await signOut(secondaryAuth).catch(() => {});

      const res = await fetch('/api/auth/merge-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentIdToken}`,
        },
        body: JSON.stringify({ currentIdToken, linkingIdToken }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        showToast(data?.error || 'Google 계정 연결에 실패했습니다.');
        return;
      }

      if (data.switchedFromSecondary && data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      }

      if (data.profile) {
        setUser((prev) => ({
          ...prev,
          isLoggedIn: true,
          uid: data.profile.uid || prev.uid,
          nickname: data.profile.nickname || prev.nickname,
          email: data.profile.email || prev.email,
          avatarUrl: prev.avatarUrl || data.profile.avatarUrl,
          provider: data.profile.provider || prev.provider,
          linkedProviders: data.profile.linkedProviders || prev.linkedProviders,
          linkedEmails: data.profile.linkedEmails || prev.linkedEmails,
        }));
      }

      showToast(data.message || 'Google 계정이 성공적으로 연결·병합되었습니다.');
    } catch (err: any) {
      await signOut(secondaryAuth).catch(() => {});
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        showToast('팝업 차단이 활성화되어 있습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.');
        return;
      }
      console.error('Google account link error:', err);
      showToast(err?.message || 'Google 계정 연결 중 오류가 발생했습니다.');
    }
  }, [showToast]);

  // Link & merge a Kakao account (always promotes Kakao UID to Primary/Master account)
  const handleLinkKakaoAccount = useCallback(async () => {
    if (!auth.currentUser) {
      showToast('로그인 후 계정을 연결할 수 있습니다.');
      return;
    }

    const popup = window.open(
      'about:blank',
      'kakao_link_popup',
      'width=500,height=680,scrollbars=yes,resizable=yes'
    );
    if (!popup) {
      showToast('팝업 차단이 활성화되어 있습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도해 주세요.');
      return;
    }

    const secondaryAuth = getSecondaryAuth();
    try {
      const currentIdToken = await auth.currentUser.getIdToken(true);
      const urlRes = await fetch('/api/auth/kakao/url');
      const urlData = await urlRes.json().catch(() => null);
      if (!urlRes.ok || !urlData?.success || !urlData?.url) {
        popup.close();
        showToast(urlData?.error || '카카오 로그인 설정을 불러오지 못했습니다.');
        return;
      }

      popup.location.href = urlData.url;

      const oauthResult = await new Promise<{ customToken: string }>((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
          window.removeEventListener('message', onMessage);
          clearInterval(closedTimer);
        };

        const onMessage = (event: MessageEvent) => {
          const origin = event.origin || '';
          const isTrusted =
            origin === window.location.origin ||
            origin.endsWith('.run.app') ||
            origin.includes('localhost');
          if (!isTrusted) return;

          const payload = event.data;
          if (!payload || typeof payload !== 'object') return;

          if (payload.type === 'KAKAO_OAUTH_ERROR') {
            settled = true;
            cleanup();
            reject(new Error(payload.error || '카카오 인증에 실패했습니다.'));
          } else if (payload.type === 'KAKAO_OAUTH_SUCCESS' && payload.customToken) {
            settled = true;
            cleanup();
            resolve({ customToken: payload.customToken });
          }
        };

        const closedTimer = setInterval(() => {
          if (popup.closed && !settled) {
            settled = true;
            cleanup();
            reject(new Error('LINK_CANCELLED'));
          }
        }, 500);

        window.addEventListener('message', onMessage);
      });

      const kakaoCred = await signInWithCustomToken(secondaryAuth, oauthResult.customToken);
      const linkingIdToken = await kakaoCred.user.getIdToken(true);
      await signOut(secondaryAuth).catch(() => {});

      const mergeRes = await fetch('/api/auth/merge-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentIdToken}`,
        },
        body: JSON.stringify({ currentIdToken, linkingIdToken }),
      });
      const mergeData = await mergeRes.json().catch(() => null);
      if (!mergeRes.ok || !mergeData?.success) {
        showToast(mergeData?.error || '카카오 계정 연결 및 병합에 실패했습니다.');
        return;
      }

      if (mergeData.customToken) {
        await signInWithCustomToken(auth, mergeData.customToken);
      }

      if (mergeData.profile) {
        setUser((prev) => ({
          ...prev,
          isLoggedIn: true,
          uid: mergeData.profile.uid || prev.uid,
          nickname: mergeData.profile.nickname || prev.nickname,
          email: mergeData.profile.email || prev.email,
          avatarUrl: prev.avatarUrl || mergeData.profile.avatarUrl,
          provider: 'kakao',
          linkedProviders: mergeData.profile.linkedProviders || ['kakao', prev.provider || 'google'],
          linkedEmails: mergeData.profile.linkedEmails || prev.linkedEmails,
        }));
      }

      showToast(mergeData.message || '카카오 대표 계정으로 통합·병합되었습니다.');
    } catch (err: any) {
      await signOut(secondaryAuth).catch(() => {});
      if (!popup.closed) popup.close();
      if (err?.message === 'LINK_CANCELLED') {
        return;
      }
      console.error('Kakao account link error:', err);
      showToast(err?.message || '카카오 계정 연결 중 오류가 발생했습니다.');
    }
  }, [showToast]);


  // 1. '전체' is always first
  // 2. STANDARD_CATEGORIES (minus deleted categories)
  // 3. userCategories (added by user)
  // 4. Any categories present on existing bookmarks (minus deleted)
  const categories = useMemo(() => {
    const deletedSet = new Set(deletedCategories);
    const set = new Set<string>();
    set.add('전체');

    STANDARD_CATEGORIES.forEach((c) => {
      if (c !== '전체' && !deletedSet.has(c)) {
        set.add(c);
      }
    });

    userCategories.forEach((c) => {
      let norm = c;
      if (norm === '요리' || norm === '맛집') norm = '음식';
      if (norm === '야구' || norm === '스포츠') norm = '운동';
      if (norm && !deletedSet.has(norm)) {
        set.add(norm);
      }
    });

    if (user.isLoggedIn) {
      bookmarks.forEach((b) => {
        let norm = b.category ? b.category.trim() : '';
        if (norm === '요리' || norm === '맛집') norm = '음식';
        if (norm === '야구' || norm === '스포츠') norm = '운동';
        if (norm && !deletedSet.has(norm)) {
          set.add(norm);
        }
      });
    }

    const list = Array.from(set);
    // Ensure '미분류' is placed at the end of the category tabs if present
    if (list.includes('미분류')) {
      return [...list.filter((c) => c !== '미분류'), '미분류'];
    }
    return list;
  }, [bookmarks, userCategories, deletedCategories, user.isLoggedIn]);

  // Self-heal Instagram bookmarks that missed thumbnail or were misclassified into '게임' due to earlier regex bug
  const healedVideosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user.isLoggedIn || bookmarks.length === 0) return;

    const needsFix = bookmarks.filter(
      (b) =>
        b.url &&
        b.url.includes('instagram.com') &&
        !healedVideosRef.current.has(b.id) &&
        (!b.thumbnail || b.category === '게임' || b.title.startsWith('인스타그램 릴스 ('))
    );

    if (needsFix.length === 0) return;

    needsFix.forEach(async (b) => {
      healedVideosRef.current.add(b.id);
      try {
        const res = await fetch('/api/extract-and-classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: b.url,
            excludedCategories: deletedCategories,
            existingCategories: categories,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const updates: Partial<VideoBookmark> = {};
          if (data.thumbnail && data.thumbnail !== b.thumbnail) {
            updates.thumbnail = data.thumbnail;
          }
          if (data.title && data.title !== b.title && b.title.startsWith('인스타그램 릴스 (')) {
            updates.title = data.title;
          }
          if (data.category && (b.category === '게임' || b.category === '미분류') && data.category !== '게임') {
            updates.category = data.category;
          }

          if (Object.keys(updates).length > 0) {
            setBookmarks((prev) =>
              prev.map((item) => (item.id === b.id ? { ...item, ...updates } : item))
            );
            updateVideoInFirestore(b.id, updates).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    });
  }, [user.isLoggedIn, bookmarks, categories, deletedCategories]);

  // Filtered and sorted bookmarks based on activeCategory, selectedPlatform, searchQuery, and sortOrder
  const filteredBookmarks = useMemo(() => {
    if (!user.isLoggedIn) {
      return [];
    }
    let list = [...bookmarks];

    // 1. Category filter
    if (activeCategory !== '전체') {
      list = list.filter((b) => b.category === activeCategory);
    }

    // 2. Platform filter
    if (selectedPlatform !== 'all') {
      list = list.filter((b) => {
        const source = (b.source || '').toLowerCase();
        const urlLower = (b.url || '').toLowerCase();
        if (selectedPlatform === 'youtube') {
          return source === 'youtube' || urlLower.includes('youtube.com') || urlLower.includes('youtu.be');
        }
        if (selectedPlatform === 'instagram') {
          return source === 'instagram' || urlLower.includes('instagram.com');
        }
        if (selectedPlatform === 'tiktok') {
          return source === 'tiktok' || urlLower.includes('tiktok.com');
        }
        return true;
      });
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.category || '').toLowerCase().includes(q) ||
          (b.url || '').toLowerCase().includes(q)
      );
    }

    // 4. Sort order
    if (sortOrder === 'oldest') {
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (sortOrder === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // 'latest' default
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return list;
  }, [bookmarks, activeCategory, selectedPlatform, searchQuery, sortOrder, user.isLoggedIn]);

  // Add new category directly from CategoryChangeModal or anywhere
  const handleAddNewCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || trimmed === '전체') return;

    // Un-delete if previously deleted
    setDeletedCategories((prev) => prev.filter((c) => c !== trimmed));

    setUserCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });

    showToast(`'${trimmed}' 카테고리가 상단에 추가되었습니다.`);
  };

  // Rename a category
  const handleRenameCategory = async (oldCategory: string, newCategory: string) => {
    const trimmedNew = newCategory.trim();
    if (!trimmedNew || oldCategory === trimmedNew || oldCategory === '전체') return;

    // Update userCategories
    setUserCategories((prev) => {
      const filtered = prev.filter((c) => c !== oldCategory);
      return filtered.includes(trimmedNew) ? filtered : [...filtered, trimmedNew];
    });

    // Update activeCategory if it was this one
    if (activeCategory === oldCategory) {
      setActiveCategory(trimmedNew);
    }

    // Update all bookmarks that had oldCategory
    const affectedVideos = bookmarks.filter((b) => b.category === oldCategory);
    setBookmarks((prev) =>
      prev.map((b) => (b.category === oldCategory ? { ...b, category: trimmedNew } : b))
    );

    // Sync to Firestore
    for (const video of affectedVideos) {
      updateVideoInFirestore(video.id, { category: trimmedNew }).catch((err) =>
        console.warn('Firestore category rename update failed:', err)
      );
    }

    showToast(`'${oldCategory}' 카테고리가 '${trimmedNew}'(으)로 변경되었습니다.`);
  };

  // Delete a category and trigger AI re-classification excluding deleted categories
  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (categoryToDelete === '전체') return;

    // 1. Add to deleted categories list
    const updatedDeleted = Array.from(new Set([...deletedCategories, categoryToDelete]));
    setDeletedCategories(updatedDeleted);

    // 2. Remove from userCategories
    setUserCategories((prev) => prev.filter((c) => c !== categoryToDelete));

    // 3. Reset active category if currently viewing the deleted one
    if (activeCategory === categoryToDelete) {
      setActiveCategory('전체');
    }

    showToast(`'${categoryToDelete}' 카테고리가 삭제되었습니다. 관련 영상을 AI가 재분류합니다.`);

    // 4. Find videos that belonged to this deleted category
    const videosToReclassify = bookmarks.filter((b) => b.category === categoryToDelete);
    if (videosToReclassify.length === 0) return;

    // Reclassify each video using server-side AI, ensuring categoryToDelete is strictly excluded
    for (const vid of videosToReclassify) {
      try {
        let newCat = '';
        try {
          const response = await fetch('/api/classify-only', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: vid.title,
              url: vid.url,
              thumbnail: vid.thumbnail,
              excludedCategories: updatedDeleted,
              existingCategories: categories.filter((c) => c !== categoryToDelete),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.category && !updatedDeleted.includes(data.category)) {
              newCat = data.category;
            }
          }
        } catch {
          // ignore network error
        }

        if (!newCat || newCat === '라이프스타일' || updatedDeleted.includes(newCat)) {
          const fallbackCat = classifyContentClientSide(
            vid.title,
            vid.url,
            vid.thumbnail,
            updatedDeleted,
            categories.filter((c) => c !== categoryToDelete)
          );
          if (fallbackCat && !updatedDeleted.includes(fallbackCat)) {
            newCat = fallbackCat;
          } else {
            newCat = '미분류';
          }
        }

        // If new category created by AI, add to userCategories
        if (newCat && newCat !== '전체' && !updatedDeleted.includes(newCat)) {
          setUserCategories((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
        }

        // Update local state
        setBookmarks((prev) =>
          prev.map((b) => (b.id === vid.id ? { ...b, category: newCat } : b))
        );

        // Update Firestore
        updateVideoInFirestore(vid.id, { category: newCat }).catch((err) =>
          console.warn('Firestore update after reclassify failed:', err)
        );
      } catch (err) {
        console.error('Error reclassifying video:', err);
      }
    }
  };

  // Save a new link (extract metadata + AI category classification + Firebase save)
  const handleSaveLink = async (url: string, defaultTitle?: string) => {
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('영상 저장은 로그인 후 이용하실 수 있습니다.');
      return;
    }

    const abortController = new AbortController();
    saveAbortControllerRef.current = abortController;
    setIsLoading(true);

    try {
      let title = defaultTitle || '';
      let thumbnail = '';
      let category = '';
      let source: VideoBookmark['source'] = 'web';

      // Call Express server-side Gemini API with AbortSignal
      try {
        const response = await fetch('/api/extract-and-classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            title,
            thumbnail,
            excludedCategories: deletedCategories,
            existingCategories: categories,
          }),
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          const abortErr = new Error('USER_CANCELLED');
          abortErr.name = 'AbortError';
          throw abortErr;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.title) title = data.title;
          if (data.thumbnail) thumbnail = data.thumbnail;
          if (data.category) category = data.category;
          if (data.source) source = data.source;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || abortController.signal.aborted) {
          const abortErr = new Error('USER_CANCELLED');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        console.warn('Backend extract error, using client extraction fallback:', err);
      }

      if (abortController.signal.aborted) {
        const abortErr = new Error('USER_CANCELLED');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      // Check YouTube thumbnail & title via client oEmbed if title is generic or missing
      const ytMatch = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
      );
      if (ytMatch && ytMatch[1]) {
        const ytId = ytMatch[1];
        source = 'youtube';
        if (!thumbnail) {
          thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }

        // If title is missing or a generic fallback placeholder, fetch client-side oEmbed
        if (!title || title.startsWith('유튜브 영상') || title === '유튜브 영상 콘텐츠') {
          try {
            const oembedRes = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
              { signal: AbortSignal.timeout(3000) }
            );
            if (oembedRes.ok) {
              const oeData = await oembedRes.json();
              if (oeData.title) {
                title = oeData.title;
              }
            }
          } catch {
            // ignore
          }
        }
      }

      // Source detection
      if (url.includes('instagram.com')) {
        source = 'instagram';
      } else if (url.includes('tiktok.com')) {
        source = 'tiktok';
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        source = 'youtube';
      }

      // Check for generic or missing Instagram titles (e.g. login wall title "Instagram")
      const isGenericIg =
        !title ||
        title.trim().toLowerCase() === 'instagram' ||
        title.trim().toLowerCase().includes('login • instagram') ||
        title.trim().toLowerCase().includes('instagram - login');

      if (source === 'instagram' && isGenericIg) {
        const igMatch = url.match(/instagram\.com\/(?:reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/i);
        const shortcode = igMatch ? igMatch[1] : null;
        title = shortcode ? `인스타그램 릴스 (${shortcode})` : '인스타그램 릴스 비디오';
      }

      // Client title fallback if empty
      if (!title) {
        if (source === 'youtube') {
          title = '유튜브 영상 콘텐츠';
        } else if (source === 'instagram') {
          title = '인스타그램 릴스 비디오';
        } else if (source === 'tiktok') {
          title = '틱톡 인기 숏폼 영상';
        } else {
          title = '웹 저장 비디오';
        }
      }

      // If category is still empty, default '기타', or '미분류', run smart semantic classifier
      if (!category || category === '기타' || category === '미분류') {
        const smartCat = classifyContentClientSide(title, url, thumbnail, deletedCategories, categories);
        if (smartCat && smartCat !== '기타' && smartCat !== '미분류') {
          category = smartCat;
        } else if (!deletedCategories.includes('예능/유머')) {
          category = '예능/유머';
        } else if (!deletedCategories.includes('라이프스타일')) {
          category = '라이프스타일';
        } else {
          const fallback = categories.find((c) => c && c !== '전체' && c !== '미분류' && !deletedCategories.includes(c));
          category = fallback || '예능/유머';
        }
      }

      if (!category || category === '기타' || category === '미분류') {
        category = !deletedCategories.includes('예능/유머') ? '예능/유머' : '라이프스타일';
      }

      // If the AI classified this video into a completely new category, register it to userCategories so it appears in the tabs
      if (category && category !== '전체' && category !== '미분류' && !deletedCategories.includes(category)) {
        setUserCategories((prev) => {
          if (!prev.includes(category)) {
            return [...prev, category];
          }
          return prev;
        });
      }

      const newId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newBookmark: VideoBookmark = {
        id: newId,
        title,
        thumbnail: thumbnail || '',
        category,
        url,
        createdAt: Date.now(),
        source,
        status: 'active' as VideoLinkStatus,
        inTrash: false,
        userId: user.uid,
      };

      // Save to Firestore Database partitioned by user.uid
      saveVideoToFirestore(newBookmark, user.uid).catch((err) => {
        console.warn('Firestore database save fallback:', err);
      });

      setBookmarks((prev) => [newBookmark, ...prev]);
      setRecentAddedId(newId);
      trackEvent('save_bookmark', {
        platform: source || 'web',
        category,
      });

      // Level 3 Floating Toast
      const toastMsg =
        category === '미분류'
          ? '영상이 저장되었습니다 (분류 작업 필요)'
          : '저장 및 AI 분류가 완료되었습니다';
      showToast(toastMsg, category, () => {
        handleDeleteVideo(newBookmark);
      });
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortController.signal.aborted) {
        console.log('Link analysis and saving was cancelled by the user.');
        throw err;
      }
      console.error('Failed to save link:', err);
      showToast('링크 저장 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
      saveAbortControllerRef.current = null;
    }
  };

  // Category and Title Change Handler
  const handleConfirmCategoryChange = (videoId: string, newCategory: string, newTitle?: string) => {
    const prevBookmark = bookmarks.find((b) => b.id === videoId);
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id !== videoId) return b;
        return {
          ...b,
          category: newCategory,
          ...(newTitle && newTitle.trim().length > 0 ? { title: newTitle.trim() } : {}),
        };
      })
    );

    // Save to Firestore
    const updates: Partial<VideoBookmark> = { category: newCategory };
    if (newTitle && newTitle.trim().length > 0) updates.title = newTitle.trim();

    updateVideoInFirestore(videoId, updates).catch((err) => {
      console.warn('Firestore category update error:', err);
    });

    showToast(`'${newCategory}'(으)로 수정되었습니다`, undefined, () => {
      if (prevBookmark) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === videoId ? prevBookmark : b))
        );
        updateVideoInFirestore(videoId, {
          category: prevBookmark.category,
          title: prevBookmark.title,
        }).catch((err) => console.warn('Firestore undo update error:', err));
      }
    });
  };

  // Move video to trash (Firebase synced)
  const handleDeleteVideo = (video: VideoBookmark) => {
    // Remove from bookmarks
    setBookmarks((prev) => prev.filter((b) => b.id !== video.id));

    // Add to trash
    const now = Date.now();
    const newTrashItem: TrashItem = {
      id: `trash_${video.id}_${now}`,
      video: { ...video, inTrash: true, trashedAt: now },
      deletedAt: now,
    };
    setTrashItems((prev) => [newTrashItem, ...prev]);

    // Update in Firestore
    moveVideoToTrashInFirestore(video.id, now).catch((err) => {
      console.warn('Firestore move to trash error:', err);
    });

    // Show red ! badge on trash tab
    setHasUnreadTrash(true);

    // Show toast with Undo option
    showToast('영상을 휴지통으로 이동했습니다', undefined, () => {
      // Undo action: restore to bookmarks & remove from trash
      setBookmarks((prev) => [video, ...prev]);
      setTrashItems((prev) => prev.filter((item) => item.id !== newTrashItem.id));
      restoreVideoFromTrashInFirestore(video.id).catch((err) =>
        console.warn('Firestore restore undo error:', err)
      );
    });
  };

  // Restore video from trash (Firebase synced)
  const handleRestoreFromTrash = (item: TrashItem) => {
    // Remove from trash
    setTrashItems((prev) => prev.filter((t) => t.id !== item.id));
    // Add back to bookmarks
    setBookmarks((prev) => [{ ...item.video, inTrash: false, trashedAt: undefined }, ...prev]);

    // Update Firestore
    restoreVideoFromTrashInFirestore(item.video.id).catch((err) => {
      console.warn('Firestore restore error:', err);
    });

    showToast('영상을 복구했습니다.');
  };

  // Permanently delete video from trash (Firebase database delete)
  const handlePermanentDelete = (trashId: string) => {
    const item = trashItems.find((t) => t.id === trashId);
    setTrashItems((prev) => prev.filter((t) => t.id !== trashId));

    if (item) {
      deleteVideoFromFirestore(item.video.id, true).catch((err) => {
        console.warn('Firestore permanent delete error:', err);
      });
    }

    showToast('영상이 데이터베이스에서 영구 삭제되었습니다.');
  };

  // Clear all items in trash (Firebase synced)
  const handleClearAllTrash = () => {
    const itemsToDelete = [...trashItems];
    setTrashItems([]);

    itemsToDelete.forEach((item) => {
      deleteVideoFromFirestore(item.video.id, true).catch((err) =>
        console.warn('Firestore clear delete error:', err)
      );
    });

    showToast('휴지통을 모두 비웠습니다.');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#131b2e] flex flex-col font-sans transition-colors duration-200">
      {/* 오프라인 네트워크 감지 배너 */}
      <OfflineIndicator />

      {/* 고정 상단 헤더 */}
      <Header
        primaryColor={themeColor.hex}
        user={user}
        onOpenAccount={() => {
          if (user.isLoggedIn) {
            setActiveTab('settings');
            setSettingsSubPage('my_info');
          } else {
            setIsAuthOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-3">
        {/* Tab 1: 보관함 (Storage) */}
        {activeTab === 'storage' && (
          <div className="space-y-2 pb-24">
            {/* 영상 링크 입력 파트 */}
            <LinkInputArea
              onSaveLink={handleSaveLink}
              onCancelSave={handleCancelSave}
              isLoading={isLoading}
              primaryColor={themeColor.hex}
              isLoggedIn={user.isLoggedIn}
              onRequireAuth={() => {
                setIsAuthOpen(true);
              }}
              onShowToast={(msg) => showToast(msg)}
            />

            {/* 영상 링크 입력 파트와 영상 카드 파트 사이에 있는 카테고리 목록 */}
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              bookmarks={user.isLoggedIn ? bookmarks : []}
              primaryColor={themeColor.hex}
              onSelectCategory={(cat) => setActiveCategory(cat)}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
            />

            {/* 실시간 검색 및 플랫폼 필터, 정렬 바 */}
            {user.isLoggedIn && bookmarks.length > 0 && (
              <BookmarkSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                totalCount={bookmarks.length}
                filteredCount={filteredBookmarks.length}
                primaryColor={themeColor.hex}
              />
            )}

            {/* 영상 카드 파트 */}
            <VideoCardList
              videos={user.isLoggedIn ? filteredBookmarks : []}
              activeCategory={activeCategory}
              recentAddedId={recentAddedId}
              primaryColor={themeColor.hex}
              isLoggedIn={user.isLoggedIn}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onRequireAuth={() => setIsAuthOpen(true)}
              onChangeCategory={(video) => setVideoToChange(video)}
              onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* Tab 2: 최근 분류 (Timeline) */}
        {activeTab === 'recent' && (
          <RecentTimelineView
            bookmarks={user.isLoggedIn ? bookmarks : []}
            primaryColor={themeColor.hex}
            isLoggedIn={user.isLoggedIn}
            onRequireAuth={() => setIsAuthOpen(true)}
            onChangeCategory={(video) => setVideoToChange(video)}
            onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
          />
        )}

        {/* Tab 3: 휴지통 (Trash) */}
        {activeTab === 'trash' && (
          <TrashView
            trashItems={user.isLoggedIn ? trashItems : []}
            primaryColor={themeColor.hex}
            onRestore={handleRestoreFromTrash}
            onPermanentDelete={handlePermanentDelete}
            onClearAll={handleClearAllTrash}
          />
        )}

        {/* Tab 4: 설정 (Settings Main + Sub-Pages) */}
        {activeTab === 'settings' && !settingsSubPage && (
          <SettingsView
            user={user}
            themeColorHex={themeColor.hex}
            themeColorName={themeColor.name}
            displayMode={displayMode}
            onNavigateSubPage={(sub: SettingsSubPage) => setSettingsSubPage(sub)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
            onShowToast={(msg) => showToast(msg)}
            onOpenInstall={() => {
              setIsPWAInstallOpen(true);
              trackEvent('pwa_install_open');
            }}
          />
        )}

        {/* Settings Sub-Pages */}
        {settingsSubPage === 'my_info' && (
          <MyInfoSubView
            user={user}
            primaryColor={themeColor.hex}
            onBack={() => setSettingsSubPage(null)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onUpdateNickname={(newNick) => {
              setUser((prev) => ({ ...prev, nickname: newNick }));
              if (auth.currentUser) {
                updateProfile(auth.currentUser, { displayName: newNick }).catch(() => {});
              }
              showToast('닉네임이 변경되었습니다.');
            }}
            onUpdateAvatar={(avatarUrl) => {
              setUser((prev) => ({ ...prev, avatarUrl }));
              try {
                if (user.uid) {
                  localStorage.setItem(`clipsort_avatar_${user.uid}`, avatarUrl);
                }
              } catch {
                // ignore
              }
            }}
            onShowToast={(msg) => showToast(msg)}
            onNavigateChangePassword={() => setSettingsSubPage('change_password')}
            onLogout={() => {
              handleLogout();
              setSettingsSubPage(null);
            }}
            onDeleteAccount={handleDeleteAccount}
            onLinkKakao={handleLinkKakaoAccount}
            onLinkGoogle={handleLinkGoogleAccount}
          />
        )}

        {settingsSubPage === 'change_password' && (
          <ChangePasswordSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
            onOpenFindPassword={() => {
              setIsAuthOpen(true);
            }}
          />
        )}

        {settingsSubPage === 'theme_color' && (
          <ThemeColorSubView
            currentThemeHex={themeColor.hex}
            onSelectTheme={(newColor: ThemeColorOption) => {
              setThemeColor(newColor);
              showToast(`테마 컬러가 '${newColor.name}'(으)로 적용되었습니다.`);
            }}
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {settingsSubPage === 'display_mode' && (
          <DisplayModeSubView
            currentMode={displayMode}
            onSelectMode={(mode) => {
              setDisplayMode(mode);
            }}
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}


        {settingsSubPage === 'terms' && (
          <TermsDetailSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {settingsSubPage === 'privacy' && (
          <PrivacyDetailSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {settingsSubPage === 'version_info' && (
          <VersionInfoSubView onBack={() => setSettingsSubPage(null)} />
        )}

        {settingsSubPage === 'contact' && (
          <ContactSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
            defaultEmail={user.isLoggedIn ? user.email : ''}
          />
        )}

        {settingsSubPage === 'open_source' && (
          <OpenSourceSubView onBack={() => setSettingsSubPage(null)} />
        )}
      </main>

      {/* 카테고리 변경 화면 (Bottom Sheet / Popup) */}
      <CategoryChangeModal
        video={videoToChange}
        categories={categories}
        isOpen={Boolean(videoToChange)}
        onClose={() => setVideoToChange(null)}
        onConfirmChange={handleConfirmCategoryChange}
        onAddNewCategory={handleAddNewCategory}
      />

      {/* 회원가입 & 로그인 모달 */}
      <AuthFlowModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onLoginSuccess={(newProfile) => {
          setUser(newProfile);
          try {
            localStorage.setItem('clipsort_user', JSON.stringify(newProfile));
          } catch {
            // ignore
          }
          trackEvent('login', { method: newProfile.provider || 'email' });
          showToast(`${newProfile.nickname}님 환영합니다!`);
        }}
      />

      {/* 알림 토스트 (Level 3 Floating Dark Pill + Undo) */}
      <Toast
        message={toastMessage}
        categoryHint={toastCategoryHint}
        onClose={() => setToastMessage(null)}
        onUndo={toastUndoAction}
      />

      {/* 보관함에서 영상 삭제 확인 모달 */}
      {videoToDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setVideoToDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#fff0f0] text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[26px]">delete</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              영상을 휴지통으로 이동하시겠습니까?
            </h3>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              선택한 영상이 휴지통으로 이동되며, 30일 동안 보관 후 완전히 영구 삭제됩니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setVideoToDeleteConfirm(null)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-98 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (videoToDeleteConfirm) {
                    handleDeleteVideo(videoToDeleteConfirm);
                    setVideoToDeleteConfirm(null);
                  }
                }}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-[#93000a] transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev-only Admin Email Test Panel (Tree-shaken / omitted in production build) */}
      <AdminEmailTestPanel
        currentUserId={user.uid}
        currentUserEmail={user.email}
        isLoggedIn={user.isLoggedIn}
        onShowToast={showToast}
      />

      {/* PWA 홈 화면 설치 안내 모달 */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        primaryColor={themeColor.hex}
        onShowToast={showToast}
      />

      {/* 하단 고정 네비게이션 바 (보관함, 최근 분류, 휴지통, 설정) */}
      <BottomNavBar
        activeTab={activeTab}
        primaryColor={themeColor.hex}
        hasUnreadTrash={hasUnreadTrash}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setSettingsSubPage(null);
        }}
      />
    </div>
  );
}
