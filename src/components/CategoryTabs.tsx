import React from 'react';
import { VideoBookmark } from '../types';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  bookmarks: VideoBookmark[];
  primaryColor?: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  bookmarks,
  primaryColor = '#5046e5',
  onSelectCategory,
}) => {
  // Count per category
  const counts: Record<string, number> = {};
  counts['전체'] = bookmarks.length;
  bookmarks.forEach((b) => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  return (
    <div className="relative my-3 -mx-4 px-4 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 shrink-0">
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          const count = counts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white text-[#464555] hover:text-[#131b2e] hover:bg-[#f2f3ff] border border-[#dae2fd]/70'
              }`}
              style={isActive ? { backgroundColor: primaryColor } : undefined}
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
          );
        })}
      </div>
    </div>
  );
};
