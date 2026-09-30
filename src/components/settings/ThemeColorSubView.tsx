import React, { useState } from 'react';
import { ThemeColorOption } from '../../types';

interface ThemeColorSubViewProps {
  currentThemeHex: string;
  onBack: () => void;
  onSelectTheme: (option: ThemeColorOption) => void;
  onShowToast: (msg: string) => void;
}

const THEME_OPTIONS: ThemeColorOption[] = [
  {
    id: 'kinetic_indigo',
    name: '시그니처 인디고',
    sub: 'Kinetic Indigo',
    hex: '#5046e5',
  },
  {
    id: 'deep_violet',
    name: '모던 딥 바이올렛',
    sub: 'Deep Violet',
    hex: '#7c3aed',
  },
  {
    id: 'sapphire_blue',
    name: '오션 사파이어 블루',
    sub: 'Sapphire Blue',
    hex: '#2563eb',
  },
  {
    id: 'slate_black',
    name: '미니멀 슬레이트 블랙',
    sub: 'Slate Black',
    hex: '#0f172a',
  },
  {
    id: 'forest_emerald',
    name: '포레스트 에메랄드',
    sub: 'Forest Emerald',
    hex: '#059669',
  },
];

export const ThemeColorSubView: React.FC<ThemeColorSubViewProps> = ({
  currentThemeHex,
  onBack,
  onSelectTheme,
  onShowToast,
}) => {
  const [selectedHex, setSelectedHex] = useState(currentThemeHex);
  const currentOption = THEME_OPTIONS.find((t) => t.hex === selectedHex) || THEME_OPTIONS[0];

  const handlePick = (option: ThemeColorOption) => {
    setSelectedHex(option.hex);
    onSelectTheme(option);
    onShowToast(`'${option.name}' 테마가 적용되었습니다`);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#faf8ff]/95 backdrop-blur-md px-1 py-3 flex items-center justify-between border-b border-[#dae2fd]/40">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <h1 className="text-base font-bold text-[#131b2e] tracking-tight">AI 테마 컬러</h1>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: selectedHex }}
        >
          자동 분류 적용
        </span>
      </header>

      {/* Main Content */}
      <main className="px-1 pt-4 space-y-5">
        <section className="space-y-1">
          <p className="text-sm text-[#464555] leading-relaxed">
            ClipSort의 주요 강조 색상과 카테고리 태그 톤을 취향에 맞게 선택하세요.
          </p>
          <div className="flex items-center gap-1 text-xs text-[#777587]">
            <span
              className="material-symbols-outlined text-[15px]"
              style={{ color: selectedHex, fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>영상 메타데이터 분석 기반 자동 하이라이트 톤에 반영됩니다.</span>
          </div>
        </section>

        {/* Real-Time Mini Preview Card Component */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777587] uppercase tracking-wider">
              미리보기 (PREVIEW)
            </span>
            <span className="text-xs text-[#464555] font-semibold">
              {currentOption.sub}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#dae2fd]/60 shadow-xs">
            <div className="flex items-start gap-3">
              {/* Simulated Video Aspect Thumbnail */}
              <div className="w-24 h-16 rounded-xl bg-[#eaedff] relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80"
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_circle
                  </span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-0.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[#131b2e] truncate">
                    2025 UI 트렌드 심층 분석 요약
                  </p>
                  <p className="text-xs text-[#777587] truncate">
                    youtube.com/watch?v=k39Xw...
                  </p>
                </div>
                {/* Interactive Badge Preview */}
                <div className="flex items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold transition-colors duration-300 shadow-xs"
                    style={{ backgroundColor: selectedHex }}
                  >
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_label
                    </span>
                    <span>디자인 인사이트</span>
                  </div>
                  <span className="text-[11px] text-[#777587]">방금 정렬됨</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Color Options List */}
        <section className="space-y-2.5 pt-1">
          <span className="text-xs font-bold text-[#777587] uppercase tracking-wider block">
            팔레트 컬렉션
          </span>
          <div className="space-y-2">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = selectedHex === opt.hex;
              return (
                <div
                  key={opt.id}
                  onClick={() => handlePick(opt)}
                  className={`bg-white rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
                    isSelected
                      ? 'border-[#5046e5]/50 shadow-md ring-1 ring-[#5046e5]/20'
                      : 'border-[#dae2fd]/60 hover:bg-[#f2f3ff]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner relative flex-shrink-0"
                      style={{ backgroundColor: opt.hex }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white/20" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#131b2e]">{opt.name}</span>
                        {opt.id === 'kinetic_indigo' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#eaedff] text-[#3625cd] font-bold">
                            기본 고정
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#777587]">{opt.sub}</span>
                    </div>
                  </div>

                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: isSelected ? opt.hex : '#c7c4d8' }}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notice */}
        <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex items-start gap-2.5 text-xs text-[#464555]">
          <span className="material-symbols-outlined text-[#777587] text-[18px] mt-0.5">
            info
          </span>
          <p>
            테마 색상은 ClipSort 앱 전반의 액션 버튼, 태그 칩, 실시간 분류 애니메이션 하이라이트에 동기화되어 즉시 반영됩니다.
          </p>
        </div>
      </main>
    </div>
  );
};
