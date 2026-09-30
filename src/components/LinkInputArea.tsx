import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LinkInputAreaProps {
  onSaveLink: (url: string) => Promise<void>;
  isLoading: boolean;
  primaryColor?: string;
  onShowToast: (msg: string) => void;
}

const SAMPLE_LINKS = [
  { label: '🍳 원팬 파스타 레시피', url: 'https://www.youtube.com/watch?v=recipe_pasta_sample' },
  { label: '🏃 10분 허리통증 스트레칭', url: 'https://www.youtube.com/watch?v=workout_stretch_sample' },
  { label: '✈️ 교토 3박4일 숨은명소', url: 'https://www.instagram.com/reel/travel_kyoto_sample' },
  { label: '💡 아침 루틴 시간관리', url: 'https://www.youtube.com/watch?v=productivity_routine_sample' },
];

export const LinkInputArea: React.FC<LinkInputAreaProps> = ({
  onSaveLink,
  isLoading,
  primaryColor = '#5046e5',
  onShowToast,
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    await onSaveLink(url.trim());
    setUrl('');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrl(text);
        onShowToast('클립보드 링크가 입력창에 붙여넣어졌습니다');
      } else if (text) {
        setUrl(text);
      } else {
        onShowToast('클립보드에 복사된 텍스트가 없습니다');
      }
    } catch {
      onShowToast('클립보드 접근 권한이 필요합니다');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#dae2fd]/70 transition-all flex flex-col gap-2.5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* Link Input Row with Clipboard Paste button */}
        <div className="relative flex items-center rounded-xl border border-[#dae2fd] bg-[#f2f3ff]/60 focus-within:ring-1 focus-within:ring-[#5046e5] focus-within:border-[#5046e5] focus-within:bg-white transition-all">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="영상 링크를 붙여넣으세요"
            required
            className="w-full bg-transparent text-[#131b2e] placeholder-[#777587] text-sm py-3 pl-3 pr-10 focus:outline-none"
          />
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="absolute right-2 text-[#777587] hover:text-[#5046e5] p-1.5 rounded-lg transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            title="클립보드 붙여넣기"
          >
            <span className="material-symbols-outlined text-[20px]">content_paste</span>
          </button>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full text-white font-semibold text-sm py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI 분석 및 자동 분류 중...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[19px]">bookmark</span>
              <span>저장</span>
            </>
          )}
        </button>
      </form>

      {/* Guide text */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[#777587]">
        <span
          className="material-symbols-outlined text-[15px]"
          style={{ color: primaryColor }}
        >
          auto_awesome
        </span>
        <p className="text-xs leading-tight">AI가 링크를 분석하여 주제별로 자동 분류합니다</p>
      </div>

      {/* Quick link tester chips */}
      <div className="pt-2 border-t border-[#f2f3ff] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-medium text-[#777587] shrink-0 mr-1">
          빠른 샘플:
        </span>
        {SAMPLE_LINKS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setUrl(sample.url)}
            className="text-xs px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#464555] hover:text-[#3625cd] hover:bg-[#eaedff] border border-[#dae2fd]/40 transition-colors whitespace-nowrap cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
