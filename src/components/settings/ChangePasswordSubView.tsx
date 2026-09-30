import React, { useState } from 'react';

interface ChangePasswordSubViewProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
  onOpenFindPassword: () => void;
}

export const ChangePasswordSubView: React.FC<ChangePasswordSubViewProps> = ({
  onBack,
  onShowToast,
  onOpenFindPassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCnf, setShowCnf] = useState(false);

  // Validation
  const lenValid = newPassword.length >= 8 && newPassword.length <= 16;
  const comboValid =
    /[a-zA-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[^a-zA-Z0-9]/.test(newPassword);
  const matchValid = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onShowToast('현재 비밀번호를 입력해 주세요.');
      return;
    }
    if (!lenValid || !comboValid) {
      onShowToast('새 비밀번호 조건을 확인해 주세요.');
      return;
    }
    if (!matchValid) {
      onShowToast('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    onShowToast('비밀번호가 안전하게 변경되었습니다.');
    onBack();
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
        <h1 className="text-base font-bold text-[#131b2e] tracking-tight">비밀번호 변경</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="px-1 pt-4 flex flex-col">
        {/* Helper Guide Card */}
        <section className="bg-white border border-[#dae2fd]/60 rounded-2xl p-4 mb-5 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
          </div>
          <p className="text-xs text-[#464555] leading-relaxed">
            안전한 계정 관리를 위해 현재 비밀번호를 입력하고 새로운 비밀번호를 설정해 주세요.
          </p>
        </section>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Current Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e]">현재 비밀번호</label>
              <button
                type="button"
                onClick={onOpenFindPassword}
                className="text-xs text-[#5046e5] hover:underline font-semibold cursor-pointer"
              >
                비밀번호 찾기
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showCur ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                required
                className="w-full h-12 px-4 pr-11 bg-white border border-[#dae2fd] rounded-xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCur(!showCur)}
                className="absolute right-3 p-1 text-[#777587] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showCur ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#131b2e]">새 비밀번호</label>
            <div className="relative flex items-center">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="영문, 숫자, 특수문자 조합 8~16자리"
                required
                className="w-full h-12 px-4 pr-11 bg-white border border-[#dae2fd] rounded-xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 p-1 text-[#777587] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showNew ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[#777587]">
              8~16자의 영문 대/소문자, 숫자, 특수문자를 조합해 주세요.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-colors ${
                  lenValid
                    ? 'bg-[#eaedff] border-[#5046e5]/40 text-[#3625cd]'
                    : 'bg-white border-[#dae2fd]/60 text-[#777587]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={lenValid ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  check_circle
                </span>
                <span>8자리 이상 16자리 이하</span>
              </div>

              <div
                className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-colors ${
                  comboValid
                    ? 'bg-[#eaedff] border-[#5046e5]/40 text-[#3625cd]'
                    : 'bg-white border-[#dae2fd]/60 text-[#777587]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={comboValid ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  check_circle
                </span>
                <span>영문/숫자/특수문자 포함</span>
              </div>
            </div>
          </div>

          {/* 3. Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#131b2e]">비밀번호 확인</label>
            <div className="relative flex items-center">
              <input
                type={showCnf ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 한 번 더 입력하세요"
                required
                className="w-full h-12 px-4 pr-11 bg-white border border-[#dae2fd] rounded-xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCnf(!showCnf)}
                className="absolute right-3 p-1 text-[#777587] hover:text-[#131b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showCnf ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Validation Feedback */}
            {confirmPassword.length > 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold pt-1 ${
                  matchValid ? 'text-[#00687a]' : 'text-[#ba1a1a]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {matchValid ? 'check_circle' : 'error'}
                </span>
                <span>
                  {matchValid
                    ? '비밀번호가 일치합니다.'
                    : '비밀번호가 일치하지 않습니다.'}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-13 py-3 px-4 rounded-xl bg-[#5046e5] hover:bg-[#3625cd] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <span>비밀번호 변경 완료</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Security Guidance Card */}
        <section className="mt-6 p-4 rounded-2xl bg-[#f2f3ff] border border-[#dae2fd]/60 flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#131b2e]">
            <span className="material-symbols-outlined text-[16px] text-[#5046e5]">
              security
            </span>
            <span>보안 팁</span>
          </div>
          <p className="text-[#464555] leading-relaxed">
            타 사이트에서 사용하지 않는 고유한 비밀번호를 권장합니다. 정기적인 변경을 통해 귀하의 큐레이션 데이터를 안전하게 보관하세요.
          </p>
        </section>
      </main>
    </div>
  );
};
