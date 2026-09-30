import React, { useState } from 'react';
import { UserProfile, SettingsSubPage, DisplayMode } from '../../types';

interface SettingsViewProps {
  user: UserProfile;
  displayMode: DisplayMode;
  themeColorHex: string;
  themeColorName: string;
  onNavigateSubPage: (sub: SettingsSubPage) => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  displayMode,
  themeColorHex,
  themeColorName,
  onNavigateSubPage,
  onLogout,
  onShowToast,
}) => {
  // Settings toggle states
  const [autoDetectClipboard, setAutoDetectClipboard] = useState(true);
  const [autoClassifyPush, setAutoClassifyPush] = useState(true);
  const [marketingPush, setMarketingPush] = useState(false);

  // Modals for withdraw
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const displayModeLabel =
    displayMode === 'system'
      ? '시스템'
      : displayMode === 'light'
      ? '밝게'
      : '어둡게';

  const handleConfirmWithdraw = () => {
    setShowWithdrawModal(false);
    onLogout();
    onShowToast('회원탈퇴 처리가 완료되었습니다.');
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28 pt-1">
      {/* Top Status Title */}
      <div className="flex items-center justify-between py-2 mb-2">
        <h1 className="text-xl font-bold tracking-tight text-[#131b2e]">설정</h1>
      </div>

      <div className="space-y-5">
        {/* SECTION 1: 상단 계정 정보 (Account Information Card) */}
        <section className="space-y-1.5">
          <div className="text-xs font-semibold text-[#777587] px-1">계정</div>
          <div
            onClick={() => onNavigateSubPage('my_info')}
            className="bg-white rounded-2xl p-4 border border-[#dae2fd]/60 transition-all duration-200 active:scale-[0.99] cursor-pointer hover:bg-[#f2f3ff] shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                {/* Avatar with ClipSort Indigo accent gradient */}
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#5046e5] to-[#57dffe] p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-[#5046e5]/10 flex items-center justify-center text-[#5046e5]">
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        account_circle
                      </span>
                    </div>
                  </div>
                  {/* Mini status pip */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#5046e5] border-2 border-white rounded-full" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base font-bold text-[#131b2e]">
                      {user.nickname}
                    </span>
                  </div>
                  <p className="text-xs text-[#777587]">
                    {user.email || '@clipsort_user'}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#777587] text-[20px]">
                chevron_right
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: 화면 및 테마 (Display & Visual Configuration) */}
        <section className="space-y-1.5">
          <div className="text-xs font-semibold text-[#777587] px-1">화면</div>
          <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/40 overflow-hidden shadow-xs">
            {/* 화면 모드 설정 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('display_mode')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">
                    brightness_medium
                  </span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">화면 모드 설정</span>
              </div>
              <div className="flex items-center space-x-1 text-[#777587]">
                <span className="text-sm text-[#464555]">{displayModeLabel}</span>
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </div>
            </button>

            {/* AI 테마 컬러 설정 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('theme_color')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${themeColorHex}15`, color: themeColorHex }}
                >
                  <span className="material-symbols-outlined text-[19px]">palette</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#131b2e]">AI 테마 컬러</p>
                  <p className="text-xs text-[#777587]">
                    {themeColorName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-[#c3c0ff]"
                  style={{ backgroundColor: themeColorHex }}
                />
                <span className="text-xs font-semibold" style={{ color: themeColorHex }}>
                  선택됨
                </span>
                <span className="material-symbols-outlined text-[#777587] text-[18px]">
                  chevron_right
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* SECTION 3: 알림 및 자동화 */}
        <section className="space-y-1.5">
          <div className="text-xs font-semibold text-[#777587] px-1">알림 및 자동화</div>
          <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/40 overflow-hidden shadow-xs">
            {/* 백그라운드 링크 자동 감지 토글 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#57dffe]/20 flex items-center justify-center text-[#00687a]">
                  <span className="material-symbols-outlined text-[19px]">
                    content_paste_go
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#131b2e]">
                    백그라운드 링크 자동 감지
                  </p>
                  <p className="text-xs text-[#777587]">
                    복사된 쇼츠/릴스/영상 URL 자동 팝업
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDetectClipboard}
                  onChange={(e) => {
                    setAutoDetectClipboard(e.target.checked);
                    onShowToast(
                      e.target.checked
                        ? '백그라운드 링크 자동 감지가 켜졌습니다'
                        : '백그라운드 링크 자동 감지가 꺼졌습니다'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#c7c4d8]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5046e5]" />
              </label>
            </div>

            {/* 카테고리 자동 분류 알림 토글 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">
                    notifications_active
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#131b2e]">분류 완료 알림 푸시</p>
                  <p className="text-xs text-[#777587]">
                    AI 스마트 태그 배정 완료 시 알림
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoClassifyPush}
                  onChange={(e) => {
                    setAutoClassifyPush(e.target.checked);
                    onShowToast(
                      e.target.checked
                        ? '분류 완료 알림 푸시가 켜졌습니다'
                        : '분류 완료 알림 푸시가 꺼졌습니다'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#c7c4d8]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5046e5]" />
              </label>
            </div>

            {/* 마케팅 정보 수신 동의 토글 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">campaign</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#131b2e]">
                    마케팅 정보 수신 동의
                  </p>
                  <p className="text-xs text-[#777587]">
                    새 기능 소개 및 큐레이션 팁 (선택)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={marketingPush}
                  onChange={(e) => {
                    setMarketingPush(e.target.checked);
                    onShowToast(
                      e.target.checked
                        ? '마케팅 정보 수신에 동의하셨습니다'
                        : '마케팅 정보 수신 동의가 철회되었습니다'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#c7c4d8]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5046e5]" />
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 4: 서비스 및 정책 */}
        <section className="space-y-1.5">
          <div className="text-xs font-semibold text-[#777587] px-1">서비스</div>
          <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/40 overflow-hidden shadow-xs">
            {/* 버전 정보 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('version_info')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">info</span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">버전정보</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-[#777587] font-medium">1.0.0 (최신 버전)</span>
                <span className="material-symbols-outlined text-[#777587] text-[18px]">
                  chevron_right
                </span>
              </div>
            </button>

            {/* 이용약관 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('terms')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">
                    description
                  </span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">이용약관</span>
              </div>
              <span className="material-symbols-outlined text-[#777587] text-[18px]">
                chevron_right
              </span>
            </button>

            {/* 개인정보 처리방침 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('privacy')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">lock</span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">
                  개인정보 처리방침
                </span>
              </div>
              <span className="material-symbols-outlined text-[#777587] text-[18px]">
                chevron_right
              </span>
            </button>

            {/* 오픈소스 라이선스 고지 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('open_source')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">code</span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">
                  오픈소스 라이선스 고지
                </span>
              </div>
              <span className="material-symbols-outlined text-[#777587] text-[18px]">
                chevron_right
              </span>
            </button>

            {/* 개발팀 문의 */}
            <button
              type="button"
              onClick={() => onNavigateSubPage('contact')}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#f2f3ff] active:bg-[#eaedff] cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                  <span className="material-symbols-outlined text-[19px]">mail</span>
                </div>
                <span className="text-sm font-medium text-[#131b2e]">개발팀 문의</span>
              </div>
              <span className="material-symbols-outlined text-[#777587] text-[18px]">
                chevron_right
              </span>
            </button>

            {/* 회원탈퇴 */}
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="w-full flex items-center justify-between p-4 text-left transition-colors duration-150 hover:bg-[#ffdad6]/30 active:bg-[#ffdad6]/60 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffdad6]/50 flex items-center justify-center text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[19px]">
                    person_remove
                  </span>
                </div>
                <span className="text-sm font-medium text-[#ba1a1a]">회원탈퇴</span>
              </div>
              <span className="material-symbols-outlined text-[#ba1a1a]/60 text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-2 pb-6 text-center space-y-1">
          <p className="text-xs text-[#777587]">ClipSort AI Bookmarking System</p>
          <p className="text-[10px] text-[#c7c4d8]">
            © 2025-2026 ClipSort Inc. All rights reserved.
          </p>
        </footer>
      </div>

      {/* 회원탈퇴 확인 팝업 모달 */}
      {showWithdrawModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#ffdad6] text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[24px]">person_remove</span>
            </div>
            <h2 className="font-bold text-base text-[#ba1a1a] mb-1.5 tracking-tight">
              회원을 탈퇴하시겠습니까?
            </h2>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              탈퇴 시 저장된 모든 영상 북마크와 AI 자동 분류 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-[0.98] cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-red-700 transition-colors active:scale-[0.98] shadow-sm cursor-pointer"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
