import React from 'react';

interface VersionInfoSubViewProps {
  onBack: () => void;
}

export const VersionInfoSubView: React.FC<VersionInfoSubViewProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#faf8ff]/95 backdrop-blur-md px-1 py-3 flex items-center justify-between border-b border-[#dae2fd]/40">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-[0.95] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <h1 className="text-base font-bold text-[#131b2e] tracking-tight">버전정보</h1>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#eaedff] text-[#5046e5] font-semibold">
          ClipSort
        </span>
      </header>

      {/* Main Canvas */}
      <main className="px-1 pt-3 flex flex-col space-y-4">
        {/* App Branding Hero Summary Card */}
        <section className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-xs border border-[#dae2fd]/60">
          <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-tr from-[#5046e5] via-[#5046e5] to-[#57dffe] p-0.5 shadow-md mb-3">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
              <div className="w-11 h-11 rounded-xl bg-[#5046e5] text-white flex items-center justify-center shadow-inner">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5046e5] text-white rounded-full flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[13px] font-bold">check</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#131b2e] tracking-tight mb-0.5">ClipSort</h2>
          <p className="text-xs text-[#777587] mb-3">스마트 모바일 비디오 북마크 & 분류기</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#3625cd] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5046e5] animate-pulse" />
            <span className="text-xs font-semibold tracking-wide">1.0.0 (최신 버전)</span>
          </div>

          <div className="flex items-center text-[#777587] text-xs space-x-1">
            <span
              className="material-symbols-outlined text-[15px] text-[#5046e5]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span>현재 가장 최신 버전을 사용하고 있습니다.</span>
          </div>
        </section>

        {/* Release Notes Card */}
        <section className="bg-white rounded-2xl p-5 shadow-xs border border-[#dae2fd]/60 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#dae2fd]/30 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#5046e5] text-[20px]">update</span>
              <h3 className="text-sm font-bold text-[#131b2e]">최신 업데이트 내역</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#eaedff] text-[#5046e5] font-semibold">
              Release Notes
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-[#5046e5]">v1.0.0</span>
              <span className="text-xs text-[#777587]">(2025.01)</span>
            </div>
            <span className="text-[11px] font-semibold text-[#00687a] px-2 py-0.5 rounded-full bg-[#57dffe]/30">
              정식 출시
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#f2f3ff]/70 border border-[#dae2fd]/30">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[17px]">auto_label</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                  AI 자동 카테고리 태깅 엔진 탑재
                </h4>
                <p className="text-[11px] text-[#777587]">
                  저장된 영상의 맥락과 제목을 초고속 분석하여 최적의 폴더로 즉각 분류합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#f2f3ff]/70 border border-[#dae2fd]/30">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[17px]">content_paste</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                  인스타그램, 유튜브 링크 실시간 클립보드 감지 연동
                </h4>
                <p className="text-[11px] text-[#777587]">
                  클립보드에 비디오 링크가 복사되면 앱 실행 시 1초 만에 스마트 저장 기능을 지원합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-[#f2f3ff]/70 border border-[#dae2fd]/30">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[17px]">palette</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#131b2e] mb-0.5">
                  다크 모드 및 테마 컬러 커스텀 기능
                </h4>
                <p className="text-[11px] text-[#777587]">
                  야간 환경을 고려한 다크 테마와 사용자 맞춤형 액센트 팔레트를 지원합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-2 text-xs text-[#777587]">
          <p>© 2025 ClipSort Inc. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};
