import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  RotateCw,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { AuthScreenType, UserProfile } from '../../types';

interface AuthFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthFlowModal: React.FC<AuthFlowModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [screen, setScreen] = useState<AuthScreenType>('email_step1');

  // Step 1 state
  const [emailUser, setEmailUser] = useState('creator.vision');
  const [selectedDomain, setSelectedDomain] = useState('@gmail.com');
  const [allAgreed, setAllAgreed] = useState(false);
  const [terms, setTerms] = useState({
    age: true,
    service: true,
    privacy: true,
    marketing: false,
  });

  // Step 2 state (OTP)
  const [otp, setOtp] = useState(['8', '3', '7', '9', '1', '']);
  const [timerSeconds, setTimerSeconds] = useState(225); // 03:45

  // Step 4 state (Password)
  const [nickname, setNickname] = useState('클립마스터');
  const [password, setPassword] = useState('Clipsort2025!#');
  const [passwordConfirm, setPasswordConfirm] = useState('Clipsort2025!#');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Social states
  const [appleHideEmail, setAppleHideEmail] = useState(true);
  const [kakaoTerms, setKakaoTerms] = useState({
    email: true,
    profile: true,
    alarm: false,
  });

  // Countdown timer for OTP
  useEffect(() => {
    if (screen !== 'email_step2') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  if (!isOpen) return null;

  const fullEmail = emailUser.includes('@') ? emailUser : `${emailUser}${selectedDomain}`;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleAllTerms = () => {
    const nextVal = !allAgreed;
    setAllAgreed(nextVal);
    setTerms({
      age: nextVal,
      service: nextVal,
      privacy: nextVal,
      marketing: nextVal,
    });
  };

  const handleCompleteEmailSignup = () => {
    onLoginSuccess({
      isLoggedIn: true,
      nickname: nickname || '클립마스터',
      email: fullEmail,
      provider: 'email',
    });
    onClose();
  };

  const handleKakaoLogin = () => {
    onLoginSuccess({
      isLoggedIn: true,
      nickname: '김클립',
      email: 'clip_kim@kakao.com',
      provider: 'kakao',
    });
    onClose();
  };

  const handleGoogleLogin = () => {
    onLoginSuccess({
      isLoggedIn: true,
      nickname: 'Alex Kim',
      email: 'creator.alex@gmail.com',
      provider: 'google',
    });
    onClose();
  };

  const handleAppleLogin = () => {
    onLoginSuccess({
      isLoggedIn: true,
      nickname: '김클립',
      email: appleHideEmail ? 'privaterelay@appleid.com' : 'alex.kim@icloud.com',
      provider: 'apple',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Outer Shell */}
      <div className="w-full max-w-sm sm:max-w-md bg-[#faf8ff] rounded-3xl shadow-2xl border border-[#dae2fd] overflow-hidden my-auto flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Quick Nav Bar between 7 uploaded screens */}
        <div className="bg-[#eaedff] px-3 py-2 border-b border-[#dae2fd] flex items-center justify-between text-[11px] overflow-x-auto no-scrollbar">
          <span className="font-bold text-[#3625cd] shrink-0 mr-1">화면 전환:</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setScreen('email_direct_login')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'email_direct_login' ? 'bg-[#5046e5] text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setScreen('find_password')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'find_password' || screen === 'reset_password_step' ? 'bg-[#5046e5] text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              PW찾기
            </button>
            <button
              onClick={() => setScreen('email_step1')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'email_step1' ? 'bg-[#5046e5] text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              1/4
            </button>
            <button
              onClick={() => setScreen('email_step2')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'email_step2' ? 'bg-[#5046e5] text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              2/4
            </button>
            <button
              onClick={() => setScreen('email_step4')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'email_step4' ? 'bg-[#5046e5] text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              4/4
            </button>
            <button
              onClick={() => setScreen('kakao_login')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'kakao_login' ? 'bg-[#FEE500] text-black' : 'text-[#464555] hover:bg-white'
              }`}
            >
              카카오
            </button>
            <button
              onClick={() => setScreen('google_select')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'google_select' || screen === 'google_consent'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#464555] hover:bg-white'
              }`}
            >
              구글
            </button>
            <button
              onClick={() => setScreen('apple_login')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                screen === 'apple_login' ? 'bg-black text-white' : 'text-[#464555] hover:bg-white'
              }`}
            >
              Apple
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777587] hover:text-[#131b2e] ml-2 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCREEN 0: 이메일로 로그인 (직접 로그인) */}
        {screen === 'email_direct_login' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Top Navigation */}
              <div className="flex items-center justify-between pb-3">
                <button
                  onClick={() => setScreen('email_step1')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">이메일 로그인</h1>
                <div className="w-10" />
              </div>

              {/* Brand Identity / Greeting Section */}
              <section className="mt-2 mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#3625cd] mb-3">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span className="text-xs font-semibold tracking-wide">ClipSort AI</span>
                </div>
                <h2 className="text-2xl font-bold text-[#131b2e] tracking-tight mb-2 leading-tight">
                  반가워요!<br />계정 정보를 입력해 주세요
                </h2>
                <p className="text-xs text-[#777587] leading-relaxed">
                  ClipSort에 등록한 이메일과 비밀번호를 입력해주세요.
                </p>
              </section>

              {/* Input Form Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCompleteEmailSignup();
                }}
                className="space-y-4"
              >
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#131b2e]">이메일</label>
                  <input
                    type="email"
                    value={emailUser.includes('@') ? emailUser : `${emailUser}@clipsort.io`}
                    onChange={(e) => setEmailUser(e.target.value)}
                    placeholder="example@clipsort.io"
                    required
                    className="w-full h-12 px-4 bg-white text-[#131b2e] text-sm rounded-xl border border-[#dae2fd] focus:border-[#5046e5] focus:outline-none transition-all"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#131b2e]">비밀번호</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                      className="w-full h-12 px-4 pr-11 bg-white text-[#131b2e] text-sm rounded-xl border border-[#dae2fd] focus:border-[#5046e5] focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 text-[#777587] hover:text-[#131b2e] p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Utility Options */}
                <div className="flex items-center justify-between text-xs pt-1 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded text-[#5046e5]"
                    />
                    <span className="text-[#464555]">로그인 상태 유지</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setScreen('find_password')}
                    className="text-[#5046e5] font-semibold hover:underline"
                  >
                    비밀번호 찾기
                  </button>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-13 bg-[#5046e5] hover:bg-[#3625cd] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>로그인</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <footer className="mt-6 text-center text-xs text-[#777587]">
              아직 계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => setScreen('email_step1')}
                className="text-[#5046e5] font-bold hover:underline ml-1"
              >
                회원가입하기
              </button>
            </footer>
          </div>
        )}

        {/* SCREEN: 비밀번호 찾기 */}
        {screen === 'find_password' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <button
                  onClick={() => setScreen('email_direct_login')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">비밀번호 찾기</h1>
                <div className="w-10" />
              </div>

              {/* Banner */}
              <section className="bg-[#f2f3ff] border border-[#dae2fd]/60 rounded-xl p-3.5 flex items-start gap-3 my-3">
                <div className="w-9 h-9 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    vpn_key
                  </span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#131b2e]">계정 인증 안내</h2>
                  <p className="text-[11px] text-[#777587] mt-0.5 leading-relaxed">
                    가입 시 등록한 이메일 주소를 입력하시면 비밀번호 재설정 인증번호를 보내드립니다.
                  </p>
                </div>
              </section>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setScreen('reset_password_step');
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#131b2e] block">이메일 주소</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailUser.includes('@') ? emailUser : `${emailUser}@clipsort.io`}
                      onChange={(e) => setEmailUser(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                    />
                    <button
                      type="button"
                      onClick={() => alert('인증번호가 재전송되었습니다.')}
                      className="px-3 py-2 rounded-xl bg-[#eaedff] text-xs font-bold text-[#3625cd] hover:bg-[#dae2fd]"
                    >
                      재전송
                    </button>
                  </div>
                  <p className="text-[11px] text-[#00687a] flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    인증번호 6자리가 이메일로 발송되었습니다.
                  </p>
                </div>

                {/* Verification Code */}
                <div className="bg-white border border-[#dae2fd] rounded-xl p-3.5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#131b2e]">인증번호 입력</label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[13px]">timer</span>
                      03:00
                    </span>
                  </div>
                  <input
                    type="text"
                    defaultValue="849201"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#f2f3ff] border border-[#5046e5] text-center font-bold tracking-widest text-[#131b2e] text-lg focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#777587] pt-1">
                    <span>인증번호가 오지 않나요?</span>
                    <button
                      type="button"
                      onClick={() => alert('새 인증번호가 발송되었습니다')}
                      className="text-[#5046e5] font-bold hover:underline"
                    >
                      인증번호 재전송
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>다음 (비밀번호 재설정)</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            </div>

            {/* Help */}
            <div className="mt-4 pt-3 border-t border-[#dae2fd]/40 text-center text-xs text-[#777587]">
              <span>이메일이 기억나지 않으시나요? </span>
              <button
                type="button"
                onClick={() => alert('고객센터: support@clipsort.io')}
                className="text-[#5046e5] font-bold hover:underline"
              >
                개발팀 문의하기
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: 새 비밀번호 재설정 (비밀번호 찾기 2단계) */}
        {screen === 'reset_password_step' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3">
                <button
                  onClick={() => setScreen('find_password')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">비밀번호 재설정</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eaedff] text-[#5046e5] font-bold">
                  인증 완료
                </span>
              </div>

              {/* Info banner */}
              <section className="bg-[#f2f3ff] rounded-xl p-3 border border-[#dae2fd]/60 flex items-start gap-2.5 my-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#5046e5] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#131b2e]">새 비밀번호 입력</h2>
                  <p className="text-[11px] text-[#777587]">
                    본인 인증이 완료되어 새 비밀번호로 즉시 변경됩니다.
                  </p>
                </div>
              </section>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인합니다.');
                  handleCompleteEmailSignup();
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#131b2e]">새 비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="영문, 숫자, 특수문자 조합 8~16자리"
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#dae2fd] text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                  />
                  <div className="flex gap-2 pt-1">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#eaedff] text-[#3625cd] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> 8자리 이상 16자리 이하
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#eaedff] text-[#3625cd] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> 영문/숫자/특수문자
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#131b2e]">비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="새 비밀번호를 한 번 더 입력하세요"
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white border border-[#5046e5] text-sm text-[#131b2e] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#00687a] font-semibold flex items-center gap-1 pt-1">
                    <Check className="w-3 h-3" /> 새 비밀번호와 일치합니다.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>비밀번호 재설정 완료</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[#f2f3ff] text-[11px] text-[#777587]">
              보안 팁: 타 사이트에서 사용하지 않는 고유한 비밀번호를 권장합니다.
            </div>
          </div>
        )}

        {/* SCREEN 1: 회원가입 1/4 (Image 3) */}
        {screen === 'email_step1' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <button onClick={onClose} className="p-1 text-[#131b2e]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-bold text-[#131b2e]">회원가입</h2>
                <span className="text-xs font-bold text-[#5046e5]">1/4</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-[#eaedff] rounded-full overflow-hidden mb-4">
                <div className="w-1/4 h-full bg-[#5046e5]" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#3625cd] text-xs font-semibold mb-3">
                <span>⚡ Kinetic Fast-Onboarding</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#131b2e] leading-snug mb-1">
                로그인에 사용할<br />이메일을 입력해 주세요
              </h1>
              <p className="text-xs text-[#777587] mb-5">
                계정 분실 시 본인 확인 및 안내 메일 발송에 사용됩니다.
              </p>

              {/* Email Input */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[#131b2e] block mb-1.5">이메일 주소</label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailUser}
                    onChange={(e) => setEmailUser(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#dae2fd] rounded-2xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                  />
                  {emailUser && (
                    <button
                      onClick={() => setEmailUser('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777587] hover:text-[#131b2e]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Recommendation domains */}
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] text-[#777587] shrink-0">추천 도메인</span>
                  {['@gmail.com', '@naver.com', '@kakao.com', '@icloud.com'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const base = emailUser.split('@')[0];
                        setEmailUser(base + domain);
                        setSelectedDomain(domain);
                      }}
                      className="px-2.5 py-1 rounded-full border border-[#dae2fd] bg-white text-xs text-[#464555] hover:border-[#5046e5] hover:text-[#3625cd] shrink-0"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox Card */}
              <div className="p-4 rounded-2xl bg-[#f2f3ff]/70 border border-[#dae2fd] space-y-3 mb-6">
                <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-[#dae2fd]">
                  <input
                    type="checkbox"
                    checked={allAgreed}
                    onChange={handleToggleAllTerms}
                    className="w-4 h-4 rounded text-[#5046e5] focus:ring-0"
                  />
                  <span className="text-sm font-bold text-[#131b2e]">약관 전체 동의하기</span>
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={terms.age}
                        onChange={(e) => setTerms({ ...terms, age: e.target.checked })}
                        className="w-4 h-4 rounded text-[#5046e5]"
                      />
                      <span className="text-[#131b2e]"><strong>[필수]</strong> 만 14세 이상입니다</span>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={terms.service}
                        onChange={(e) => setTerms({ ...terms, service: e.target.checked })}
                        className="w-4 h-4 rounded text-[#5046e5]"
                      />
                      <span className="text-[#131b2e]"><strong>[필수]</strong> 서비스 이용약관 동의</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#777587]" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={terms.privacy}
                        onChange={(e) => setTerms({ ...terms, privacy: e.target.checked })}
                        className="w-4 h-4 rounded text-[#5046e5]"
                      />
                      <span className="text-[#131b2e]"><strong>[필수]</strong> 개인정보 수집 및 이용 동의</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#777587]" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={terms.marketing}
                        onChange={(e) => setTerms({ ...terms, marketing: e.target.checked })}
                        className="w-4 h-4 rounded text-[#5046e5]"
                      />
                      <span className="text-[#777587]">[선택] 신규 기능 및 맞춤 추천 알림 수신 동의</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#777587]" />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setScreen('email_step2')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all"
              >
                <span>인증번호 받기</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-xs text-[#777587]">
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => setScreen('email_step4')}
                    className="text-[#5046e5] font-bold underline underline-offset-2 ml-1"
                  >
                    로그인
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: 회원가입 2/4 (Image 5) */}
        {screen === 'email_step2' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <button onClick={() => setScreen('email_step1')} className="p-1 text-[#131b2e]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-bold text-[#131b2e]">회원가입</h2>
                <span className="text-xs font-bold text-[#5046e5]">2/4</span>
              </div>
              <div className="w-full h-1 bg-[#eaedff] rounded-full overflow-hidden mb-4">
                <div className="w-2/4 h-full bg-[#5046e5]" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#3625cd] text-xs font-semibold mb-3">
                <span>✉️ 이메일 본인인증</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#131b2e] leading-snug mb-1">
                인증번호를<br />입력해 주세요
              </h1>
              <p className="text-xs text-[#464555] mb-1">
                <strong>{fullEmail}</strong> 으로 전송된 6자리 번호를 5분 이내에 입력해 주세요.
              </p>
              <button
                onClick={() => setScreen('email_step1')}
                className="text-xs text-[#5046e5] font-semibold underline mb-6"
              >
                이메일 주소 변경 ✏️
              </button>

              {/* 6 Digit Boxes */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[idx] = e.target.value;
                      setOtp(newOtp);
                    }}
                    className="w-full h-14 text-center text-xl font-bold bg-white border-2 border-[#5046e5] rounded-xl text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20"
                  />
                ))}
              </div>

              {/* Timer row */}
              <div className="flex items-center justify-between text-xs mb-6">
                <span className="font-bold text-[#5046e5] flex items-center gap-1">
                  ⏱️ {formatTimer(timerSeconds)} 남음
                </span>
                <span className="text-[#777587]">
                  인증번호가 오지 않나요?{' '}
                  <button
                    type="button"
                    onClick={() => setTimerSeconds(300)}
                    className="text-[#5046e5] font-bold underline"
                  >
                    다시 보내기
                  </button>
                </span>
              </div>

              {/* Info Notice */}
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#dae2fd] flex items-start gap-2.5 text-xs text-[#464555]">
                <span className="text-[#5046e5] font-bold text-sm">ℹ️</span>
                <p>메일이 도착하지 않았을 경우 스팸 메일함이나 정크 메일함을 확인해 주세요.</p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={() => setScreen('email_step4')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all"
              >
                <span>다음</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: 회원가입 4/4 (Image 9) */}
        {screen === 'email_step4' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <button onClick={() => setScreen('email_step2')} className="p-1 text-[#131b2e]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#131b2e]">회원가입</h2>
                  <span className="text-xs text-[#5046e5] font-semibold">단계 4/4</span>
                </div>
                <span className="text-xs text-[#777587]">비밀번호 설정</span>
              </div>
              <div className="w-full h-1 bg-[#eaedff] rounded-full overflow-hidden mb-4">
                <div className="w-full h-full bg-[#5046e5]" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] text-[#3625cd] text-xs font-semibold mb-3">
                <span>🛡️ 보안 인증 단계</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#131b2e] leading-snug mb-1">
                마지막 단계예요<br />비밀번호를 설정해주세요.
              </h1>
              <p className="text-xs text-[#777587] mb-5">
                영문, 숫자, 특수문자를 포함한 8~16자리로 입력해 주세요.
              </p>

              {/* Nickname input */}
              <div className="mb-3.5">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#131b2e]">닉네임</label>
                  <span className="text-[11px] text-[#777587]">한글, 영문, 숫자 2~10자</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#dae2fd] rounded-2xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                  />
                  {nickname && (
                    <button
                      onClick={() => setNickname('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777587]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Password input */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#131b2e]">비밀번호</label>
                  <span className="text-[11px] text-[#5046e5] font-semibold">안전한 강도</span>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#dae2fd] rounded-2xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#777587]">
                    <button type="button" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security conditions chips */}
              <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#dae2fd] flex items-center justify-between text-[11px] text-[#3625cd] font-semibold mb-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5046e5]" /> 8자리 이상 16자리 이하
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5046e5]" /> 영문/숫자/특수문자 포함
                </span>
              </div>

              {/* Password confirm input */}
              <div className="mb-2">
                <label className="text-xs font-bold text-[#131b2e] block mb-1">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#5046e5] rounded-2xl text-sm text-[#131b2e] focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#5046e5]">
                    <CheckCircle2 className="w-4 h-4" />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                      {showConfirmPw ? <EyeOff className="w-4 h-4 text-[#777587]" /> : <Eye className="w-4 h-4 text-[#777587]" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#5046e5] font-semibold mt-1 flex items-center gap-1">
                  ✓ 비밀번호가 일치합니다.
                </p>
              </div>

              {/* End-to-end encryption note */}
              <div className="p-3 rounded-2xl bg-white border border-[#dae2fd] flex items-center gap-2 text-[11px] text-[#464555]">
                <Shield className="w-4 h-4 text-[#5046e5] shrink-0" />
                <p className="truncate">ClipSort는 강화된 종단간 암호화 기술로 사용자의 북마크를 보호합니다.</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={handleCompleteEmailSignup}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all"
              >
                <span>이메일로 로그인하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-[#777587]">
                가입 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 4: 카카오계정 로그인 모달 (Image 11) */}
        {screen === 'kakao_login' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f3ff]">
                <button onClick={() => setScreen('email_step1')} className="p-1 text-[#131b2e]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 text-sm font-bold text-[#131b2e]">
                  <span>🔒 카카오계정 로그인</span>
                </div>
                <button onClick={onClose} className="p-1 text-[#777587]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* App Lockup */}
              <div className="py-4 text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-[#5046e5] relative flex items-center justify-center text-white shadow-md">
                  <span className="text-2xl">✨</span>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FEE500] flex items-center justify-center text-black text-xs font-bold">
                    💬
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[#131b2e]">ClipSort</h2>
                <p className="text-xs text-[#464555] mt-1">
                  ClipSort에서 사용자의 카카오계정 정보를 요청합니다.
                </p>
              </div>

              {/* User Preview Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#dae2fd] flex items-center justify-between mb-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-base font-bold text-amber-800">
                    김
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#131b2e]">김클립</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#eaedff] text-[#5046e5] font-semibold">
                        간편로그인
                      </span>
                    </div>
                    <span className="text-xs text-[#777587]">clip_kim@kakao.com</span>
                  </div>
                </div>
                <button className="text-xs font-semibold text-[#5046e5] hover:underline">
                  다른 계정
                </button>
              </div>

              {/* Consent Box */}
              <div className="p-4 rounded-2xl bg-white border border-[#dae2fd] space-y-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-[#dae2fd]">
                  <input
                    type="checkbox"
                    checked={kakaoTerms.email && kakaoTerms.profile}
                    onChange={(e) =>
                      setKakaoTerms({
                        email: e.target.checked,
                        profile: e.target.checked,
                        alarm: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span className="text-xs font-bold text-[#131b2e]">
                    전체 동의하기 <span className="font-normal text-[#777587]">(선택 항목 포함)</span>
                  </span>
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kakaoTerms.email}
                      onChange={(e) => setKakaoTerms({ ...kakaoTerms, email: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#131b2e]">[필수]</span> 카카오계정(이메일) 제공 동의
                      <p className="text-[11px] text-[#777587]">북마크 동기화 및 계정 식별 목적으로 활용됩니다.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kakaoTerms.profile}
                      onChange={(e) => setKakaoTerms({ ...kakaoTerms, profile: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-[#131b2e]">[필수]</span> 프로필 정보(닉네임/사진) 제공 동의
                      <p className="text-[11px] text-[#777587]">ClipSort 내 사용자 맞춤 큐레이션 표시용</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-[#f2f3ff] rounded-xl text-[11px] text-[#777587] leading-relaxed">
                동의 항목은 카카오 개인정보 제3자 제공 동의 정책에 따라 안전하게 전송되며, 서비스 탈퇴 시 파기됩니다.
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FEE500] text-[#191919] font-bold text-sm shadow-md hover:bg-[#ebd300] flex items-center justify-center gap-2 transition-all"
              >
                <span>💬 동의하고 계속하기</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-[#777587] hover:text-[#131b2e]"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5 & 6: Google 계정 선택 & 동의 모달 (Image 13 & 15) */}
        {(screen === 'google_select' || screen === 'google_consent') && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Browser style chrome */}
              <div className="flex items-center justify-between pb-3 border-b border-[#dae2fd]">
                <button onClick={onClose} className="p-1 text-[#777587]">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#dae2fd] rounded-full text-xs text-[#464555]">
                  <span>🔒 accounts.google.com</span>
                </div>
                <div className="flex items-center gap-1 text-[#777587]">
                  <RotateCw className="w-4 h-4" />
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Google G logo */}
              <div className="py-4 text-center">
                <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                </svg>

                {screen === 'google_select' ? (
                  <>
                    <h2 className="text-xl font-bold text-[#131b2e]">계정 선택</h2>
                    <p className="text-xs text-[#5046e5] font-semibold mt-0.5">
                      ClipSort 앱으로 계속 이동합니다
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-[#131b2e]">ClipSort 앱에 로그인</h2>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-[#eaedff] text-[#5046e5] text-xs font-semibold">
                      <span>✨ ClipSort 서비스로 연결됩니다</span>
                    </div>
                  </>
                )}
              </div>

              {screen === 'google_select' ? (
                /* Account Select List (Image 13) */
                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => setScreen('google_consent')}
                    className="w-full p-3 rounded-2xl bg-white border border-[#dae2fd] hover:border-[#5046e5] flex items-center justify-between text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5046e5] text-white font-bold flex items-center justify-center relative">
                        A
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute bottom-0 right-0 border-2 border-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#131b2e]">Alex Kim</span>
                          <span className="text-[10px] bg-[#eaedff] text-[#5046e5] px-1.5 py-0.5 rounded font-semibold">
                            현재 로그인
                          </span>
                        </div>
                        <span className="text-xs text-[#777587]">creator.alex@gmail.com</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#777587]" />
                  </button>

                  <button
                    onClick={() => setScreen('google_consent')}
                    className="w-full p-3 rounded-2xl bg-white border border-[#dae2fd] hover:border-[#5046e5] flex items-center justify-between text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center">
                        C
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#131b2e] block">Clip Team</span>
                        <span className="text-xs text-[#777587]">clip.team.work@gmail.com</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#777587]" />
                  </button>
                </div>
              ) : (
                /* Google Consent Detail (Image 15) */
                <div className="space-y-4 mb-4">
                  <div className="p-3 bg-white border border-[#dae2fd] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#5046e5] text-white font-bold flex items-center justify-center text-xs">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#131b2e] block">Alex Kim</span>
                        <span className="text-[11px] text-[#777587]">creator.alex@gmail.com</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setScreen('google_select')}
                      className="text-xs font-semibold text-[#5046e5] hover:underline"
                    >
                      계정 전환
                    </button>
                  </div>

                  <div className="p-4 bg-[#f2f3ff] rounded-2xl border border-[#dae2fd] space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#131b2e] block">기본 프로필 정보 확인</span>
                        <p className="text-[11px] text-[#777587]">사용자 이름 및 Google 프로필 사진을 가져옵니다.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#131b2e] block">이메일 주소 확인</span>
                        <p className="text-[11px] text-[#777587]">계정 식별 및 서비스 주요 알림 발송 목적으로 사용됩니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 space-y-2">
              {screen === 'google_consent' ? (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>동의하고 계속</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setScreen('google_consent')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>선택한 계정으로 계속</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-[#777587] hover:text-[#131b2e]"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 7: Apple ID로 로그인 모달 (Image 17) */}
        {screen === 'apple_login' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* iOS style top handle and close */}
              <div className="w-10 h-1 bg-[#dae2fd] rounded-full mx-auto mb-3" />
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="p-1 rounded-full bg-[#f2f3ff] text-[#777587]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Apple icon */}
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#dae2fd] flex items-center justify-center text-2xl shadow-xs mb-2">
                  
                </div>
                <h2 className="text-xl font-bold text-[#131b2e]">Apple ID로 로그인</h2>
                <p className="text-xs text-[#777587] mt-1">ClipSort에서 계정을 생성하거나 로그인합니다.</p>
              </div>

              {/* User details */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-[#dae2fd] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f2f3ff]">
                  <span className="text-[#777587]">이름</span>
                  <span className="font-bold text-[#131b2e]">김클립</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#777587]">Apple ID</span>
                  <span className="font-semibold text-[#131b2e]">alex.kim@icloud.com</span>
                </div>
              </div>

              {/* Email hide radio options */}
              <div className="mt-3 p-4 rounded-2xl bg-white border border-[#dae2fd] space-y-3">
                <label
                  onClick={() => setAppleHideEmail(true)}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    appleHideEmail ? 'border-[#5046e5] bg-[#5046e5]' : 'border-[#dae2fd]'
                  }`}>
                    {appleHideEmail && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131b2e] block">나의 이메일 가리기</span>
                    <p className="text-[11px] text-[#777587]">임의의 고유한 주소를 생성하여 실제 이메일로 전달합니다.</p>
                  </div>
                </label>

                <label
                  onClick={() => setAppleHideEmail(false)}
                  className="flex items-start gap-3 cursor-pointer pt-2 border-t border-[#f2f3ff]"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    !appleHideEmail ? 'border-[#5046e5] bg-[#5046e5]' : 'border-[#dae2fd]'
                  }`}>
                    {!appleHideEmail && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#131b2e] block">나의 이메일 공유</span>
                    <p className="text-[11px] text-[#777587]">alex.kim@icloud.com</p>
                  </div>
                </label>
              </div>

              {/* Biometrics hint */}
              <div className="mt-4 text-center">
                <span className="text-xs font-semibold text-[#5046e5] flex items-center justify-center gap-1.5">
                  <span>🙂 이중 클릭하여 계속 / Face ID로 인증</span>
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={handleAppleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-black text-white font-bold text-sm shadow-md hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-all"
              >
                <span> 계속하기</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-[#777587] hover:text-[#131b2e]"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
