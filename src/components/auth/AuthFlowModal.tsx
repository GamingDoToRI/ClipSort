import React, { useState, useEffect, useRef } from 'react';
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
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '../../lib/firebase';

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
  const [screen, setScreen] = useState<AuthScreenType>('email_direct_login');

  // Main Login screen states (matching user reference mockup)
  const [loginTab, setLoginTab] = useState<'id' | 'phone'>('id');
  const [loginId, setLoginId] = useState(() => {
    try {
      return localStorage.getItem('clipsort_saved_id') || '';
    } catch {
      return '';
    }
  });
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [saveId, setSaveId] = useState(() => {
    try {
      return Boolean(localStorage.getItem('clipsort_saved_id'));
    } catch {
      return false;
    }
  });
  const [autoLogin, setAutoLogin] = useState(() => {
    try {
      return localStorage.getItem('clipsort_auto_login') === 'true';
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);

  // Find ID states
  const [findIdName, setFindIdName] = useState('');
  const [findIdContact, setFindIdContact] = useState('');
  const [foundIdResult, setFoundIdResult] = useState<string | null>(null);

  // Reset to email_direct_login when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen('email_direct_login');
      try {
        const savedId = localStorage.getItem('clipsort_saved_id');
        if (savedId) {
          setLoginId(savedId);
          setSaveId(true);
        }
        const savedAuto = localStorage.getItem('clipsort_auto_login');
        if (savedAuto === 'true') {
          setAutoLogin(true);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Step 1 state (회원가입)
  const [emailUser, setEmailUser] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('@gmail.com');
  const [allAgreed, setAllAgreed] = useState(false);
  const [terms, setTerms] = useState({
    age: false,
    service: false,
    privacy: false,
    marketing: false,
  });

  // Step 2 state (OTP - 6자리 모두 비워진 빈칸으로 시작)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300); // 05:00
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 4 state (Password)
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Find password state
  const [findPwCode, setFindPwCode] = useState('');

  // Social states
  const [appleHideEmail, setAppleHideEmail] = useState(true);
  const [kakaoTerms, setKakaoTerms] = useState({
    email: true,
    profile: true,
    alarm: false,
  });

  // Auth submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    alert('이메일 회원가입은 서버 측 이메일 발송 및 인증 기능이 추가될 때까지 비활성화되어 있습니다. Google 로그인을 이용해 주세요.');
  };

  const handleKakaoLogin = () => {
    alert('카카오 로그인은 연동 준비 중입니다. Google 로그인 또는 이메일 로그인을 이용해 주세요.');
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      onLoginSuccess({
        isLoggedIn: true,
        uid: fbUser.uid,
        nickname: fbUser.displayName || fbUser.email?.split('@')[0] || '클립사용자',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || undefined,
        provider: 'google',
      });
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Google login error:', err);
      let msg = 'Google 로그인에 실패했습니다. 다시 시도해 주세요.';
      if (err.code === 'auth/popup-blocked') {
        msg = '팝업 차단이 활성화되어 있습니다. 브라우저의 팝업 차단을 해제하고 다시 시도해 주세요.';
      } else if (err.message) {
        msg = `Google 로그인 오류: ${err.message}`;
      }
      setAuthError(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = () => {
    alert('Apple 로그인은 연동 준비 중입니다. Google 로그인 또는 이메일 로그인을 이용해 주세요.');
  };

  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setAuthError(null);

    if (loginTab === 'phone') {
      alert('휴대폰 번호 로그인은 현재 지원 준비 중입니다. 이메일 로그인 또는 Google 로그인을 이용해 주세요.');
      return;
    }

    const idToUse = loginId.trim();
    if (!idToUse) {
      alert('아이디 또는 이메일을 입력해 주세요.');
      return;
    }
    if (!loginPassword) {
      alert('비밀번호를 입력해 주세요.');
      return;
    }

    const emailToUse = idToUse.includes('@') ? idToUse : `${idToUse}@clipsort.io`;

    setIsSubmitting(true);
    try {
      const result = await signInWithEmailAndPassword(auth, emailToUse, loginPassword);
      const fbUser = result.user;

      try {
        if (saveId) {
          localStorage.setItem('clipsort_saved_id', idToUse);
        } else {
          localStorage.removeItem('clipsort_saved_id');
        }

        if (autoLogin) {
          localStorage.setItem('clipsort_auto_login', 'true');
        } else {
          localStorage.removeItem('clipsort_auto_login');
        }
      } catch {
        // ignore
      }

      onLoginSuccess({
        isLoggedIn: true,
        uid: fbUser.uid,
        nickname: fbUser.displayName || fbUser.email?.split('@')[0] || idToUse.split('@')[0] || '클립사용자',
        email: fbUser.email || emailToUse,
        provider: 'email',
      });
      onClose();
    } catch (err: any) {
      console.error('Email login error:', err);
      let errorMsg = '로그인 중 오류가 발생했습니다.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = '등록되지 않은 계정입니다. 이메일 주소를 확인하거나 Google 로그인을 이용해 주세요.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = '유효한 이메일 형식을 입력해 주세요 (예: user@example.com).';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = '로그인 시도가 너무 많아 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.';
      } else if (err.code === 'auth/user-disabled') {
        errorMsg = '관리자에 의해 비활성화된 계정입니다.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findIdName.trim()) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (!findIdContact.trim()) {
      alert('휴대폰 번호 또는 이메일을 입력해 주세요.');
      return;
    }
    setFoundIdResult('creator.vision@gmail.com');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Outer Shell */}
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-[#dae2fd]/70 overflow-hidden my-auto flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Global Close Button (Top-Right) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#f4f5f8] hover:bg-[#eaedff] text-[#777587] hover:text-[#131b2e] flex items-center justify-center transition-all cursor-pointer"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* SCREEN 0: 로그인 메인 화면 (User requested Kolon Mall style) */}
        {screen === 'email_direct_login' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="pt-7 pb-4 px-6 text-center border-b border-[#f0f2f7]">
                <h1 className="text-xl font-bold text-[#131b2e] tracking-tight">ClipSort 로그인</h1>
              </div>

              {/* Tabs: 아이디 / 휴대폰 번호 */}
              <div className="grid grid-cols-2 border-b border-[#e5e7eb] px-6 text-center">
                <button
                  type="button"
                  onClick={() => setLoginTab('id')}
                  className={`py-3 text-sm font-bold transition-colors relative cursor-pointer ${
                    loginTab === 'id' ? 'text-[#131b2e]' : 'text-[#8c8c9a] hover:text-[#131b2e]'
                  }`}
                >
                  아이디
                  {loginTab === 'id' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#131b2e]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('phone')}
                  className={`py-3 text-sm font-bold transition-colors relative cursor-pointer ${
                    loginTab === 'phone' ? 'text-[#131b2e]' : 'text-[#8c8c9a] hover:text-[#131b2e]'
                  }`}
                >
                  휴대폰 번호
                  {loginTab === 'phone' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#131b2e]" />
                  )}
                </button>
              </div>

              {/* Form Area */}
              <form onSubmit={handleDirectLogin} className="p-6 space-y-3.5">
                {/* ID / Phone Input */}
                <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#131b2e] transition-all">
                  <label className="block text-[11px] text-[#777587] font-medium">
                    {loginTab === 'id' ? '아이디' : '휴대폰 번호'}
                  </label>
                  <input
                    type={loginTab === 'id' ? 'text' : 'tel'}
                    value={loginTab === 'id' ? loginId : loginPhone}
                    onChange={(e) =>
                      loginTab === 'id' ? setLoginId(e.target.value) : setLoginPhone(e.target.value)
                    }
                    placeholder={loginTab === 'id' ? '아이디 또는 이메일' : '010-0000-0000'}
                    className="w-full bg-transparent text-sm text-[#131b2e] font-semibold focus:outline-none placeholder:text-[#a0a0ab] pt-0.5"
                  />
                </div>

                {/* Password Input */}
                <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 flex items-center justify-between focus-within:ring-1 focus-within:ring-[#131b2e] transition-all">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] text-[#777587] font-medium">비밀번호</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="w-full bg-transparent text-sm text-[#131b2e] font-semibold focus:outline-none placeholder:text-[#a0a0ab] pt-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#777587] hover:text-[#131b2e] p-1.5 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Checkboxes: 아이디 저장 & 자동 로그인 */}
                <div className="flex items-center gap-5 pt-0.5 text-xs text-[#555]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveId}
                      onChange={(e) => setSaveId(e.target.checked)}
                      className="w-4 h-4 rounded text-[#131b2e] accent-[#131b2e] cursor-pointer"
                    />
                    <span>아이디 저장</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoLogin}
                      onChange={(e) => setAutoLogin(e.target.checked)}
                      className="w-4 h-4 rounded text-[#131b2e] accent-[#131b2e] cursor-pointer"
                    />
                    <span>자동 로그인</span>
                  </label>
                </div>

                {/* 로그인하기 Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#1e1e24] hover:bg-[#131b2e] text-white font-bold text-sm tracking-tight transition-all active:scale-[0.99] cursor-pointer shadow-sm mt-1"
                >
                  로그인하기
                </button>

                {/* Links: 아이디 찾기 | 비밀번호 재설정 */}
                <div className="flex items-center justify-center gap-3 text-xs text-[#777587] py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFoundIdResult(null);
                      setScreen('find_id');
                    }}
                    className="hover:text-[#131b2e] transition-colors cursor-pointer"
                  >
                    아이디 찾기
                  </button>
                  <span className="text-[#dae2fd]">|</span>
                  <button
                    type="button"
                    onClick={() => setScreen('find_password')}
                    className="hover:text-[#131b2e] transition-colors cursor-pointer"
                  >
                    비밀번호 재설정
                  </button>
                </div>

                {/* Social and Sign up Buttons */}
                <div className="pt-2 space-y-2 border-t border-[#f0f2f7]">
                  {/* 카카오로 시작하기 */}
                  <button
                    type="button"
                    onClick={handleKakaoLogin}
                    className="w-full py-3 px-4 rounded-xl bg-[#FEE500] hover:bg-[#fae100] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 3c-5.523 0-10 3.582-10 8c0 2.88 1.868 5.418 4.717 6.804l-1.196 4.417c-.105.389.314.714.654.507l5.244-3.197c.189.014.38.021.581.021 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                    </svg>
                    <span>카카오로 시작하기</span>
                  </button>

                  {/* 구글로 시작하기 */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#f8f9fa] text-[#1f1f1f] font-bold text-xs border border-[#dadce0] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>구글로 시작하기</span>
                  </button>

                  {/* 애플로 시작하기 */}
                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.63-1.24z"/>
                    </svg>
                    <span>애플로 시작하기</span>
                  </button>

                  {/* 회원가입하기 */}
                  <button
                    type="button"
                    onClick={() => setScreen('email_step1')}
                    className="w-full py-3 px-4 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6ea] text-[#131b2e] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>회원가입하기</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SCREEN: 아이디 찾기 */}
        {screen === 'find_id' && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#dae2fd]/40">
                <button
                  type="button"
                  onClick={() => setScreen('email_direct_login')}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#f2f3ff] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">아이디 찾기</h1>
                <div className="w-9" />
              </div>

              {foundIdResult ? (
                <div className="py-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#dae2fd] text-center space-y-2">
                    <span className="material-symbols-outlined text-[32px] text-[#5046e5]">
                      account_circle
                    </span>
                    <h3 className="text-sm font-bold text-[#131b2e]">회원님의 가입 아이디입니다</h3>
                    <p className="text-base font-extrabold text-[#3625cd] bg-white py-2.5 px-4 rounded-xl border border-[#dae2fd]">
                      {foundIdResult}
                    </p>
                    <p className="text-[11px] text-[#777587]">
                      가입일: 2025.01.15 (이메일 인증 완료 계정)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginId(foundIdResult);
                      setScreen('email_direct_login');
                    }}
                    className="w-full py-3.5 rounded-xl bg-[#1e1e24] hover:bg-[#131b2e] text-white font-bold text-sm tracking-tight transition-all cursor-pointer shadow-sm"
                  >
                    로그인하러 가기
                  </button>

                  <button
                    type="button"
                    onClick={() => setScreen('find_password')}
                    className="w-full py-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6ea] text-[#131b2e] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    비밀번호도 재설정하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFindIdSubmit} className="pt-4 space-y-3.5">
                  <p className="text-xs text-[#777587] leading-relaxed">
                    가입 시 등록한 이름과 연락처(휴대폰 번호 또는 이메일)를 입력해 주세요.
                  </p>

                  <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#131b2e]">
                    <label className="block text-[11px] text-[#777587] font-medium">이름</label>
                    <input
                      type="text"
                      value={findIdName}
                      onChange={(e) => setFindIdName(e.target.value)}
                      placeholder="이름 입력 (예: 김클립)"
                      required
                      className="w-full bg-transparent text-sm text-[#131b2e] font-semibold focus:outline-none placeholder:text-[#a0a0ab] pt-0.5"
                    />
                  </div>

                  <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#131b2e]">
                    <label className="block text-[11px] text-[#777587] font-medium">
                      휴대폰 번호 또는 이메일
                    </label>
                    <input
                      type="text"
                      value={findIdContact}
                      onChange={(e) => setFindIdContact(e.target.value)}
                      placeholder="010-0000-0000 또는 이메일 입력"
                      required
                      className="w-full bg-transparent text-sm text-[#131b2e] font-semibold focus:outline-none placeholder:text-[#a0a0ab] pt-0.5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#1e1e24] hover:bg-[#131b2e] text-white font-bold text-sm tracking-tight transition-all cursor-pointer shadow-sm mt-2"
                  >
                    아이디 찾기
                  </button>
                </form>
              )}
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setScreen('email_direct_login')}
                className="text-xs text-[#777587] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                ← 로그인 화면으로 돌아가기
              </button>
            </div>
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
                    value={findPwCode}
                    onChange={(e) => setFindPwCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="인증번호 6자리 입력"
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
                <button
                  type="button"
                  onClick={() => setScreen('email_direct_login')}
                  className="p-1 text-[#131b2e] hover:bg-[#eaedff] rounded-full transition-colors cursor-pointer"
                >
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
                onClick={() => {
                  if (!emailUser.trim()) {
                    alert('이메일 주소를 입력해 주세요.');
                    return;
                  }
                  if (!terms.age || !terms.service || !terms.privacy) {
                    alert('필수 약관에 모두 동의해 주세요.');
                    return;
                  }
                  // 6자리 모두 비워진 상태로 리셋
                  setOtp(['', '', '', '', '', '']);
                  setTimerSeconds(300);
                  setScreen('email_step2');
                  setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                  }, 100);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>인증번호 받기</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-xs text-[#777587]">
                  이미 계정이 있으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setScreen('email_direct_login')}
                    className="text-[#5046e5] font-bold underline underline-offset-2 ml-1 cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => {
                    setOtp(['', '', '', '', '', '']);
                    setScreen('email_step1');
                  }}
                  className="p-1 text-[#131b2e] hover:bg-[#eaedff] rounded-full transition-colors cursor-pointer"
                >
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
                type="button"
                onClick={() => {
                  setOtp(['', '', '', '', '', '']);
                  setScreen('email_step1');
                }}
                className="text-xs text-[#5046e5] font-semibold underline mb-6 cursor-pointer"
              >
                이메일 주소 변경 ✏️
              </button>

              {/* 6 Digit Boxes (6자리 모두 빈칸으로 시작) */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        otpInputRefs.current[idx - 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').trim();
                      const numbersOnly = pastedData.replace(/[^0-9]/g, '');
                      if (numbersOnly.length > 0) {
                        const digits = numbersOnly.slice(0, 6).split('');
                        const newOtp = ['', '', '', '', '', ''];
                        digits.forEach((d, i) => {
                          newOtp[i] = d;
                        });
                        setOtp(newOtp);
                        const nextIndex = Math.min(digits.length, 5);
                        otpInputRefs.current[nextIndex]?.focus();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const newOtp = [...otp];
                      newOtp[idx] = val.slice(-1);
                      setOtp(newOtp);
                      if (val && idx < 5) {
                        otpInputRefs.current[idx + 1]?.focus();
                      }
                    }}
                    className={`w-full h-14 text-center text-xl font-bold bg-white border-2 rounded-xl text-[#131b2e] focus:outline-none transition-all ${
                      digit
                        ? 'border-[#5046e5] ring-2 ring-[#5046e5]/10'
                        : 'border-[#dae2fd] focus:border-[#5046e5]'
                    }`}
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
                    onClick={() => {
                      setOtp(['', '', '', '', '', '']);
                      setTimerSeconds(300);
                      alert('인증번호가 재전송되었습니다.');
                      setTimeout(() => {
                        otpInputRefs.current[0]?.focus();
                      }, 100);
                    }}
                    className="text-[#5046e5] font-bold underline cursor-pointer"
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
                onClick={() => {
                  const enteredCode = otp.join('');
                  if (enteredCode.length < 6) {
                    alert('인증번호 6자리를 모두 입력해 주세요.');
                    return;
                  }
                  alert('현재 6자리 이메일 인증번호 발송 및 검증 서버가 준비 중입니다. 실제 서버 연동 전까지는 임의 인증 완료가 제한되오니, 현재 활성화된 Google 로그인을 이용해 주세요.');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
