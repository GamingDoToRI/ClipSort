import React, { useState } from 'react';
import { X, Youtube, Instagram, Film, Sparkles, Send } from 'lucide-react';

interface OSShareSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToClipSort: (url: string, title?: string) => Promise<void>;
}

const OS_SHARE_PRESETS = [
  {
    platform: 'YouTube Shorts',
    icon: Youtube,
    color: 'text-red-500 bg-red-50',
    title: '백종원의 초간단 차돌 된장찌개 끓이기 🍳',
    url: 'https://www.youtube.com/shorts/sample_doenjang_jjigae',
  },
  {
    platform: 'Instagram Reels',
    icon: Instagram,
    color: 'text-pink-600 bg-pink-50',
    title: '릴스에서 난리난 하루 10분 하체 스트레칭 루틴 🧘‍♀️',
    url: 'https://www.instagram.com/reel/sample_lower_body_stretch',
  },
  {
    platform: 'TikTok Video',
    icon: Film,
    color: 'text-cyan-600 bg-cyan-50',
    title: '3박4일 유럽 여행 짐싸기 극강의 압축 꿀팁 ✈️',
    url: 'https://www.tiktok.com/@traveler/video/sample_europe_packing',
  },
];

export const OSShareSimulationModal: React.FC<OSShareSimulationModalProps> = ({
  isOpen,
  onClose,
  onShareToClipSort,
}) => {
  const [customShareUrl, setCustomShareUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async (url: string, title?: string) => {
    setIsProcessing(true);
    try {
      await onShareToClipSort(url, title);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#dae2fd] overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#dae2fd] rounded-full mx-auto my-3 sm:hidden" />

        {/* Modal Top */}
        <div className="px-5 py-3 border-b border-[#f2f3ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#5046e5]/10 flex items-center justify-center text-[#5046e5]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-[#131b2e]">OS 스마트폰 공유하기 연동 시뮬레이터</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#777587] hover:text-[#131b2e] hover:bg-[#f2f3ff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-[#f2f3ff] p-3.5 rounded-xl border border-[#dae2fd]/70">
            <p className="text-xs text-[#464555] leading-relaxed">
              스마트폰의 유튜브나 인스타그램 앱에서 <strong className="text-[#3625cd]">공유하기 버튼</strong>을 누른 뒤 <strong className="text-[#3625cd]">ClipSort</strong>를 선택했을 때의 동작을 재현합니다.
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-[#131b2e] block mb-2">
              외부 앱에서 공유할 영상 선택
            </span>
            <div className="space-y-2">
              {OS_SHARE_PRESETS.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#dae2fd]/70 hover:border-[#5046e5] bg-white transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${preset.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-semibold text-[#777587]">
                          {preset.platform}
                        </div>
                        <div className="text-xs font-bold text-[#131b2e] truncate">
                          {preset.title}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleShare(preset.url, preset.title)}
                      className="px-3 py-1.5 rounded-lg bg-[#5046e5] text-white text-xs font-semibold hover:bg-[#3625cd] shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      ClipSort로 공유
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom URL share */}
          <div className="pt-2 border-t border-[#f2f3ff]">
            <label className="text-xs font-bold text-[#131b2e] block mb-1.5">
              또는 직접 임의의 공유 링크 입력
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customShareUrl}
                onChange={(e) => setCustomShareUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-xs bg-[#f2f3ff]/60 border border-[#dae2fd] rounded-xl text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
              />
              <button
                type="button"
                disabled={isProcessing || !customShareUrl.trim()}
                onClick={() => handleShare(customShareUrl.trim())}
                className="px-3 py-2 bg-[#5046e5] text-white text-xs font-semibold rounded-xl hover:bg-[#3625cd] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>공유</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#f2f3ff] text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#777587] hover:text-[#131b2e]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
