import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Laptop,
  Smartphone,
  Info,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  onShowToast?: (msg: string) => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#5046e5',
  onShowToast,
}) => {
  const { isInstallable, isInstalled, isIOS, isIframe, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showOmniboxGuide, setShowOmniboxGuide] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);

    try {
      const result = await install();

      if (result === 'installed') {
        if (onShowToast) onShowToast('홈 화면에 ClipSort 앱이 성공적으로 설치되었습니다!');
        onClose();
      } else if (result === 'opened_top_tab') {
        if (onShowToast) {
          onShowToast('새 창에서 ClipSort 설치 화면이 열렸습니다. 새 탭을 확인해 주세요.');
        }
      } else if (result === 'ios_share') {
        if (onShowToast) {
          onShowToast("공유 창에서 '홈 화면에 추가'를 선택해 주세요.");
        }
      } else if (result === 'show_omnibox_guide') {
        setShowOmniboxGuide(true);
        if (onShowToast) {
          onShowToast('브라우저 주소창 우측의 [설치] 아이콘을 클릭해 주세요.');
        }
      } else if (result === 'dismissed') {
        if (onShowToast) {
          onShowToast('앱 설치가 취소되었습니다. 언제든 다시 설치하실 수 있습니다.');
        }
      } else {
        if (onShowToast) {
          onShowToast('브라우저 공식 설치 창이 화면에 호출되었습니다.');
        }
      }
    } catch (err) {
      console.warn('Install trigger error:', err);
      setShowOmniboxGuide(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDownloadShortcut = () => {
    try {
      const currentUrl = window.location.origin || window.location.href;
      const fileContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=${currentUrl}/favicon.png\r\n`;
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'ClipSort-클립소트.url';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      if (onShowToast) {
        onShowToast('다운로드 폴더에 ClipSort 바로가기 파일이 저장되었습니다!');
      }
    } catch (e) {
      console.warn('Shortcut download error:', e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-auto border border-[#dae2fd]/70 animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#777587] hover:text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center pt-1 pb-3">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md border border-[#dae2fd]/60 p-0.5 overflow-hidden bg-white">
            <img
              src="/pwa-192x192.png"
              alt="ClipSort App Icon"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#5046e5] text-[11px] font-bold mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>초경량 웹 독립 실행 앱</span>
          </div>
          <h2 className="text-lg font-bold text-[#131b2e] tracking-tight">ClipSort 홈 화면에 설치</h2>
          <p className="text-xs text-[#777587] mt-1">
            원하는 방식으로 PC나 스마트폰에 앱을 추가하세요.
          </p>
        </div>

        {/* Benefits List */}
        <div className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#dae2fd]/50 mb-4 space-y-1.5 text-xs text-[#464555]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />
            <span>별도 설치 마법사 없이 원클릭으로 가볍게 실행</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />
            <span>PC 바탕화면 및 스마트폰 홈 화면에 아이콘 생성</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5046e5] shrink-0" />
            <span>자동 업데이트로 매번 재설치할 필요 없음</span>
          </div>
        </div>

        {/* Already Installed State */}
        {isInstalled ? (
          <div className="text-center py-2 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              이미 홈 화면 앱으로 설치되어 있습니다
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#5046e5] text-xs font-bold text-white shadow-xs hover:bg-[#3625cd] transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        ) : (
          /* Main Interactive Zone */
          <div className="space-y-3">
            {/* Option 1: PWA Native App Install */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#131b2e] px-1">
                <span>방법 1. 브라우저 공식 앱으로 설치 (권장)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-semibold">
                  무설치 PWA
                </span>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-md shadow-[#5046e5]/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isInstalling ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>설치 대화상자 확인 중...</span>
                  </>
                ) : isIframe ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>새 창에서 앱 설치하기</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>브라우저 앱으로 즉시 설치하기</span>
                  </>
                )}
              </button>
            </div>

            {/* Option 2: Direct PC Shortcut File Download (.url) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#131b2e] px-1">
                <span>방법 2. PC 바탕화면 바로가기 파일 받기</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold">
                  다운로드 파일
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadShortcut}
                className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-[#5046e5]/30 text-[#5046e5] font-bold text-xs hover:bg-[#f2f3ff] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>PC용 바로가기 파일(.url) 다운로드</span>
              </button>
              <p className="text-[10px] text-[#777587] px-1 leading-normal">
                💡 클릭 시 브라우저 다운로드 바에 파일이 저장되며, 바탕화면에 꺼내두고 언제든 바로 열 수 있습니다.
              </p>
            </div>

            {/* Omnibox / Browser Menu Guide */}
            {showOmniboxGuide && !isIframe && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Laptop className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PC 크롬 주소창 또는 메뉴에서 1초 만에 설치하기</span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-amber-200 text-[11px] font-mono flex items-center justify-between text-neutral-600 shadow-inner">
                  <span className="truncate max-w-[140px] text-neutral-400">https://clipsort...</span>
                  <div className="flex items-center gap-1 bg-[#5046e5] text-white px-2 py-0.5 rounded font-sans font-bold text-[10px] animate-pulse">
                    <Download className="w-3 h-3" />
                    <span>설치 ⊕</span>
                  </div>
                </div>
                <div className="text-[11px] text-amber-800 space-y-1">
                  <p>
                    1. 브라우저 주소창 맨 오른쪽의 <strong>[설치 ⊕]</strong> 아이콘이 있다면 클릭
                  </p>
                  <p>
                    2. 또는 크롬 우측 상단 <strong>[점 3개 메뉴 ⋮] → [저장 및 공유] → [페이지를 앱으로 설치...]</strong> 클릭
                  </p>
                  <p className="text-[10px] text-amber-700 pt-0.5">
                    💡 '페이지를 앱으로 설치'를 누르면 바탕화면에 ClipSort 전용 앱 아이콘이 생성됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Platform Guidance */}
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/60 text-[11px] text-[#464555] space-y-1">
              {isIOS ? (
                <div className="flex items-start gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#5046e5] shrink-0 mt-0.5" />
                  <div>
                    <strong>아이폰 Safari</strong>: 브라우저 하단 공유 버튼(네모+화살표)을 누른 후{' '}
                    <strong>[홈 화면에 추가]</strong>를 누르시면 됩니다.
                  </div>
                </div>
              ) : isIframe ? (
                <div className="flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-[#5046e5] shrink-0 mt-0.5" />
                  <div>
                    미리보기(iframe) 환경에서는 브라우저 보안 규정상 내부 창에서의 설치가 제한되므로, 위 버튼을 통해 새 창으로 연결됩니다.
                  </div>
                </div>
              ) : null}
            </div>

            {/* Close / Later action */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#464555] hover:bg-[#eaedff] transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
