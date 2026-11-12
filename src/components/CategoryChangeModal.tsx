import React, { useState } from 'react';
import { VideoBookmark } from '../types';
import { Check, X, Plus } from 'lucide-react';

interface CategoryChangeModalProps {
  video: VideoBookmark | null;
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmChange: (videoId: string, newCategory: string, newTitle?: string) => void;
  onAddNewCategory?: (newCategory: string) => void;
}

export const CategoryChangeModal: React.FC<CategoryChangeModalProps> = ({
  video,
  categories,
  isOpen,
  onClose,
  onConfirmChange,
  onAddNewCategory,
}) => {
  if (!isOpen || !video) return null;

  const selectableCategories = categories.filter((c) => c !== '전체');
  const [selectedCategory, setSelectedCategory] = useState<string>(video.category);
  const [editedTitle, setEditedTitle] = useState<string>(video.title);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleSelect = (cat: string) => {
    setSelectedCategory(cat);
    setIsAddingCustom(false);
  };

  const handleApplyNewCategory = () => {
    const trimmed = customCategory.trim();
    if (trimmed) {
      if (onAddNewCategory) {
        onAddNewCategory(trimmed);
      }
      setSelectedCategory(trimmed);
      setIsAddingCustom(false);
      setCustomCategory('');
    } else {
      setIsAddingCustom(false);
    }
  };

  const handleConfirm = () => {
    const finalCategory = isAddingCustom && customCategory.trim()
      ? customCategory.trim()
      : selectedCategory;

    if (finalCategory) {
      if (onAddNewCategory && isAddingCustom && customCategory.trim()) {
        onAddNewCategory(customCategory.trim());
      }
      onConfirmChange(video.id, finalCategory, editedTitle.trim() || video.title);
    }
    onClose();
  };

  const isInstagram = video.source === 'instagram' || video.url.includes('instagram.com');
  const isTikTok = video.source === 'tiktok' || video.url.includes('tiktok.com');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#dae2fd] overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="w-10 h-1 bg-[#dae2fd] rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 pt-2 pb-3 border-b border-[#f2f3ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#131b2e]">영상 정보 및 카테고리 수정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#777587] hover:text-[#131b2e] hover:bg-[#f2f3ff] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Clip Preview Unit */}
        <div className="px-5 py-3 bg-[#f2f3ff] border-b border-[#dae2fd]/60 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner border border-[#dae2fd]/60">
            {video.thumbnail && !video.thumbnail.includes('unsplash.com') ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : isInstagram ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white">
                <span className="material-symbols-outlined text-[20px]">movie</span>
                <span className="text-[8px] font-bold">REEL</span>
              </div>
            ) : isTikTok ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                <span className="material-symbols-outlined text-[20px] text-[#25F4EE]">music_video</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#eaedff] text-[#5046e5]">
                <span className="material-symbols-outlined text-[20px]">movie</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-1 text-xs text-[#777587]">
              {isInstagram ? (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white">
                    IG
                  </span>
                  <span className="font-bold text-[#e1306c]">Instagram Reel</span>
                </>
              ) : isTikTok ? (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-black text-white">
                    TT
                  </span>
                  <span className="font-bold text-black">TikTok</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px] text-red-500">play_circle</span>
                  <span className="font-bold text-red-600">YouTube</span>
                </>
              )}
              <span>•</span>
              {video.category === '미분류' ? (
                <span className="text-amber-600 font-bold">미분류 (지정 필요)</span>
              ) : (
                <span className="text-[#5046e5] font-semibold">{video.category}</span>
              )}
            </div>
            <p className="text-xs text-[#777587] font-mono truncate">
              {video.url}
            </p>
          </div>
        </div>

        {/* Video Title Edit Input */}
        <div className="px-5 pt-3 pb-1 border-b border-[#f2f3ff]">
          <label className="text-xs font-bold text-[#131b2e] flex items-center justify-between mb-1.5">
            <span>영상 제목</span>
            <span className="text-[11px] font-normal text-[#5046e5]">직접 수정 가능</span>
          </label>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="예: 성수동 파스타 맛집 릴스, 10분 복근운동"
            maxLength={120}
            className="w-full px-3.5 py-2.5 text-sm bg-[#f2f3ff] border border-[#dae2fd] rounded-xl text-[#131b2e] focus:outline-none focus:border-[#5046e5] focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Category List */}
        <div className="px-5 py-2 flex-1 overflow-y-auto max-h-[45vh] space-y-1.5">
          <span className="text-xs font-semibold text-[#777587] block mb-2">
            변경할 카테고리를 선택하세요
          </span>

          <div className="grid grid-cols-2 gap-2">
            {selectableCategories.map((cat) => {
              const isSelected = !isAddingCustom && selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm font-semibold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#eaedff] border-[#5046e5] text-[#3625cd]'
                      : 'bg-white border-[#dae2fd]/70 text-[#464555] hover:bg-[#f2f3ff] hover:text-[#131b2e]'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#5046e5] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Direct Custom Category Add */}
          <div className="pt-2">
            {!isAddingCustom ? (
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(true);
                  setCustomCategory('');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-dashed border-[#dae2fd] text-xs font-semibold text-[#5046e5] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>직접 새 카테고리 입력하기</span>
              </button>
            ) : (
              <div className="mt-2 p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]">
                <label className="text-xs font-semibold text-[#131b2e] block mb-1.5">
                  새 카테고리 이름
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="예: 인테리어, 어학, 캠핑..."
                    maxLength={15}
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm bg-white border border-[#dae2fd] rounded-lg text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyNewCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyNewCategory}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#5046e5] text-white rounded-lg hover:bg-[#3625cd] transition-colors cursor-pointer"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 border-t border-[#f2f3ff] flex items-center gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-[#dae2fd] text-sm font-semibold text-[#464555] hover:bg-[#f2f3ff] active:scale-98 transition-all cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#5046e5] hover:bg-[#3625cd] text-white text-sm font-bold shadow-md shadow-[#5046e5]/25 active:scale-98 transition-all cursor-pointer"
          >
            변경 완료
          </button>
        </div>
      </div>
    </div>
  );
};
