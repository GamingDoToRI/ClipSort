import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import { AvatarCropModal } from './AvatarCropModal';

interface MyInfoSubViewProps {
  user: UserProfile;
  primaryColor?: string;
  onBack: () => void;
  onUpdateNickname: (newNick: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onShowToast: (msg: string) => void;
  onNavigateChangePassword: () => void;
  onLogout: () => void;
}

export const MyInfoSubView: React.FC<MyInfoSubViewProps> = ({
  user,
  primaryColor = '#5046e5',
  onBack,
  onUpdateNickname,
  onUpdateAvatar,
  onShowToast,
  onNavigateChangePassword,
  onLogout,
}) => {
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(user.nickname);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      onUpdateNickname(nicknameInput.trim());
      setIsEditingNick(false);
      onShowToast('닉네임이 성공적으로 변경되었습니다');
    }
  };

  const handleCopyUserId = () => {
    navigator.clipboard?.writeText('@clipsort_user');
    onShowToast('아이디(@clipsort_user)가 복사되었습니다');
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
    onShowToast('로그아웃 되었습니다.');
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
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Open crop modal to choose circular area
        setCropImageSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value to allow re-uploading the same file if needed
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
              ) : (
                <svg className="w-20 h-20 text-[#5046e5] translate-y-1" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M50 12C28 12 18 30 18 55C18 78 32 90 50 90C68 90 82 78 82 55C82 30 72 12 50 12Z" fill="#5046E5" />
                  <circle cx="39" cy="48" fill="#131B2E" r="4.5" />
                  <circle cx="61" cy="48" fill="#131B2E" r="4.5" />
                  <path d="M42 22C46 19 54 19 58 22" opacity="0.6" stroke="white" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              )}
            </div>

            {/* Camera Floating Badge - Clicking this triggers photo change */}
            <button
              type="button"
              aria-label="프로필 사진 변경"
              title="프로필 사진 변경"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[#dae2fd] flex items-center justify-center shadow-md text-[#464555] hover:text-[#5046e5] hover:bg-[#eaedff] active:scale-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">photo_camera</span>
            </button>
          </div>
        </section>

        {/* Account Info Form Section */}
        <section className="bg-white rounded-2xl p-2 border border-[#dae2fd]/60 shadow-xs">
          {/* Row 1: 닉네임 */}
          <div
            onClick={() => setIsEditingNick(true)}
            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-[#131b2e]">닉네임</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#131b2e]">{user.nickname}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNick(true);
                }}
                className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#eaedff] text-[#5046e5] hover:bg-[#dae2fd] transition-colors"
              >
                수정
              </button>
            </div>
          </div>

          <div className="h-px bg-[#dae2fd]/30 mx-3" />

          {/* Row 2: 아이디 */}
          <div
            onClick={handleCopyUserId}
            className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-[#131b2e]">아이디</span>
            <div className="flex items-center gap-1.5 text-xs text-[#777587]">
              <span>@clipsort_user</span>
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </div>
          </div>

          <div className="h-px bg-[#dae2fd]/30 mx-3" />

          {/* Row 3: 연동 이메일 */}
          <div className="flex items-center justify-between p-3.5 rounded-xl">
            <span className="text-sm font-medium text-[#131b2e]">연동 이메일</span>
            <div className="flex items-center gap-1.5 text-xs text-[#777587]">
              <span>{user.email || 'clipsort_user@gmail.com'}</span>
            </div>
          </div>
        </section>

        {/* Security & Actions Section */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[#777587] px-1">보안 및 변경</h2>
          <div className="bg-white rounded-2xl border border-[#dae2fd]/60 divide-y divide-[#dae2fd]/30 overflow-hidden shadow-xs">
            {/* 비밀번호 변경 */}
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

            {/* 로그아웃 (비밀번호 변경 하단 배치) */}
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
          </div>
        </section>

        {/* Account Metadata */}
        <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-[#777587]">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          <span>가입일 2025.01.15</span>
        </div>
      </main>

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
                className="w-full py-3 rounded-xl bg-[#5046e5] text-white font-semibold text-xs hover:bg-[#3625cd] transition-colors active:scale-[0.98] shadow-sm cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 닉네임 수정 모달 Sheet */}
      {isEditingNick && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="w-full max-w-xl bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-9 h-1 bg-[#CBD5E1] rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#131b2e]">닉네임 변경</h3>
              <button
                type="button"
                onClick={() => setIsEditingNick(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#777587] hover:bg-[#f2f3ff]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-[#777587]">ClipSort에서 사용할 닉네임을 입력해 주세요.</p>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={15}
                autoFocus
                className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#dae2fd] rounded-xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
              />
              <span className="text-[11px] text-[#777587] text-right">최대 15자</span>
            </div>
            <button
              type="button"
              onClick={handleSaveNickname}
              className="w-full py-3.5 bg-[#5046e5] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#3625cd] transition-all cursor-pointer"
            >
              저장하기
            </button>
          </div>
        </div>
      )}

      {/* 프로필 사진 영역 선택 모달 (Circular Crop) */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          primaryColor={primaryColor}
          onConfirm={handleConfirmCrop}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};
