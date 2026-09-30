import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { LinkInputArea } from './components/LinkInputArea';
import { CategoryTabs } from './components/CategoryTabs';
import { VideoCardList } from './components/VideoCardList';
import { CategoryChangeModal } from './components/CategoryChangeModal';
import { Toast } from './components/Toast';
import { OSShareSimulationModal } from './components/OSShareSimulationModal';
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
import {
  VideoBookmark,
  TrashItem,
  UserProfile,
  MainTabType,
  SettingsSubPage,
  DisplayMode,
  ThemeColorOption,
} from './types';
import { INITIAL_BOOKMARKS, STANDARD_CATEGORIES } from './mockData';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTabType>('storage');
  const [settingsSubPage, setSettingsSubPage] = useState<SettingsSubPage>(null);

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
      // system
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

  // Bookmarks state (persistent in localStorage if available)
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('clipsort_bookmarks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_BOOKMARKS;
  });

  // Trash state (persistent in localStorage)
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
      const saved = localStorage.getItem('clipsort_trash');
      if (saved) {
        const parsed: TrashItem[] = JSON.parse(saved);
        // Filter out items that have exceeded 30 days
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return parsed.filter((item) => now - item.deletedAt < thirtyDaysMs);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Save trash to localStorage & purge expired items (> 30 days)
  useEffect(() => {
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
  }, [trashItems]);

  // User Profile state
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
      isLoggedIn: true,
      nickname: '김클립',
      email: 'creator.alex@gmail.com',
      provider: 'email',
    };
  });

  // Active Category filter
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  // Loading state for link saving & AI classification
  const [isLoading, setIsLoading] = useState(false);

  // Highlight recently added item
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareSimOpen, setIsShareSimOpen] = useState(false);
  const [videoToChange, setVideoToChange] = useState<VideoBookmark | null>(null);
  const [videoToDeleteConfirm, setVideoToDeleteConfirm] = useState<VideoBookmark | null>(null);

  // Trash notification badge (shows 1 when a video is deleted, clears when user opens trash tab)
  const [hasUnreadTrash, setHasUnreadTrash] = useState(false);

  // Clear badge when switching to trash tab
  useEffect(() => {
    if (activeTab === 'trash') {
      setHasUnreadTrash(false);
    }
  }, [activeTab]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastCategoryHint, setToastCategoryHint] = useState<string | undefined>(undefined);
  const [toastUndoAction, setToastUndoAction] = useState<(() => void) | undefined>(undefined);

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Save user to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  // Derived list of all available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    STANDARD_CATEGORIES.forEach((c) => set.add(c));
    bookmarks.forEach((b) => {
      if (b.category && b.category.trim()) {
        set.add(b.category.trim());
      }
    });
    return Array.from(set);
  }, [bookmarks]);

  // Filtered bookmarks based on activeCategory
  const filteredBookmarks = useMemo(() => {
    if (activeCategory === '전체') {
      return bookmarks;
    }
    return bookmarks.filter((b) => b.category === activeCategory);
  }, [bookmarks, activeCategory]);

  const showToast = useCallback(
    (msg: string, categoryHint?: string, onUndo?: () => void) => {
      setToastMessage(msg);
      setToastCategoryHint(categoryHint);
      setToastUndoAction(onUndo ? () => onUndo : undefined);
    },
    []
  );

  // Save a new link (extract metadata + AI category classification)
  const handleSaveLink = async (url: string, defaultTitle?: string) => {
    setIsLoading(true);
    try {
      let title = defaultTitle || '';
      let thumbnail = '';
      let category = '라이프스타일';
      let source: VideoBookmark['source'] = 'web';

      // Call Express server-side Gemini API
      try {
        const response = await fetch('/api/extract-and-classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, title }),
        });

        if (response.ok) {
          const data = await response.json();
          title = data.title || title;
          thumbnail = data.thumbnail || '';
          category = data.category || '라이프스타일';
          source = data.source || 'web';
        }
      } catch (err) {
        console.warn('Backend extract error, using client extraction fallback:', err);
      }

      // Client fallback if backend unavailable or returned empty title/thumbnail
      if (!title) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          title = '유튜브 영상 콘텐츠';
          source = 'youtube';
        } else if (url.includes('instagram.com')) {
          title = '인스타그램 릴스 트렌드 비디오';
          source = 'instagram';
        } else if (url.includes('tiktok.com')) {
          title = '틱톡 인기 숏폼 영상';
          source = 'tiktok';
        } else {
          title = '웹 저장 비디오';
        }
      }

      // Check YouTube thumbnail
      if (!thumbnail) {
        const ytMatch = url.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
        );
        if (ytMatch && ytMatch[1]) {
          thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
          source = 'youtube';
        } else {
          thumbnail =
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        }
      }

      const newId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newBookmark: VideoBookmark = {
        id: newId,
        title,
        thumbnail,
        category,
        url,
        createdAt: Date.now(),
        source,
      };

      setBookmarks((prev) => [newBookmark, ...prev]);
      setRecentAddedId(newId);

      // Level 3 Floating Toast
      showToast('저장 및 AI 분류가 완료되었습니다', category, () => {
        setBookmarks((prev) => prev.filter((b) => b.id !== newId));
      });
    } catch (err) {
      console.error('Failed to save link:', err);
      showToast('링크 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Category Change Handler
  const handleConfirmCategoryChange = (videoId: string, newCategory: string) => {
    const prevCategory = bookmarks.find((b) => b.id === videoId)?.category;
    setBookmarks((prev) =>
      prev.map((b) => (b.id === videoId ? { ...b, category: newCategory } : b))
    );

    showToast(`'${newCategory}'(으)로 카테고리가 이동되었습니다`, undefined, () => {
      if (prevCategory) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === videoId ? { ...b, category: prevCategory } : b))
        );
      }
    });
  };

  // Move video to trash
  const handleDeleteVideo = (video: VideoBookmark) => {
    // Remove from bookmarks
    setBookmarks((prev) => prev.filter((b) => b.id !== video.id));

    // Add to trash
    const newTrashItem: TrashItem = {
      id: `trash_${video.id}_${Date.now()}`,
      video,
      deletedAt: Date.now(),
    };
    setTrashItems((prev) => [newTrashItem, ...prev]);

    // Show red 1 badge on trash tab
    setHasUnreadTrash(true);

    // Show toast with Undo option
    showToast('영상이 휴지통으로 이동되었습니다 (30일 후 영구 삭제)', undefined, () => {
      // Undo action: restore to bookmarks & remove from trash
      setBookmarks((prev) => [video, ...prev]);
      setTrashItems((prev) => prev.filter((item) => item.id !== newTrashItem.id));
    });
  };

  // Restore video from trash
  const handleRestoreFromTrash = (item: TrashItem) => {
    // Remove from trash
    setTrashItems((prev) => prev.filter((t) => t.id !== item.id));
    // Add back to bookmarks
    setBookmarks((prev) => [item.video, ...prev]);

    showToast(`'${item.video.title}' 영상이 보관함으로 복원되었습니다.`);
  };

  // Permanently delete video from trash
  const handlePermanentDelete = (itemId: string) => {
    setTrashItems((prev) => prev.filter((t) => t.id !== itemId));
    showToast('영상이 영구 삭제되었습니다.');
  };

  // Clear all items in trash
  const handleClearAllTrash = () => {
    setTrashItems([]);
    showToast('휴지통을 모두 비웠습니다.');
  };

  // Check URL query parameters for Web Share Target support on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('url') || params.get('text');
      const sharedTitle = params.get('title');

      if (sharedUrl && (sharedUrl.startsWith('http://') || sharedUrl.startsWith('https://'))) {
        handleSaveLink(sharedUrl, sharedTitle || undefined);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      nickname: '게스트',
      email: '',
    });
    setSettingsSubPage(null);
    showToast('로그아웃 되었습니다');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#131b2e] text-[#131b2e] dark:text-[#eef0ff] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header (Shared across screens, hidden inside deep sub-settings) */}
      {!settingsSubPage && (
        <Header
          user={user}
          primaryColor={themeColor.hex}
          onOpenAuth={() => {
            if (user.isLoggedIn) {
              setActiveTab('settings');
              setSettingsSubPage('my_info');
            } else {
              setIsAuthOpen(true);
            }
          }}
          onOpenShareSim={() => setIsShareSimOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 flex flex-col">
        {/* TAB 1: 보관함 (메인 화면) */}
        {activeTab === 'storage' && !settingsSubPage && (
          <div className="flex-1 flex flex-col pb-24">
            {/* ① 링크 저장 영역 (화면 상단) */}
            <section aria-label="링크 저장 영역" className="mb-2">
              <LinkInputArea
                onSaveLink={handleSaveLink}
                isLoading={isLoading}
                primaryColor={themeColor.hex}
                onShowToast={(msg) => showToast(msg)}
              />
            </section>

            {/* ② 카테고리 탭 영역 (화면 상단-중간) */}
            <section aria-label="카테고리 탭 영역">
              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                bookmarks={bookmarks}
                primaryColor={themeColor.hex}
                onSelectCategory={setActiveCategory}
              />
            </section>

            {/* ③ 영상 카드 목록 (화면 본문) */}
            <section aria-label="영상 카드 목록" className="flex-1 mt-1">
              <VideoCardList
                videos={filteredBookmarks}
                activeCategory={activeCategory}
                recentAddedId={recentAddedId}
                primaryColor={themeColor.hex}
                onChangeCategory={(video) => setVideoToChange(video)}
                onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
              />
            </section>
          </div>
        )}

        {/* TAB 2: 최근 분류 타임라인 보관함 */}
        {activeTab === 'recent' && !settingsSubPage && (
          <RecentTimelineView
            bookmarks={bookmarks}
            primaryColor={themeColor.hex}
            onChangeCategory={(video) => setVideoToChange(video)}
            onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
          />
        )}

        {/* TAB 3: 휴지통 (삭제된 영상 보관함 & 30일 후 자동 영구 삭제) */}
        {activeTab === 'trash' && !settingsSubPage && (
          <TrashView
            trashItems={trashItems}
            primaryColor={themeColor.hex}
            onRestore={handleRestoreFromTrash}
            onPermanentDelete={handlePermanentDelete}
            onClearAll={handleClearAllTrash}
          />
        )}

        {/* TAB 4: 설정 메인 화면 */}
        {activeTab === 'settings' && !settingsSubPage && (
          <SettingsView
            user={user}
            displayMode={displayMode}
            themeColorHex={themeColor.hex}
            themeColorName={themeColor.name}
            onNavigateSubPage={(sub) => setSettingsSubPage(sub)}
            onLogout={handleLogout}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {/* 설정 하위 화면들 */}
        {settingsSubPage === 'my_info' && (
          <MyInfoSubView
            user={user}
            primaryColor={themeColor.hex}
            onBack={() => setSettingsSubPage(null)}
            onUpdateNickname={(newNick) => setUser((prev) => ({ ...prev, nickname: newNick }))}
            onUpdateAvatar={(newAvatar) => setUser((prev) => ({ ...prev, avatarUrl: newAvatar }))}
            onShowToast={(msg) => showToast(msg)}
            onNavigateChangePassword={() => setSettingsSubPage('change_password')}
            onLogout={handleLogout}
          />
        )}

        {settingsSubPage === 'change_password' && (
          <ChangePasswordSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
            onOpenFindPassword={() => {
              setSettingsSubPage(null);
              setIsAuthOpen(true);
            }}
          />
        )}

        {settingsSubPage === 'theme_color' && (
          <ThemeColorSubView
            currentThemeHex={themeColor.hex}
            onBack={() => setSettingsSubPage(null)}
            onSelectTheme={(opt) => setThemeColor(opt)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {settingsSubPage === 'display_mode' && (
          <DisplayModeSubView
            currentMode={displayMode}
            onBack={() => setSettingsSubPage(null)}
            onSelectMode={(mode) => setDisplayMode(mode)}
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
          <VersionInfoSubView
            onBack={() => setSettingsSubPage(null)}
          />
        )}

        {settingsSubPage === 'contact' && (
          <ContactSubView
            onBack={() => setSettingsSubPage(null)}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {settingsSubPage === 'open_source' && (
          <OpenSourceSubView
            onBack={() => setSettingsSubPage(null)}
          />
        )}
      </main>

      {/* 카테고리 변경 화면 (Bottom Sheet / Popup) */}
      <CategoryChangeModal
        video={videoToChange}
        categories={categories}
        isOpen={Boolean(videoToChange)}
        onClose={() => setVideoToChange(null)}
        onConfirmChange={handleConfirmCategoryChange}
      />

      {/* OS 공유하기 연동 시뮬레이터 모달 */}
      <OSShareSimulationModal
        isOpen={isShareSimOpen}
        onClose={() => setIsShareSimOpen(false)}
        onShareToClipSort={handleSaveLink}
      />

      {/* 회원가입 & 로그인 모달 (총 10개 화면 지원: 이메일 로그인, 비밀번호 찾기, 새 비밀번호 재설정 등) */}
      <AuthFlowModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onLoginSuccess={(newProfile) => {
          setUser(newProfile);
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
