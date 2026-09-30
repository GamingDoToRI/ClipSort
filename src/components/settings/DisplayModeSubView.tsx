import React, { useState } from 'react';
import { DisplayMode } from '../../types';

interface DisplayModeSubViewProps {
  currentMode: DisplayMode;
  onBack: () => void;
  onSelectMode: (mode: DisplayMode) => void;
  onShowToast: (msg: string) => void;
}

export const DisplayModeSubView: React.FC<DisplayModeSubViewProps> = ({
  currentMode,
  onBack,
  onSelectMode,
  onShowToast,
}) => {
  const [selectedMode, setSelectedMode] = useState<DisplayMode>(currentMode);

  const descriptions: Record<DisplayMode, string> = {
    system: '기기의 디스플레이 설정에 맞추어 자동으로 테마가 변경됩니다.',
    light: '항상 밝은 배경과 선명한 텍스트로 모든 화면을 유지합니다.',
    dark: '주변 조명이 어두운 환경에서도 눈이 편안한 다크 테마를 고정합니다.',
  };

  const handleSelect = (mode: DisplayMode) => {
    setSelectedMode(mode);
    onSelectMode(mode);
    const label = mode === 'system' ? '시스템 설정' : mode === 'light' ? '밝은 모드' : '어두운 모드';
    onShowToast(`${label}(으)로 적용되었습니다.`);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#faf8ff]/95 backdrop-blur-md px-1 py-3 flex items-center justify-between border-b border-[#dae2fd]/40">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="text-base font-bold text-[#131b2e] tracking-tight">화면 모드 설정</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="px-1 pt-4 space-y-6">
        <div>
          <p className="text-xs text-[#777587]">
            클립소트의 테마를 선택하세요. 디바이스의 기본 환경과 동기화하거나 원하는 모드를 고정할 수 있습니다.
          </p>
        </div>

        {/* Theme Cards Grid (3 Preview Items) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Option 1: 시스템 설정 */}
          <div
            onClick={() => handleSelect('system')}
            className="group cursor-pointer flex flex-col items-center"
          >
            <div
              className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col transition-all duration-200 group-active:scale-[0.98] ${
                selectedMode === 'system'
                  ? 'border-2 border-[#5046e5] ring-1 ring-[#5046e5]/30'
                  : 'border border-[#dae2fd]/70 hover:border-[#dae2fd]'
              }`}
            >
              {/* Split Light / Dark Simulation */}
              <div className="w-full h-1/2 bg-[#f8fafc] p-2 flex flex-col space-y-1">
                <div className="w-3/4 h-1.5 rounded-full bg-[#e2e8f0]" />
                <div className="w-1/2 h-1 rounded-full bg-[#cbd5e1]" />
                <div className="w-full h-5 rounded bg-white mt-1 p-1 flex gap-1 border border-[#e2e8f0]">
                  <div className="w-3 h-full rounded bg-[#5046e5]/30" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-full h-1 rounded-full bg-[#cbd5e1]" />
                    <div className="w-2/3 h-0.5 rounded-full bg-[#e2e8f0]" />
                  </div>
                </div>
              </div>
              <div className="w-full h-1/2 bg-[#171E31] p-2 flex flex-col space-y-1 border-t border-slate-700">
                <div className="w-full h-5 rounded bg-[#202942] p-1 flex gap-1">
                  <div className="w-3 h-full rounded bg-[#5046e5]/50" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-full h-1 rounded-full bg-slate-500" />
                    <div className="w-2/3 h-0.5 rounded-full bg-slate-600" />
                  </div>
                </div>
              </div>
              {/* Central Split Pill Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-[#dae2fd]">
                  <span
                    className="material-symbols-outlined text-[13px] text-[#5046e5]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    brightness_auto
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`mt-2 text-xs text-center ${
                selectedMode === 'system' ? 'font-bold text-[#131b2e]' : 'font-medium text-[#777587]'
              }`}
            >
              시스템 설정
            </span>
            <div
              className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                selectedMode === 'system'
                  ? 'bg-[#5046e5] text-white'
                  : 'border border-[#dae2fd] text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
            </div>
          </div>

          {/* Option 2: 라이트 모드 (밝게) */}
          <div
            onClick={() => handleSelect('light')}
            className="group cursor-pointer flex flex-col items-center"
          >
            <div
              className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-white p-2 flex flex-col justify-between transition-all duration-200 group-active:scale-[0.98] ${
                selectedMode === 'light'
                  ? 'border-2 border-[#5046e5] ring-1 ring-[#5046e5]/30'
                  : 'border border-[#dae2fd]/70 hover:border-[#dae2fd]'
              }`}
            >
              <div className="space-y-1">
                <div className="w-full h-6 rounded bg-[#f2f3ff] p-1 flex gap-1">
                  <div className="w-4 h-full rounded bg-[#eaedff]" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-3/4 h-1 rounded-full bg-[#777587]" />
                    <div className="w-1/2 h-0.5 rounded-full bg-[#c7c4d8]" />
                  </div>
                </div>
                <div className="w-full h-6 rounded bg-[#f2f3ff] p-1 flex gap-1">
                  <div className="w-4 h-full rounded bg-[#eaedff]" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-3/4 h-1 rounded-full bg-[#777587]" />
                  </div>
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-[#eaedff] flex items-center justify-around px-1">
                <div className="w-1 h-1 rounded-full bg-[#5046e5]" />
                <div className="w-1 h-1 rounded-full bg-[#c7c4d8]" />
                <div className="w-1 h-1 rounded-full bg-[#c7c4d8]" />
              </div>
            </div>
            <span
              className={`mt-2 text-xs text-center ${
                selectedMode === 'light' ? 'font-bold text-[#131b2e]' : 'font-medium text-[#777587]'
              }`}
            >
              밝게
            </span>
            <div
              className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                selectedMode === 'light'
                  ? 'bg-[#5046e5] text-white'
                  : 'border border-[#dae2fd] text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
            </div>
          </div>

          {/* Option 3: 다크 모드 (어둡게) */}
          <div
            onClick={() => handleSelect('dark')}
            className="group cursor-pointer flex flex-col items-center"
          >
            <div
              className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#121829] p-2 flex flex-col justify-between transition-all duration-200 group-active:scale-[0.98] ${
                selectedMode === 'dark'
                  ? 'border-2 border-[#5046e5] ring-1 ring-[#5046e5]/30'
                  : 'border border-[#dae2fd]/70 hover:border-[#dae2fd]'
              }`}
            >
              <div className="space-y-1">
                <div className="w-full h-6 rounded bg-[#1c243c] p-1 flex gap-1">
                  <div className="w-4 h-full rounded bg-[#283253]" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-3/4 h-1 rounded-full bg-slate-400" />
                    <div className="w-1/2 h-0.5 rounded-full bg-slate-600" />
                  </div>
                </div>
                <div className="w-full h-6 rounded bg-[#1c243c] p-1 flex gap-1">
                  <div className="w-4 h-full rounded bg-[#283253]" />
                  <div className="flex-1 flex flex-col justify-center gap-0.5">
                    <div className="w-3/4 h-1 rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1e2741] flex items-center justify-around px-1">
                <div className="w-1 h-1 rounded-full bg-[#c3c0ff]" />
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <div className="w-1 h-1 rounded-full bg-slate-600" />
              </div>
            </div>
            <span
              className={`mt-2 text-xs text-center ${
                selectedMode === 'dark' ? 'font-bold text-[#131b2e]' : 'font-medium text-[#777587]'
              }`}
            >
              어둡게
            </span>
            <div
              className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                selectedMode === 'dark'
                  ? 'bg-[#5046e5] text-white'
                  : 'border border-[#dae2fd] text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
            </div>
          </div>
        </div>

        {/* Description Banner Card */}
        <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#dae2fd]/60 text-xs text-[#464555] leading-relaxed">
          <p>{descriptions[selectedMode]}</p>
        </div>
      </main>
    </div>
  );
};
