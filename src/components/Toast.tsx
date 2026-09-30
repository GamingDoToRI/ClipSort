import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  categoryHint?: string;
  onClose: () => void;
  onUndo?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  categoryHint,
  onClose,
  onUndo,
  duration = 3400,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-50 max-w-[370px] mx-auto pointer-events-auto transition-transform duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-[#5046e5]/30 flex items-center justify-center flex-shrink-0 text-[#818CF8]">
            <span
              className="material-symbols-outlined text-[20px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-semibold text-white leading-snug">
              {message}
            </p>
            {categoryHint && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
                <p className="text-xs text-white/80 font-medium">
                  <span className="text-[#818CF8] font-bold">'{categoryHint}'</span> 카테고리로 분류됨
                </p>
              </div>
            )}
          </div>
        </div>

        {onUndo && (
          <button
            type="button"
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="text-[#818CF8] text-xs font-bold px-2 py-1 rounded hover:bg-white/10 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
          >
            실행취소
          </button>
        )}
      </div>
    </aside>
  );
};
