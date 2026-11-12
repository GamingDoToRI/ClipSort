import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';

export type PlatformFilter = 'all' | 'youtube' | 'instagram' | 'tiktok';
export type SortOrderType = 'latest' | 'oldest' | 'title';

interface BookmarkSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlatform: PlatformFilter;
  onPlatformChange: (p: PlatformFilter) => void;
  sortOrder: SortOrderType;
  onSortChange: (s: SortOrderType) => void;
  totalCount: number;
  filteredCount: number;
  primaryColor?: string;
}

export const BookmarkSearchBar: React.FC<BookmarkSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  sortOrder,
  onSortChange,
  totalCount,
  filteredCount,
  primaryColor = '#5046e5',
}) => {
  if (totalCount === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-3 border border-[#dae2fd]/70 shadow-xs space-y-2.5 mb-3 transition-all">
      {/* Search Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#777587] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="영상 제목, 키워드 또는 채널 검색..."
            className="w-full pl-9 pr-8 py-2 bg-[#f8f9ff] hover:bg-[#f2f3ff] focus:bg-white rounded-xl text-xs text-[#131b2e] placeholder:text-[#777587] border border-transparent focus:border-[#5046e5]/40 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#777587] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
              aria-label="검색어 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Order Selector */}
        <div className="relative shrink-0">
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as SortOrderType)}
            className="appearance-none pl-7 pr-6 py-2 bg-[#f8f9ff] hover:bg-[#f2f3ff] rounded-xl text-xs font-semibold text-[#464555] border border-transparent focus:border-[#5046e5]/40 outline-none cursor-pointer transition-all"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">가나다순</option>
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-[#777587] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Platform Filter Chips & Count Badge Row */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onPlatformChange('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedPlatform === 'all'
                ? 'bg-[#5046e5] text-white shadow-xs'
                : 'bg-[#f2f3ff] text-[#464555] hover:bg-[#eaedff]'
            }`}
          >
            전체 플랫폼
          </button>
          <button
            type="button"
            onClick={() => onPlatformChange('youtube')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedPlatform === 'youtube'
                ? 'bg-[#ff0000] text-white shadow-xs'
                : 'bg-[#fff0f0] text-[#ba1a1a] hover:bg-[#ffe5e5]'
            }`}
          >
            <span>YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => onPlatformChange('instagram')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedPlatform === 'instagram'
                ? 'bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-xs'
                : 'bg-[#fff0f6] text-[#b81862] hover:bg-[#ffe5ef]'
            }`}
          >
            <span>Instagram</span>
          </button>
          <button
            type="button"
            onClick={() => onPlatformChange('tiktok')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedPlatform === 'tiktok'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            <span>TikTok</span>
          </button>
        </div>

        {/* Results Counter */}
        <span className="text-[11px] text-[#777587] font-medium shrink-0">
          총 <strong className="text-[#131b2e]">{filteredCount}</strong>개
        </span>
      </div>
    </div>
  );
};
