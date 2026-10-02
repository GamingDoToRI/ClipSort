import React, { useState, useRef, useEffect } from 'react';
import { VideoBookmark } from '../types';
import { Pencil, Trash2, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  bookmarks: VideoBookmark[];
  primaryColor?: string;
  onSelectCategory: (category: string) => void;
  onRenameCategory?: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory?: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  bookmarks,
  primaryColor = '#5046e5',
  onSelectCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  // Count per category
  const counts: Record<string, number> = {};
  counts['전체'] = bookmarks.length;
  bookmarks.forEach((b) => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  // State for menu dropdown / popups
  const [menuOpenCat, setMenuOpenCat] = useState<string | null>(null);
  const [renameTargetCat, setRenameTargetCat] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deleteTargetCat, setDeleteTargetCat] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll arrow visibility state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', updateScrollButtons);
      }
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories]);

  // Scroll smoothly by clicking arrows
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  };

  // Close menu dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenCat(null);
      }
    };
    if (menuOpenCat) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenCat]);

  const handleOpenMenu = (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    setMenuOpenCat((prev) => (prev === cat ? null : cat));
  };

  const handleStartRename = (cat: string) => {
    setRenameTargetCat(cat);
    setRenameInput(cat);
    setMenuOpenCat(null);
  };

  const handleConfirmRename = () => {
    if (!renameTargetCat) return;
    const trimmed = renameInput.trim();
    if (trimmed && trimmed !== renameTargetCat && onRenameCategory) {
      onRenameCategory(renameTargetCat, trimmed);
    }
    setRenameTargetCat(null);
  };

  const handleStartDelete = (cat: string) => {
    setDeleteTargetCat(cat);
    setMenuOpenCat(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetCat && onDeleteCategory) {
      onDeleteCategory(deleteTargetCat);
    }
    setDeleteTargetCat(null);
  };

  return (
    <>
      {/* Category selection row with left and right navigation arrow buttons */}
      <div className="relative my-3 -mx-2 px-2 flex items-center group/nav">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          title="이전 카테고리 보기"
          aria-label="이전 카테고리 보기"
          className={`shrink-0 z-20 w-8 h-8 rounded-full bg-white text-[#131b2e] shadow-md border border-[#dae2fd] flex items-center justify-center transition-all duration-200 cursor-pointer mr-1.5 active:scale-95 ${
            canScrollLeft
              ? 'opacity-90 hover:opacity-100 hover:bg-[#f2f3ff] hover:text-[#5046e5] hover:scale-105'
              : 'opacity-25 cursor-not-allowed pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable Category Chips Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          <div className="flex items-center gap-2 shrink-0 px-1">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              const count = counts[cat] || 0;
              const isAll = cat === '전체';
              const isMenuOpen = menuOpenCat === cat;

              return (
                <div key={cat} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white shadow-sm ring-2 ring-offset-1'
                        : 'bg-white text-[#464555] hover:text-[#131b2e] hover:bg-[#f2f3ff] border border-[#dae2fd]/70'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: primaryColor,
                            boxShadow: `0 2px 8px -1px ${primaryColor}40`,
                          }
                        : undefined
                    }
                  >
                    {isActive && (
                      <span
                        className="material-symbols-outlined text-[13px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    )}
                    <span>{cat}</span>
                    {count > 0 && <span className="opacity-80 font-normal">({count})</span>}
                  </button>

                  {/* Edit Button (Pencil Icon) in upper right on hover - exclude "전체" */}
                  {!isAll && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(e, cat)}
                      title={`${cat} 카테고리 관리`}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-[#5046e5] border border-[#dae2fd] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 ${
                        isMenuOpen
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:scale-110 active:scale-95'
                      }`}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}

                  {/* Dropdown Menu: "이름 바꾸기" & "카테고리 삭제" */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute top-8 left-0 z-40 bg-white rounded-xl shadow-xl border border-[#dae2fd] py-1.5 min-w-[130px] animate-in fade-in zoom-in-95 duration-150"
                    >
                      <button
                        type="button"
                        onClick={() => handleStartRename(cat)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#131b2e] hover:bg-[#f2f3ff] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#5046e5]" />
                        <span>이름 바꾸기</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDelete(cat)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#fff0f0] flex items-center gap-2 cursor-pointer transition-colors border-t border-[#f2f3ff]"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#ba1a1a]" />
                        <span>카테고리 삭제</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          title="다음 카테고리 보기"
          aria-label="다음 카테고리 보기"
          className={`shrink-0 z-20 w-8 h-8 rounded-full bg-white text-[#131b2e] shadow-md border border-[#dae2fd] flex items-center justify-center transition-all duration-200 cursor-pointer ml-1.5 active:scale-95 ${
            canScrollRight
              ? 'opacity-90 hover:opacity-100 hover:bg-[#f2f3ff] hover:text-[#5046e5] hover:scale-105'
              : 'opacity-25 cursor-not-allowed pointer-events-none'
          }`}
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Name Change Popup Modal */}
      {renameTargetCat && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setRenameTargetCat(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto w-full border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#131b2e]">카테고리 이름 변경</h3>
              <button
                type="button"
                onClick={() => setRenameTargetCat(null)}
                className="p-1 rounded-full text-[#777587] hover:bg-[#f2f3ff] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-[#464555] block mb-1.5">
                카테고리 이름
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                maxLength={15}
                autoFocus
                placeholder="카테고리 이름을 입력하세요"
                className="w-full px-3 py-2 text-sm bg-white border border-[#dae2fd] rounded-xl text-[#131b2e] focus:outline-none focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTargetCat(null)}
                className="px-4 py-2 rounded-xl bg-[#f2f3ff] text-[#464555] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-95 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameInput.trim()}
                className="px-4 py-2 rounded-xl text-white font-semibold text-xs hover:brightness-110 transition-colors active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Modal */}
      {deleteTargetCat && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDeleteTargetCat(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-full border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#fff0f0] text-[#ba1a1a]">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              [{deleteTargetCat}] 카테고리를 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              해당 카테고리가 상단 목록에서 제거됩니다. 해당 카테고리에 속해있던 영상들은 삭제된 카테고리를 제외하고 AI가 다른 카테고리로 자동 재분류합니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setDeleteTargetCat(null)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-98 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-[#93000a] transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
