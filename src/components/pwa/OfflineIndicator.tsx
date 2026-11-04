import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/95 text-white text-xs font-semibold shadow-lg backdrop-blur-xs">
        <WifiOff className="w-3.5 h-3.5 animate-pulse" />
        <span>오프라인 모드 — 캐시된 북마크를 확인 중입니다.</span>
      </div>
    </div>
  );
};
