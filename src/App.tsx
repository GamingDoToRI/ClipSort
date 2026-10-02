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
  VideoLinkStatus,
} from './types';
import { INITIAL_BOOKMARKS, STANDARD_CATEGORIES } from './mockData';
import {
  saveVideoToFirestore,
  updateVideoInFirestore,
  moveVideoToTrashInFirestore,
  restoreVideoFromTrashInFirestore,
  deleteVideoFromFirestore,
  subscribeToVideos,
} from './services/videoFirestoreService';
import { testFirestoreConnection } from './lib/firebase';
import { classifyContentClientSide } from './services/classificationClient';

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
    return INITIAL_BOOKMARKS.map((b) => ({
      ...b,
      status: 'active' as VideoLinkStatus,
      inTrash: false,
    }));
  });

  // Trash state
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
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

  // Loading state for link saving & AI classification
  const [isLoading, setIsLoading] = useState(false);

  // Highlight recently added item
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareSimOpen, setIsShareSimOpen] = useState(false);
  const [videoToChange, setVideoToChange] = useState<VideoBookmark | null>(null);
  const [videoToDeleteConfirm, setVideoToDeleteConfirm] = useState<VideoBookmark | null>(null);

  // Trash notification badge
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

  const showToast = useCallback(
    (msg: string, categoryHint?: string, onUndo?: () => void) => {
      setToastMessage(msg);
      setToastCategoryHint(categoryHint);
      setToastUndoAction(onUndo ? () => onUndo : undefined);
    },
    []
  );

  // Validate Firestore connection on boot and sync initial bookmarks
  useEffect(() => {
    testFirestoreConnection().catch((err) => console.warn('Firestore test connection:', err));

    // Subscribe to Firestore for real-time video sync
    const unsubscribe = subscribeToVideos((firestoreVideos) => {
      if (firestoreVideos.length > 0) {
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
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

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

  // Save user to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clipsort_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  // Derived list of all available categories
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

    bookmarks.forEach((b) => {
      let norm = b.category ? b.category.trim() : '';
      if (norm === '요리' || norm === '맛집') norm = '음식';
      if (norm === '야구' || norm === '스포츠') norm = '운동';
      if (norm && !deletedSet.has(norm)) {
        set.add(norm);
      }
    });

    return Array.from(set);
  }, [bookmarks, userCategories, deletedCategories]);

  // Filtered bookmarks based on activeCategory
  const filteredBookmarks = useMemo(() => {
    if (activeCategory === '전체') {
      return bookmarks;
    }
    return bookmarks.filter((b) => b.category === activeCategory);
  }, [bookmarks, activeCategory]);

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
            newCat = '기타';
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
    setIsLoading(true);
    try {
      let title = defaultTitle || '';
      let thumbnail = '';
      let category = '';
      let source: VideoBookmark['source'] = 'web';

      // Call Express server-side Gemini API
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
        });

        if (response.ok) {
          const data = await response.json();
          if (data.title) title = data.title;
          if (data.thumbnail) thumbnail = data.thumbnail;
          if (data.category) category = data.category;
          if (data.source) source = data.source;
        }
      } catch (err) {
        console.warn('Backend extract error, using client extraction fallback:', err);
      }

      // Check YouTube thumbnail if missing
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

      // Client title fallback if empty
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

      // If category is still empty or default '라이프스타일' and content hints point to another category, use smart semantic classifier
      if (!category || category === '라이프스타일') {
        const smartCat = classifyContentClientSide(title, url, thumbnail, deletedCategories, categories);
        if (smartCat && smartCat !== '기타') {
          category = smartCat;
        } else if (!category) {
          category = smartCat;
        }
      }

      // If the AI classified this video into a completely new category, register it to userCategories so it appears in the tabs
      if (category && category !== '전체' && !deletedCategories.includes(category)) {
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
        thumbnail,
        category,
        url,
        createdAt: Date.now(),
        source,
        status: 'active' as VideoLinkStatus,
        inTrash: false,
      };

      // Save to Firestore Database
      saveVideoToFirestore(newBookmark).catch((err) => {
        console.warn('Firestore database save fallback:', err);
      });

      setBookmarks((prev) => [newBookmark, ...prev]);
      setRecentAddedId(newId);

      // Level 3 Floating Toast
      showToast('저장 및 AI 분류가 완료되었습니다', category, () => {
        handleDeleteVideo(newBookmark);
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

    // Save to Firestore
    updateVideoInFirestore(videoId, { category: newCategory }).catch((err) => {
      console.warn('Firestore category update error:', err);
    });

    showToast(`'${newCategory}'(으)로 카테고리가 이동되었습니다`, undefined, () => {
      if (prevCategory) {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === videoId ? { ...b, category: prevCategory } : b))
        );
        updateVideoInFirestore(videoId, { category: prevCategory }).catch((err) =>
          console.warn('Firestore undo update error:', err)
        );
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
      {/* 고정 상단 헤더 */}
      <Header
        primaryColor={themeColor.hex}
        user={user}
        onOpenMyInfo={() => {
          setActiveTab('settings');
          setSettingsSubPage('my_info');
        }}
        onOpenShareSim={() => setIsShareSimOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-3">
        {/* Tab 1: 보관함 (Storage) */}
        {activeTab === 'storage' && (
          <div className="space-y-2 pb-24">
            {/* 영상 링크 입력 파트 */}
            <LinkInputArea
              onSaveLink={handleSaveLink}
              isLoading={isLoading}
              primaryColor={themeColor.hex}
              onShowToast={(msg) => showToast(msg)}
            />

            {/* 영상 링크 입력 파트와 영상 카드 파트 사이에 있는 카테고리 목록 */}
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              bookmarks={bookmarks}
              primaryColor={themeColor.hex}
              onSelectCategory={(cat) => setActiveCategory(cat)}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
            />

            {/* 영상 카드 파트 */}
            <VideoCardList
              videos={filteredBookmarks}
              activeCategory={activeCategory}
              recentAddedId={recentAddedId}
              primaryColor={themeColor.hex}
              onChangeCategory={(video) => setVideoToChange(video)}
              onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
            />
          </div>
        )}

        {/* Tab 2: 최근 분류 (Timeline) */}
        {activeTab === 'recent' && (
          <RecentTimelineView
            bookmarks={bookmarks}
            primaryColor={themeColor.hex}
            onChangeCategory={(video) => setVideoToChange(video)}
            onDeleteVideo={(video) => setVideoToDeleteConfirm(video)}
          />
        )}

        {/* Tab 3: 휴지통 (Trash) */}
        {activeTab === 'trash' && (
          <TrashView
            trashItems={trashItems}
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
            onLogout={() => {
              setUser({
                isLoggedIn: false,
                nickname: '게스트',
                email: '',
              });
              showToast('로그아웃 되었습니다.');
            }}
            onShowToast={(msg) => showToast(msg)}
          />
        )}

        {/* Settings Sub-Pages */}
        {settingsSubPage === 'my_info' && (
          <MyInfoSubView
            user={user}
            primaryColor={themeColor.hex}
            onBack={() => setSettingsSubPage(null)}
            onUpdateNickname={(newNick) => {
              setUser((prev) => ({ ...prev, nickname: newNick }));
              showToast('닉네임이 변경되었습니다.');
            }}
            onShowToast={(msg) => showToast(msg)}
            onNavigateChangePassword={() => setSettingsSubPage('change_password')}
            onLogout={() => {
              setUser({
                isLoggedIn: false,
                nickname: '게스트',
                email: '',
              });
              showToast('로그아웃 되었습니다.');
              setSettingsSubPage(null);
            }}
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

      {/* OS 공유하기 연동 시뮬레이터 모달 */}
      <OSShareSimulationModal
        isOpen={isShareSimOpen}
        onClose={() => setIsShareSimOpen(false)}
        onShareToClipSort={handleSaveLink}
      />

      {/* 회원가입 & 로그인 모달 */}
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
