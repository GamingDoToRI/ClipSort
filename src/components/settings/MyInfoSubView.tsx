import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import { AvatarCropModal } from './AvatarCropModal';
import { auth } from '../../lib/firebase';
import { LogIn, User, AlertTriangle, Loader2 } from 'lucide-react';

interface MyInfoSubViewProps {
  user: UserProfile;
  primaryColor?: string;
  onBack: () => void;
  onUpdateNickname: (newNick: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onShowToast: (msg: string) => void;
  onNavigateChangePassword: () => void;
  onOpenAuth?: () => void;
  onLogout: () => void;
  onDeleteAccount?: () => Promise<void>;
  onLinkKakao?: () => Promise<void>;
  onLinkGoogle?: () => Promise<void>;
}

export const MyInfoSubView: React.FC<MyInfoSubViewProps> = ({
  user,
  primaryColor = '#5046e5',
  onBack,
  onUpdateNickname,
  onUpdateAvatar,
  onShowToast,
  onNavigateChangePassword,
  onOpenAuth,
  onLogout,
  onDeleteAccount,
  onLinkKakao,
  onLinkGoogle,
}) => {
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(user.nickname);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteCheck, setConfirmDeleteCheck] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<'kakao' | 'google' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accountIdentifier = user.isLoggedIn
    ? user.email || user.uid || user.nickname
    : '게스트';

  const isKakaoLinked =
    user.provider === 'kakao' || Boolean(user.linkedProviders?.includes('kakao'));
  const isGoogleLinked =
    user.provider === 'google' || Boolean(user.linkedProviders?.includes('google'));

  const providerLabel =
    isKakaoLinked && isGoogleLinked
      ? '카카오 (Google 통합)'
      : user.provider === 'google'
      ? 'Google 간편 로그인'
      : user.provider === 'kakao'
      ? '카카오 간편 로그인'
      : '이메일 회원';

  const formattedJoinDate = (() => {
    const raw = auth.currentUser?.metadata?.creationTime;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  })();

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      onUpdateNickname(nicknameInput.trim());
      setIsEditingNick(false);
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard?.writeText(accountIdentifier);
    onShowToast(`계정 정보(${accountIdentifier})가 복사되었습니다`);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleConfirmDeleteAccount = async () => {
    if (!onDeleteAccount || isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await onDeleteAccount();
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Delete account failed:', err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g., 8MB)
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('8MB 이하의 이미지 파일만 등록할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        setCropImageSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmCrop = (croppedDataUrl: string) => {
    if (onUpdateAvatar) {
      onUpdateAvatar(croppedDataUrl);
    }
    setCropImageSrc(null);
    onShowToast('프로필 사진이 성공적으로 변경되었습니다.');
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#faf8ff]/95 backdrop-blur-md px-1 py-3 flex items-center justify-between border-b border-[#dae2fd]/40">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <h1 className="text-base font-bold text-[#131b2e] tracking-tight">내 정보</h1>
        <div className="w-10" />
      </header>

      {/* Main content */}
      <main className="px-1 pt-4 flex flex-col gap-6">
        {/* Guest Mode Notice Banner */}
        {!user.isLoggedIn && (
          <div className="bg-gradient-to-r from-[#eaedff] to-[#f2f3ff] rounded-2xl p-4 border border-[#dae2fd] shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5046e5] shadow-xs">
                <User className="w-5 h-5 text-[#5046e5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">현재 게스트 상태입니다</h3>
                <p className="text-xs text-[#777587]">회원가입/로그인 시 내 북마크를 보존할 수 있습니다</p>
              </div>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인/가입</span>
              </button>
            )}
          </div>
        )}

        {/* Hidden file input for avatar photo change */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        {/* Profile Avatar & Picture Change Section */}
        <section className="flex flex-col items-center justify-center pt-2 pb-2">
          <div className="relative">
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-[#86EFAC]/40 flex items-center justify-center shadow-xs relative overflow-hidden ring-4 ring-white">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              ) : user.isLoggedIn ? (
                <svg className="w-20 h-20 text-[#5046e5] translate-y-1" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M50 12C28 12 18 30 18 55C18 78 32 90 50 90C68 90 82 78 82 55C82 30 72 12 50 12Z" fill="#5046E5" />
                  <circle cx="39" cy="48" fill="#131B2E" r="4.5" />
                  <circle cx="61" cy="48" fill="#131B2E" r="4.5" />
                  <path d="M42 22C46 19 54 19 58 22" opacity="0.6" stroke="white" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              ) : (
                <User className="w-12 h-12 text-[#5046e5]" />
              )}
            </div>

            {/* Camera Floating Badge - Clicking this triggers photo change if logged in */}
            {user.isLoggedIn && (
              <button
                type="button"
                aria-label="프로필 사진 변경"
                title="프로필 사진 변경"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[#dae2fd] flex items-center justify-center shadow-md text-[#464555] hover:text-[#5046e5] hover:bg-[#eaedff] active:scale-90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">photo_camera</span>
              </button>
            )}
          </div>
        </section>

        {/* Account Info Form Section */}
        <section className="bg-white rounded-2xl p-2 border border-[#dae2fd]/60 shadow-xs">
          {/* Row 1: 닉네임 */}
          <div
            onClick={() => user.isLoggedIn && setIsEditingNick(true)}
            className={`flex items-center justify-between p-3.5 rounded-xl ${user.isLoggedIn ? 'hover:bg-[#f2f3ff] cursor-pointer' : ''} transition-colors`}
          >
            <span className="text-sm font-medium text-[#131b2e]">닉네임</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#131b2e]">
                {user.isLoggedIn ? user.nickname : '게스트 사용자'}
              </span>
              {user.isLoggedIn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingNick(true);
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-[#5046e5] bg-[#eaedff] hover:bg-[#dae2fd] transition-colors"
                >
                  수정
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-[#dae2fd]/30 mx-3" />

          {/* Row 2: 로그인 방식 */}
          <div
            onClick={handleCopyUserId}
            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-[#131b2e]">로그인 방식</span>
            <div className="flex items-center gap-1.5 text-xs text-[#777587]">
              <span className="font-semibold text-[#5046e5]">
                {user.isLoggedIn ? providerLabel : '게스트'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#5046e5]">content_copy</span>
            </div>
          </div>

          <div className="h-px bg-[#dae2fd]/30 mx-3" />

          {/* Row 3: 연동 이메일 */}
          <div className="flex items-center justify-between p-3.5 rounded-xl">
            <span className="text-sm font-medium text-[#131b2e]">연동 이메일</span>
            <div className="flex items-center gap-1.5 text-xs text-[#777587]">
              <span>
                {user.isLoggedIn
                  ? user.email || (user.provider === 'kakao' ? '이메일 제공 미동의 (카카오 연동)' : '이메일 미등록')
                  : '미연동(로그인 필요)'}
              </span>
            </div>
          </div>
        </section>

        {/* Linked Social Accounts & Account Merge Section */}
        {user.isLoggedIn && (onLinkKakao || onLinkGoogle) && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold text-[#777587]">연결된 소셜 계정 (계정 통합)</h2>
              <span className="text-[11px] font-semibold text-[#5046e5]">카카오 대표 계정 기준</span>
            </div>
            <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/30 overflow-hidden shadow-xs">
              {/* Kakao Row */}
              <div className="flex items-center justify-between p-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FEE500] text-[#191919] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.46 2 10.72c0 2.74 1.82 5.14 4.55 6.49-.16.58-.58 2.1-.67 2.43-.11.42.15.41.32.3.13-.09 2.09-1.42 2.94-2 .91.14 1.87.21 2.86.21 5.52 0 10-3.46 10-7.43C22 6.46 17.52 3 12 3z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#131b2e]">카카오</p>
                    <p className="text-[11px] text-[#777587] truncate">
                      {isKakaoLinked
                        ? user.linkedEmails?.kakao || '대표 계정으로 연결됨'
                        : '연결 시 카카오 계정이 대표 계정이 됩니다'}
                    </p>
                  </div>
                </div>
                {isKakaoLinked ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0">
                    대표 · 연결됨
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(linkingProvider)}
                    onClick={async () => {
                      if (!onLinkKakao || linkingProvider) return;
                      setLinkingProvider('kakao');
                      try {
                        await onLinkKakao();
                      } finally {
                        setLinkingProvider(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    {linkingProvider === 'kakao' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>연결 중...</span>
                      </>
                    ) : (
                      <span>카카오 연결·병합</span>
                    )}
                  </button>
                )}
              </div>

              {/* Google Row */}
              <div className="flex items-center justify-between p-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#131b2e]">Google</p>
                    <p className="text-[11px] text-[#777587] truncate">
                      {isGoogleLinked
                        ? user.linkedEmails?.google || (user.provider === 'google' ? user.email : '통합 연결됨')
                        : '이메일이 달라도 Google 보관함을 하나로 병합'}
                    </p>
                  </div>
                </div>
                {isGoogleLinked ? (
                  <span className="px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#5046e5] border border-[#dae2fd] text-[11px] font-bold shrink-0">
                    연결됨
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(linkingProvider)}
                    onClick={async () => {
                      if (!onLinkGoogle || linkingProvider) return;
                      setLinkingProvider('google');
                      try {
                        await onLinkGoogle();
                      } finally {
                        setLinkingProvider(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#131b2e] border border-[#dadce0] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    {linkingProvider === 'google' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>연결 중...</span>
                      </>
                    ) : (
                      <span>Google 연결·병합</span>
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#777587] px-1 leading-relaxed">
              두 계정을 연결하면 기존에 각각 저장했던 영상 북마크가 하나로 합쳐지며, 이후 Google과 카카오 중 어느 쪽으로 로그인해도 동일한 보관함이 열립니다.
            </p>
          </section>
        )}

        {/* Security & Actions Section */}
        {user.isLoggedIn ? (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-[#777587] px-1">보안 및 변경</h2>
            <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/30 overflow-hidden shadow-xs">
              {/* 비밀번호 변경 (이메일 가입 회원에게만 노출) */}
              {(!user.provider || user.provider === 'email') && (
                <div
                  onClick={onNavigateChangePassword}
                  className="flex items-center justify-between p-3.5 hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555]">
                      <span className="material-symbols-outlined text-[19px]">lock_reset</span>
                    </div>
                    <span className="text-sm font-medium text-[#131b2e]">비밀번호 변경</span>
                  </div>
                  <span className="material-symbols-outlined text-[#777587] text-[20px]">
                    chevron_right
                  </span>
                </div>
              )}

              {/* 로그아웃 */}
              <div
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-between p-3.5 hover:bg-[#f2f3ff] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#464555] group-hover:text-[#ba1a1a] transition-colors">
                    <span className="material-symbols-outlined text-[19px]">logout</span>
                  </div>
                  <span className="text-sm font-medium text-[#131b2e]">로그아웃</span>
                </div>
                <span className="material-symbols-outlined text-[#777587] text-[20px]">
                  chevron_right
                </span>
              </div>

              {/* 회원 탈퇴 */}
              <div
                onClick={() => {
                  setConfirmDeleteCheck(false);
                  setShowDeleteModal(true);
                }}
                className="flex items-center justify-between p-3.5 hover:bg-rose-50/70 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 transition-colors">
                    <span className="material-symbols-outlined text-[19px]">person_remove</span>
                  </div>
                  <span className="text-sm font-medium text-rose-600">회원 탈퇴</span>
                </div>
                <span className="material-symbols-outlined text-rose-300 text-[20px]">
                  chevron_right
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn className="w-4 h-4" />
              <span>로그인 및 회원가입 진행하기</span>
            </button>
          </section>
        )}

        {/* Account Metadata */}
        {user.isLoggedIn && formattedJoinDate && (
          <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-[#777587]">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>가입일 {formattedJoinDate}</span>
          </div>
        )}
      </main>

      {/* 닉네임 수정 바텀시트 / 모달 */}
      {isEditingNick && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsEditingNick(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 shadow-2xl max-w-xs mx-auto w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[#131b2e] mb-3">닉네임 변경</h3>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="새로운 닉네임 입력"
              maxLength={12}
              className="w-full px-3 py-2.5 rounded-xl border border-[#dae2fd] text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5] mb-4 bg-[#f2f3ff]/50"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e] hover:bg-[#eaedff]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNickname}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 이미지 크롭 모달 */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          primaryColor={primaryColor}
          onCancel={() => setCropImageSrc(null)}
          onConfirm={handleConfirmCrop}
        />
      )}

      {/* 로그아웃 확인 팝업 모달 */}
      {showLogoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#eaedff] text-[#5046e5]">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <h2 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              로그아웃 하시겠습니까?
            </h2>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              로그아웃 시 현재 기기에서의 자동 동기화 및 링크 감지 기능이 일시 중단됩니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-[0.98] cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-[#93000a] transition-colors active:scale-[0.98] shadow-sm cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 팝업 모달 */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto text-center w-full border border-rose-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl p-3 mx-auto mb-3.5 flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-200/60 shadow-xs">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h2 className="font-bold text-lg text-[#131b2e] mb-1.5 tracking-tight">
              정말 회원 탈퇴하시겠습니까?
            </h2>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-left my-4 space-y-2">
              <p className="text-xs font-semibold text-rose-800 leading-snug">
                ⚠️ 탈퇴 시 다음 데이터가 영구적으로 삭제됩니다:
              </p>
              <ul className="text-[11px] text-rose-700 space-y-1 list-disc list-inside">
                <li>클라우드에 저장된 모든 영상 북마크 데이터</li>
                <li>사용자 생성 커스텀 카테고리 및 분류 설정</li>
                <li>휴지통 임시 보관 데이터 및 계정 프로필</li>
              </ul>
              <p className="text-[11px] text-rose-600/90 font-medium pt-1">
                ※ 삭제된 데이터는 어떤 경우에도 복구할 수 없습니다.
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-left cursor-pointer mb-5 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
              <input
                type="checkbox"
                checked={confirmDeleteCheck}
                onChange={(e) => setConfirmDeleteCheck(e.target.checked)}
                disabled={isDeletingAccount}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5 accent-rose-600 cursor-pointer"
              />
              <span className="text-xs text-[#464555] font-medium leading-tight">
                위 주의사항을 모두 확인하였으며, 모든 데이터의 영구 삭제 및 회원 탈퇴에 동의합니다.
              </span>
            </label>

            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!confirmDeleteCheck || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>데이터 삭제 중...</span>
                  </>
                ) : (
                  <span>탈퇴 및 데이터 삭제</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
