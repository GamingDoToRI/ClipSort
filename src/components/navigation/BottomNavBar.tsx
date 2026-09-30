import React from 'react';
import { MainTabType } from '../../types';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  primaryColor?: string;
  hasUnreadTrash?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  primaryColor = '#5046e5',
  hasUnreadTrash = false,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-16 px-2 bg-[#faf8ff] dark:bg-[#283044] max-w-xl mx-auto border-t border-[#dae2fd]/60 shadow-lg backdrop-blur-md">
      {/* Tab 1: 보관함 */}
      <button
        type="button"
        onClick={() => onChangeTab('storage')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
          activeTab === 'storage'
            ? 'font-bold'
            : 'text-[#464555] dark:text-[#c7c4d8] hover:text-[#131b2e]'
        }`}
        style={activeTab === 'storage' ? { color: primaryColor } : undefined}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'storage' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          video_library
        </span>
        <span className="text-[11px] mt-0.5 font-medium">보관함</span>
      </button>

      {/* Tab 2: 최근 분류 */}
      <button
        type="button"
        onClick={() => onChangeTab('recent')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
          activeTab === 'recent'
            ? 'font-bold'
            : 'text-[#464555] dark:text-[#c7c4d8] hover:text-[#131b2e]'
        }`}
        style={activeTab === 'recent' ? { color: primaryColor } : undefined}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'recent' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          auto_label
        </span>
        <span className="text-[11px] mt-0.5 font-medium">최근 분류</span>
      </button>

      {/* Tab 3: 휴지통 (최근분류와 설정 사이) */}
      <button
        type="button"
        onClick={() => onChangeTab('trash')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer relative ${
          activeTab === 'trash'
            ? 'font-bold'
            : 'text-[#464555] dark:text-[#c7c4d8] hover:text-[#131b2e]'
        }`}
        style={activeTab === 'trash' ? { color: primaryColor } : undefined}
      >
        <div className="relative">
          <span
            className="material-symbols-outlined text-[24px]"
            style={activeTab === 'trash' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            delete
          </span>
          {hasUnreadTrash && activeTab !== 'trash' && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
              !
            </span>
          )}
        </div>
        <span className="text-[11px] mt-0.5 font-medium">휴지통</span>
      </button>

      {/* Tab 4: 설정 */}
      <button
        type="button"
        onClick={() => onChangeTab('settings')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer ${
          activeTab === 'settings'
            ? 'font-bold'
            : 'text-[#464555] dark:text-[#c7c4d8] hover:text-[#131b2e]'
        }`}
        style={activeTab === 'settings' ? { color: primaryColor } : undefined}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          settings
        </span>
        <span className="text-[11px] mt-0.5 font-medium">설정</span>
      </button>
    </nav>
  );
};
