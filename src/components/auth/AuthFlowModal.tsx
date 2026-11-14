import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  RotateCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AuthScreenType, UserProfile } from '../../types';
import { SITE_CONFIG } from '../../config/siteConfig';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
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

  // Main Login screen states
  const [loginId, setLoginId] = useState(() => {
    try {
      return localStorage.getItem('clipsort_saved_id') || '';
    } catch {
      return '';
    }
  });
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
  const [findIdContact, setFindIdContact] = useState('');
  const [findIdError, setFindIdError] = useState<string | null>(null);
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
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 4 state (Password)
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Find password state
  const [findPwEmail, setFindPwEmail] = useState('');
  const [findPwCode, setFindPwCode] = useState('');
  const [findPwTimer, setFindPwTimer] = useState(300);
  const [findPwCodeSent, setFindPwCodeSent] = useState(false);
  const [isSendingFindPwCode, setIsSendingFindPwCode] = useState(false);
  const [isVerifyingFindPwCode, setIsVerifyingFindPwCode] = useState(false);
  const [findPwError, setFindPwError] = useState<string | null>(null);
  const [findPwSuccessMsg, setFindPwSuccessMsg] = useState<string | null>(null);
  const [resetPwApprovalToken, setResetPwApprovalToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetPwError, setResetPwError] = useState<string | null>(null);

  // Auth submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isExistingAccount, setIsExistingAccount] = useState(false);

  // Clear errors when transitioning between screens
  useEffect(() => {
    setLoginError(null);
    setSignupError(null);
    setVerificationError(null);
    setIsExistingAccount(false);
    setFindPwError(null);
    setResetPwError(null);
  }, [screen]);

  // Countdown timer for signup OTP
  useEffect(() => {
    if (screen !== 'email_step2') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  // Countdown timer for password reset OTP
  useEffect(() => {
    if (screen !== 'find_password' || !findPwCodeSent) return;
    const interval = setInterval(() => {
      setFindPwTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, findPwCodeSent]);

  // Pre-fetched Kakao Auth URL cache so popup opens synchronously on click when ready
  const [kakaoAuthUrlCache, setKakaoAuthUrlCache] = useState<string | null>(null);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/auth/kakao/url')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.success && data.url) {
          setKakaoAuthUrlCache(data.url);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Listen for OAuth popup completion messages (Kakao)
  useEffect(() => {
    if (!isOpen) return;

    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin || '';
      const isTrustedOrigin =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost');
      if (!isTrustedOrigin) return;

      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'KAKAO_OAUTH_ERROR') {
        setIsKakaoLoading(false);
        setLoginError(payload.error || '카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      if (payload.type === 'KAKAO_OAUTH_SUCCESS' && payload.customToken) {
        try {
          setIsKakaoLoading(true);
          setLoginError(null);
          const cred = await signInWithCustomToken(auth, payload.customToken);
          const fbUser = cred.user;
          const profile = payload.profile || {};

          onLoginSuccess({
            isLoggedIn: true,
            uid: fbUser.uid,
            nickname:
              profile.nickname ||
              fbUser.displayName ||
              profile.email?.split('@')[0] ||
              '카카오사용자',
            email: profile.email || fbUser.email || '',
            avatarUrl: profile.avatarUrl || fbUser.photoURL || undefined,
            provider: 'kakao',
            linkedProviders: profile.linkedProviders || ['kakao'],
            linkedEmails: profile.linkedEmails,
          });
          onClose();
        } catch (err: any) {
          console.error('Kakao Firebase custom token sign-in error:', err);
          setLoginError(
            err?.message || '카카오 계정 인증은 완료되었으나 세션 연결에 실패했습니다.'
          );
        } finally {
          setIsKakaoLoading(false);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [isOpen, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const fullEmail = (emailUser.includes('@') ? emailUser : `${emailUser}${selectedDomain}`).toLowerCase().trim();

  // Password strength evaluation:
  // - Before typing or when requirements are unmet: null or incomplete
  // - Once 8~16 chars AND letters + numbers + special chars are met:
  //     1. '안전한 강도' (기본 안전)
  //     2. '높은 안전함' (대소문자 혼합 또는 10자 이상)
  //     3. '매우 안전함' (대소문자 + 숫자 + 특수문자 2개 이상 또는 12자 이상)
  const evaluatePasswordStrength = (pw: string): {
    tier: 'none' | 'insufficient' | 'safe' | 'strong' | 'very_strong';
    label: string;
    textColor: string;
    bgColor: string;
    barWidth: string;
    description: string;
  } => {
    if (!pw || pw.length === 0) {
      return {
        tier: 'none',
        label: '',
        textColor: 'text-[#777587]',
        bgColor: 'bg-[#dae2fd]',
        barWidth: '0%',
        description: '영문, 숫자, 특수문자를 조합하여 8자 이상 입력해 주세요.',
      };
    }

    const isLengthValid = pw.length >= 8 && pw.length <= 16;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumbers = /[0-9]/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
    const isBasicComplex = (hasLower || hasUpper) && hasNumbers && hasSpecial;

    // Both mandatory conditions must be satisfied before entering "Safe" tiers
    if (!isLengthValid || !isBasicComplex) {
      return {
        tier: 'insufficient',
        label: '조건 미충족',
        textColor: 'text-[#ba1a1a]',
        bgColor: 'bg-[#ffdad6]',
        barWidth: '25%',
        description: '8~16자리 및 영문/숫자/특수문자 필수 조건을 충족해 주세요.',
      };
    }

    // Mandatory conditions are met. Now evaluate advanced strength (3 tiers):
    const specialCount = (pw.match(/[^a-zA-Z0-9]/g) || []).length;
    const hasMixedCase = hasLower && hasUpper;

    // Tier 3: '매우 안전함' (Very Strong)
    // Criteria: (12자리 이상 + 대소문자 혼합) OR (10자리 이상 + 대소문자 혼합 + 특수문자 2개 이상)
    if ((pw.length >= 12 && hasMixedCase) || (pw.length >= 10 && hasMixedCase && specialCount >= 2)) {
      return {
        tier: 'very_strong',
        label: '매우 안전함',
        textColor: 'text-[#00687a]',
        bgColor: 'bg-[#00687a]/15 text-[#00687a]',
        barWidth: '100%',
        description: '매우 강력한 비밀번호입니다. 계정이 최고 수준으로 보호됩니다.',
      };
    }

    // Tier 2: '높은 안전함' (Strong)
    // Criteria: (대소문자 혼합) OR (10자리 이상) OR (특수문자 2개 이상)
    if (hasMixedCase || pw.length >= 10 || specialCount >= 2) {
      return {
        tier: 'strong',
        label: '높은 안전함',
        textColor: 'text-[#008850]',
        bgColor: 'bg-[#008850]/15 text-[#008850]',
        barWidth: '75%',
        description: '안전하고 신뢰할 수 있는 강도의 비밀번호입니다.',
      };
    }

    // Tier 1: '안전한 강도' (Safe)
    // Criteria: 8~16자리 및 영문/숫자/특수문자 기본 필수 조건 충족
    return {
      tier: 'safe',
      label: '안전한 강도',
      textColor: 'text-[#5046e5]',
      bgColor: 'bg-[#eaedff] text-[#5046e5]',
      barWidth: '50%',
      description: '기본 보안 기준을 충족한 안전한 비밀번호입니다.',
    };
  };

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

  // API 1: Send OTP Verification Code via Resend
  const handleRequestVerificationCode = async () => {
    if (!emailUser.trim()) {
      alert('이메일 주소를 입력해 주세요.');
      return;
    }
    if (!terms.age || !terms.service || !terms.privacy) {
      alert('필수 약관에 모두 동의해 주세요.');
      return;
    }

    setIsSendingCode(true);
    setVerificationError(null);

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || '인증번호 발송에 실패했습니다.';
        setVerificationError(errorMsg);
        alert(errorMsg);
        return;
      }

      // Reset OTP inputs and timer
      setOtp(['', '', '', '', '', '']);
      setTimerSeconds(data.expiresInSeconds || 300);
      setApprovalToken(null);
      setScreen('email_step2');

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const netMsg = err.message || '네트워크 오류가 발생했습니다.';
      setVerificationError(netMsg);
      alert(netMsg);
    } finally {
      setIsSendingCode(false);
    }
  };

  // API 2: Verify 6-digit OTP Code
  const handleVerifyOtpSubmit = async () => {
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      alert('인증번호 6자리를 모두 입력해 주세요.');
      return;
    }

    if (timerSeconds <= 0) {
      alert('인증번호 입력 유효시간(5분)이 만료되었습니다. "다시 보내기"를 눌러주세요.');
      return;
    }

    setIsVerifyingCode(true);
    setVerificationError(null);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          code: enteredCode,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || data?.message || '인증번호가 일치하지 않습니다.';
        setVerificationError(errorMsg);
        alert(errorMsg);
        return;
      }

      // Successful verification -> Store approval token and proceed to Step 4 (Password Setup)
      setApprovalToken(data.approvalToken);
      setVerificationError(null);
      setScreen('email_step4');
    } catch (err: any) {
      const netMsg = err.message || '인증번호 검증 중 오류가 발생했습니다.';
      setVerificationError(netMsg);
      alert(netMsg);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // API 3: Complete Signup & Sign In directly with Firebase Auth
  const handleCompleteEmailSignup = async (allowUpdate: boolean = false) => {
    if (!approvalToken) {
      setSignupError('이메일 인증이 완료되지 않았습니다. 인증번호를 먼저 확인해 주세요.');
      setScreen('email_step2');
      return;
    }

    if (!password) {
      setSignupError('비밀번호를 입력해 주세요.');
      return;
    }

    if (password.length < 8) {
      setSignupError('비밀번호는 최소 8자리 이상이어야 합니다.');
      return;
    }

    if (password !== passwordConfirm) {
      setSignupError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setSignupError(null);

    try {
      const response = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          password,
          nickname: nickname.trim() || fullEmail.split('@')[0],
          approvalToken,
          allowPasswordUpdate: Boolean(allowUpdate),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || '회원가입 처리에 실패했습니다.';
        setSignupError(errorMsg);

        if (data?.code === 'EMAIL_ALREADY_EXISTS' || errorMsg.includes('이미 등록된')) {
          setIsExistingAccount(true);
        }
        return;
      }

      // Auto login with the newly created credentials
      try {
        const loginRes = await signInWithEmailAndPassword(auth, fullEmail, password);
        const fbUser = loginRes.user;

        onLoginSuccess({
          isLoggedIn: true,
          uid: fbUser.uid,
          nickname: fbUser.displayName || nickname.trim() || fullEmail.split('@')[0],
          email: fbUser.email || fullEmail,
          provider: 'email',
        });
        onClose();
      } catch (loginErr: any) {
        console.warn('Auto sign-in after creation notice:', loginErr);
        // Pre-fill email in direct login screen so user can log in with one click
        setLoginId(fullEmail);
        setScreen('email_direct_login');
        setTimeout(() => {
          setLoginError(`가입이 완료되었습니다. 비밀번호를 입력하여 로그인해 주세요.`);
        }, 50);
      }
    } catch (err: any) {
      const netMsg = err.message || '회원가입 처리 중 네트워크 오류가 발생했습니다.';
      setSignupError(netMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find Password 1: Send OTP to email
  const handleSendFindPwCode = async () => {
    const cleanEmail = findPwEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFindPwError('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    setIsSendingFindPwCode(true);
    setFindPwError(null);
    setFindPwSuccessMsg(null);

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'reset_password' }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setFindPwError(data?.error || data?.message || '인증번호 발송에 실패했습니다.');
        return;
      }

      setFindPwCodeSent(true);
      setFindPwTimer(300);
      setFindPwSuccessMsg('인증번호 6자리가 이메일로 발송되었습니다. (5분 이내 입력)');
    } catch (err: any) {
      setFindPwError(err.message || '인증번호 발송 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSendingFindPwCode(false);
    }
  };

  // Find Password 2: Verify 6-digit OTP
  const handleVerifyFindPwCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = findPwEmail.trim().toLowerCase();
    const cleanCode = findPwCode.trim();

    if (!cleanEmail) {
      setFindPwError('이메일 주소를 입력해 주세요.');
      return;
    }

    if (!findPwCodeSent) {
      setFindPwError('먼저 [인증번호 받기] 버튼을 눌러주세요.');
      return;
    }

    if (cleanCode.length !== 6) {
      setFindPwError('6자리 인증번호를 정확히 입력해 주세요.');
      return;
    }

    setIsVerifyingFindPwCode(true);
    setFindPwError(null);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setFindPwError(data?.message || data?.error || '인증번호가 일치하지 않습니다.');
        return;
      }

      setResetPwApprovalToken(data.approvalToken);
      setNewPassword('');
      setNewPasswordConfirm('');
      setResetPwError(null);
      setScreen('reset_password_step');
    } catch (err: any) {
      setFindPwError(err.message || '인증번호 검증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifyingFindPwCode(false);
    }
  };

  // Find Password 3: Complete Password Reset
  const handleCompletePasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = findPwEmail.trim().toLowerCase();

    if (!resetPwApprovalToken) {
      setResetPwError('이메일 인증이 완료되지 않았습니다. 인증번호를 다시 확인해 주세요.');
      setScreen('find_password');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setResetPwError('비밀번호는 최소 8자리 이상이어야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setResetPwError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmittingReset(true);
    setResetPwError(null);

    try {
      const response = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: newPassword,
          nickname: '',
          approvalToken: resetPwApprovalToken,
          allowPasswordUpdate: true,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setResetPwError(data?.error || '비밀번호 재설정 처리에 실패했습니다.');
        return;
      }

      // Automatically sign in with newly set password
      try {
        const loginRes = await signInWithEmailAndPassword(auth, cleanEmail, newPassword);
        const fbUser = loginRes.user;

        onLoginSuccess({
          isLoggedIn: true,
          uid: fbUser.uid,
          nickname: fbUser.displayName || cleanEmail.split('@')[0],
          email: fbUser.email || cleanEmail,
          provider: 'email',
        });
        onClose();
      } catch (loginErr) {
        console.warn('Auto sign-in after password reset notice:', loginErr);
        setLoginId(cleanEmail);
        setScreen('email_direct_login');
        setTimeout(() => {
          setLoginError('비밀번호가 성공적으로 변경되었습니다! 새 비밀번호로 로그인해 주세요.');
        }, 50);
      }
    } catch (err: any) {
      setResetPwError(err.message || '비밀번호 재설정 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const resolveUnifiedLoginProfile = async (
    fbUser: any,
    fallback: UserProfile
  ): Promise<UserProfile> => {
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch('/api/auth/resolve-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (data.redirected && data.switchCustomToken) {
          const switched = await signInWithCustomToken(auth, data.switchCustomToken);
          const p = data.profile || {};
          return {
            isLoggedIn: true,
            uid: switched.user.uid,
            nickname: p.nickname || switched.user.displayName || fallback.nickname,
            email: p.email || switched.user.email || fallback.email,
            avatarUrl: p.avatarUrl || switched.user.photoURL || fallback.avatarUrl,
            provider: p.provider || 'kakao',
            linkedProviders: p.linkedProviders || ['kakao', fallback.provider || 'google'],
            linkedEmails: p.linkedEmails,
          };
        }
        if (data.profile) {
          return {
            ...fallback,
            uid: data.profile.uid || fallback.uid,
            nickname: data.profile.nickname || fallback.nickname,
            email: data.profile.email || fallback.email,
            avatarUrl: data.profile.avatarUrl || fallback.avatarUrl,
            provider: data.profile.provider || fallback.provider,
            linkedProviders: data.profile.linkedProviders,
            linkedEmails: data.profile.linkedEmails,
          };
        }
      }
    } catch (err) {
      console.warn('Unified session check warning:', err);
    }
    return fallback;
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const unifiedProfile = await resolveUnifiedLoginProfile(fbUser, {
        isLoggedIn: true,
        uid: fbUser.uid,
        nickname: fbUser.displayName || fbUser.email?.split('@')[0] || '클립사용자',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || undefined,
        provider: 'google',
        linkedProviders: ['google'],
      });
      onLoginSuccess(unifiedProfile);
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
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (isSubmitting || isKakaoLoading) return;
    setIsKakaoLoading(true);
    setLoginError(null);

    try {
      let targetUrl = kakaoAuthUrlCache;
      // Always fetch a fresh state token if cache isn't warm (or refresh after use)
      if (!targetUrl) {
        const res = await fetch('/api/auth/kakao/url');
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data?.url) {
          setLoginError(
            data?.error || '카카오 로그인 설정이 아직 완료되지 않았습니다. Google 로그인 또는 이메일 로그인을 이용해 주세요.'
          );
          setIsKakaoLoading(false);
          return;
        }
        targetUrl = data.url;
      } else {
        // Consume cached URL and prefetch next state in background
        setKakaoAuthUrlCache(null);
        fetch('/api/auth/kakao/url')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.success && d.url) setKakaoAuthUrlCache(d.url);
          })
          .catch(() => {});
      }

      const popup = window.open(
        targetUrl!,
        'kakao_oauth_popup',
        'width=500,height=680,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setLoginError('팝업 차단이 활성화되어 있습니다. 브라우저의 팝업 차단을 해제하고 다시 시도해 주세요.');
        setIsKakaoLoading(false);
        return;
      }

      // Reset loading state if user manually closes popup before completing login
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsKakaoLoading(false);
        }
      }, 600);
    } catch (err: any) {
      console.error('Kakao OAuth start error:', err);
      setLoginError(err?.message || '카카오 로그인 창을 여는 중 오류가 발생했습니다.');
      setIsKakaoLoading(false);
    }
  };

  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setLoginError(null);

    const idToUse = loginId.trim();
    if (!idToUse) {
      setLoginError('아이디 또는 이메일을 입력해 주세요.');
      return;
    }
    if (!loginPassword) {
      setLoginError('비밀번호를 입력해 주세요.');
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

      const unifiedProfile = await resolveUnifiedLoginProfile(fbUser, {
        isLoggedIn: true,
        uid: fbUser.uid,
        nickname: fbUser.displayName || fbUser.email?.split('@')[0] || idToUse.split('@')[0] || '클립사용자',
        email: fbUser.email || emailToUse,
        provider: 'email',
        linkedProviders: ['email'],
      });
      onLoginSuccess(unifiedProfile);
      onClose();
    } catch (err: any) {
      console.warn('Email login error details:', err.code, err.message);
      let errorMsg = '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = '등록되지 않은 계정입니다. 이메일 주소를 확인하거나 아래 Google 로그인을 이용해 주세요.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = '이메일 또는 비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인해 주세요.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = '유효한 이메일 형식을 입력해 주세요 (예: user@example.com).';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = '로그인 시도가 많아 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.';
      } else if (err.code === 'auth/user-disabled') {
        errorMsg = '관리자에 의해 비활성화된 계정입니다.';
      } else if (err.message && !err.message.includes('auth/')) {
        errorMsg = err.message;
      }
      setLoginError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFindIdError(null);
    const trimmed = findIdContact.trim();
    if (!trimmed) {
      setFindIdError('가입 시 사용하신 이메일 주소를 입력해 주세요.');
      return;
    }
    if (!trimmed.includes('@')) {
      setFindIdError('ClipSort는 이메일 주소 자체를 아이디로 사용합니다. 이메일 형식으로 입력해 주세요.');
      return;
    }
    setFoundIdResult(trimmed.toLowerCase());
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
                <p className="text-xs text-[#777587] mt-1">이메일 또는 소셜 계정으로 간편하게 시작하세요</p>
              </div>

              {/* Form Area */}
              <form onSubmit={handleDirectLogin} className="p-6 space-y-3.5">
                {/* Email / ID Input */}
                <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#131b2e] transition-all">
                  <label className="block text-[11px] text-[#777587] font-medium">
                    이메일 (아이디)
                  </label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="example@gmail.com"
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

                {/* Error Banner in Form */}
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                    <span className="font-bold">⚠️</span>
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                {/* 로그인하기 Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#1e1e24] hover:bg-[#131b2e] text-white font-bold text-sm tracking-tight transition-all active:scale-[0.99] cursor-pointer shadow-sm mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>로그인 확인 중...</span>
                    </>
                  ) : (
                    <span>로그인하기</span>
                  )}
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
                    onClick={() => {
                      if (loginId.includes('@')) {
                        setFindPwEmail(loginId);
                      } else if (emailUser.includes('@')) {
                        setFindPwEmail(emailUser);
                      } else {
                        setFindPwEmail('');
                      }
                      setFindPwError(null);
                      setFindPwSuccessMsg(null);
                      setFindPwCodeSent(false);
                      setFindPwCode('');
                      setScreen('find_password');
                    }}
                    className="hover:text-[#131b2e] transition-colors cursor-pointer"
                  >
                    비밀번호 재설정
                  </button>
                </div>

                {/* Social and Sign up Buttons */}
                <div className="pt-3 space-y-2.5 border-t border-[#dae2fd]/50">
                  {/* Kakao 1-Click OAuth Login */}
                  <button
                    type="button"
                    onClick={handleKakaoLogin}
                    disabled={isSubmitting || isKakaoLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {isKakaoLoading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>카카오 로그인 연결 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3C6.48 3 2 6.46 2 10.72c0 2.74 1.82 5.14 4.55 6.49-.16.58-.58 2.1-.67 2.43-.11.42.15.41.32.3.13-.09 2.09-1.42 2.94-2 .91.14 1.87.21 2.86.21 5.52 0 10-3.46 10-7.43C22 6.46 17.52 3 12 3z" />
                        </svg>
                        <span>카카오로 1초 시작하기</span>
                      </>
                    )}
                  </button>

                  {/* Google Login (Official OAuth) */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting || isKakaoLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-[#f8f9fa] text-[#1f1f1f] font-bold text-xs border border-[#dadce0] flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google 계정으로 계속하기</span>
                  </button>

                  {/* New Account Sign Up Callout */}
                  <div className="pt-1 text-center">
                    <span className="text-xs text-[#777587]">아직 ClipSort 계정이 없으신가요?</span>{' '}
                    <button
                      type="button"
                      onClick={() => setScreen('email_step1')}
                      className="text-xs font-bold text-[#5046e5] hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
                    >
                      <span>이메일 회원가입</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">계정 · 아이디 안내</h1>
                <div className="w-9" />
              </div>

              {foundIdResult ? (
                <div className="py-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#dae2fd] text-center space-y-2">
                    <span className="material-symbols-outlined text-[32px] text-[#5046e5]">
                      account_circle
                    </span>
                    <h3 className="text-sm font-bold text-[#131b2e]">입력하신 이메일로 바로 진행할 수 있어요</h3>
                    <p className="text-base font-extrabold text-[#3625cd] bg-white py-2.5 px-4 rounded-xl border border-[#dae2fd] break-all">
                      {foundIdResult}
                    </p>
                    <p className="text-[11px] text-[#777587] leading-relaxed">
                      ClipSort는 가입하신 이메일 주소 자체를 아이디로 사용합니다. 비밀번호가 기억나지 않으면 아래에서 바로 재설정하실 수 있습니다.
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
                    이 이메일로 로그인하기
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFindPwEmail(foundIdResult);
                      setScreen('find_password');
                    }}
                    className="w-full py-3 rounded-xl bg-[#f0f2f5] hover:bg-[#e4e6ea] text-[#131b2e] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    이 이메일로 비밀번호 재설정하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFindIdSubmit} className="pt-4 space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]/60 text-xs text-[#464555] leading-relaxed space-y-1.5">
                    <p className="font-bold text-[#131b2e]">ClipSort 아이디 안내</p>
                    <p>
                      • 이메일 회원가입 시 입력하신 <strong>이메일 주소 자체가 아이디</strong>입니다.<br />
                      • <strong>Google 계정</strong>으로 가입하셨다면 별도 아이디 없이 <strong>[Google 계정으로 계속하기]</strong>로 바로 로그인됩니다.
                    </p>
                  </div>

                  <div className="bg-[#f4f5f8] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#131b2e]">
                    <label className="block text-[11px] text-[#777587] font-medium">
                      기억나는 이메일 주소 확인
                    </label>
                    <input
                      type="text"
                      value={findIdContact}
                      onChange={(e) => {
                        setFindIdContact(e.target.value);
                        setFindIdError(null);
                      }}
                      placeholder="예: example@gmail.com"
                      className="w-full bg-transparent text-sm text-[#131b2e] font-semibold focus:outline-none placeholder:text-[#a0a0ab] pt-0.5"
                    />
                  </div>

                  {findIdError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {findIdError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#1e1e24] hover:bg-[#131b2e] text-white font-bold text-sm tracking-tight transition-all cursor-pointer shadow-sm mt-1"
                  >
                    이 이메일로 로그인 / 비밀번호 찾기
                  </button>

                  <p className="text-[11px] text-[#777587] text-center pt-1 leading-relaxed">
                    계정을 전혀 기억할 수 없다면 운영팀(
                    <a
                      href={`mailto:${SITE_CONFIG.operatorEmail}`}
                      className="text-[#5046e5] font-semibold hover:underline"
                    >
                      {SITE_CONFIG.operatorEmail}
                    </a>
                    )으로 문의해 주세요.
                  </p>
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

        {/* SCREEN: 비밀번호 찾기 (실제 이메일 인증번호 발송 & 검증 연동) */}
        {screen === 'find_password' && (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3">
                <button
                  type="button"
                  onClick={() => setScreen('email_direct_login')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-colors cursor-pointer"
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
                    가입 시 등록한 이메일 주소로 6자리 인증번호를 발송하여 본인 확인 후 비밀번호를 재설정합니다.
                  </p>
                </div>
              </section>

              {/* Error & Success Banners */}
              {findPwError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                  <span className="font-bold">⚠️</span>
                  <span className="leading-relaxed">{findPwError}</span>
                </div>
              )}
              {findPwSuccessMsg && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{findPwSuccessMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleVerifyFindPwCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#131b2e] block">가입 이메일 주소</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={findPwEmail}
                      onChange={(e) => setFindPwEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                    />
                    <button
                      type="button"
                      onClick={handleSendFindPwCode}
                      disabled={isSendingFindPwCode || !findPwEmail.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[#5046e5] text-white text-xs font-bold hover:bg-[#3625cd] transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      {isSendingFindPwCode ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>발송 중</span>
                        </>
                      ) : findPwCodeSent ? (
                        '재전송'
                      ) : (
                        '인증번호 받기'
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Code Box (Visible once sent) */}
                {findPwCodeSent && (
                  <div className="bg-white border border-[#dae2fd] rounded-xl p-3.5 shadow-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#131b2e]">6자리 인증번호 입력</label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">timer</span>
                        {Math.floor(findPwTimer / 60).toString().padStart(2, '0')}:{(findPwTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={findPwCode}
                      onChange={(e) => setFindPwCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="6자리 숫자 입력"
                      maxLength={6}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#f2f3ff] border border-[#5046e5] text-center font-bold tracking-widest text-[#131b2e] text-lg focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#777587] pt-1">
                      <span>인증번호가 도착하지 않았나요?</span>
                      <button
                        type="button"
                        onClick={handleSendFindPwCode}
                        disabled={isSendingFindPwCode}
                        className="text-[#5046e5] font-bold hover:underline cursor-pointer"
                      >
                        인증번호 다시 받기
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!findPwCodeSent || findPwCode.length !== 6 || isVerifyingFindPwCode}
                  className="w-full py-3.5 rounded-xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isVerifyingFindPwCode ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>인증번호 확인 중...</span>
                    </>
                  ) : (
                    <>
                      <span>다음 (새 비밀번호 설정)</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Help */}
            <div className="mt-4 pt-3 border-t border-[#dae2fd]/40 text-center text-xs text-[#777587]">
              <span>이메일이 기억나지 않으시나요? </span>
              <button
                type="button"
                onClick={() => {
                  setFoundIdResult(null);
                  setScreen('find_id');
                }}
                className="text-[#5046e5] font-bold hover:underline cursor-pointer"
              >
                아이디 찾기
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
                  type="button"
                  onClick={() => setScreen('find_password')}
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-bold text-[#131b2e] tracking-tight">새 비밀번호 설정</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eaedff] text-[#5046e5] font-bold">
                  본인 인증 완료
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
                    새 비밀번호를 설정하시면 즉시 반영되어 로그인됩니다.
                  </p>
                </div>
              </section>

              {/* Error banner */}
              {resetPwError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
                  <span className="font-bold">⚠️</span>
                  <span className="leading-relaxed">{resetPwError}</span>
                </div>
              )}

              <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                {/* 1. New Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-xs font-bold text-[#131b2e]">새 비밀번호</label>
                    {(() => {
                      const strength = evaluatePasswordStrength(newPassword);
                      if (strength.tier === 'none') return null;
                      return (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all animate-in fade-in duration-200 ${strength.bgColor}`}
                        >
                          {strength.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="8~16자리 영문, 숫자, 특수문자 조합"
                      required
                      className="w-full h-12 px-4 pr-10 rounded-xl bg-white border border-[#dae2fd] text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] hover:text-[#131b2e] p-1 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Requirements chips */}
                  <div className="flex gap-2 pt-1">
                    {(() => {
                      const isLengthValid = newPassword.length >= 8 && newPassword.length <= 16;
                      const hasLetters = /[a-zA-Z]/.test(newPassword);
                      const hasNumbers = /[0-9]/.test(newPassword);
                      const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
                      const isComplexityValid = hasLetters && hasNumbers && hasSpecial;
                      const hasInput = newPassword.length > 0;

                      return (
                        <>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition-colors ${
                              !hasInput
                                ? 'bg-slate-100 text-slate-500'
                                : isLengthValid
                                ? 'bg-[#eaedff] text-[#3625cd]'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {!hasInput ? (
                              <span className="w-3 h-3 text-[9px] inline-flex items-center justify-center">•</span>
                            ) : isLengthValid ? (
                              <CheckCircle2 className="w-3 h-3 text-[#2563eb]" />
                            ) : (
                              <XCircle className="w-3 h-3 text-[#dc2626]" />
                            )}
                            8자리 이상 16자리 이하
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 transition-colors ${
                              !hasInput
                                ? 'bg-slate-100 text-slate-500'
                                : isComplexityValid
                                ? 'bg-[#eaedff] text-[#3625cd]'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {!hasInput ? (
                              <span className="w-3 h-3 text-[9px] inline-flex items-center justify-center">•</span>
                            ) : isComplexityValid ? (
                              <CheckCircle2 className="w-3 h-3 text-[#2563eb]" />
                            ) : (
                              <XCircle className="w-3 h-3 text-[#dc2626]" />
                            )}
                            영문/숫자/특수문자
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. New Password Confirm */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#131b2e]">새 비밀번호 확인</label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPw ? 'text' : 'password'}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="새 비밀번호를 한 번 더 입력하세요"
                      required
                      className={`w-full h-12 px-4 pr-10 rounded-xl bg-white border text-sm text-[#131b2e] focus:outline-none transition-colors ${
                        !newPasswordConfirm
                          ? 'border-[#dae2fd] focus:border-[#5046e5]'
                          : newPassword && newPassword === newPasswordConfirm
                          ? 'border-[#2563eb]'
                          : 'border-[#dc2626]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPw(!showConfirmNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] hover:text-[#131b2e] p-1 cursor-pointer"
                    >
                      {showConfirmNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && newPasswordConfirm && newPassword === newPasswordConfirm && (
                    <p className="text-[11px] text-[#2563eb] font-semibold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3 h-3" /> 새 비밀번호와 일치합니다.
                    </p>
                  )}
                  {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                    <p className="text-[11px] text-[#dc2626] font-semibold flex items-center gap-1 pt-1">
                      <XCircle className="w-3 h-3" /> 비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmittingReset ||
                    !newPassword ||
                    newPassword.length < 8 ||
                    newPassword !== newPasswordConfirm
                  }
                  className="w-full py-3.5 rounded-xl bg-[#5046e5] text-white font-bold text-sm shadow-md hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmittingReset ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>비밀번호 재설정 중...</span>
                    </>
                  ) : (
                    <>
                      <span>비밀번호 재설정 완료</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
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
                onClick={handleRequestVerificationCode}
                disabled={isSendingCode}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSendingCode ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>인증번호 발송 중...</span>
                  </>
                ) : (
                  <>
                    <span>인증번호 받기</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
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
                <span className={`font-bold flex items-center gap-1 ${timerSeconds <= 0 ? 'text-rose-500' : 'text-[#5046e5]'}`}>
                  ⏱️ {timerSeconds <= 0 ? '인증시간 만료' : `${formatTimer(timerSeconds)} 남음`}
                </span>
                <span className="text-[#777587]">
                  인증번호가 오지 않나요?{' '}
                  <button
                    type="button"
                    disabled={isSendingCode}
                    onClick={() => {
                      setOtp(['', '', '', '', '', '']);
                      handleRequestVerificationCode();
                    }}
                    className="text-[#5046e5] font-bold underline cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCode ? '재전송 중...' : '다시 보내기'}
                  </button>
                </span>
              </div>

              {/* Error notice if any */}
              {verificationError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <span className="font-bold">⚠️</span>
                  <span>{verificationError}</span>
                </div>
              )}

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
                onClick={handleVerifyOtpSubmit}
                disabled={isVerifyingCode || otp.join('').length < 6}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isVerifyingCode ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>인증번호 확인 중...</span>
                  </>
                ) : (
                  <>
                    <span>다음</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
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
                  {(() => {
                    const strength = evaluatePasswordStrength(password);
                    if (strength.tier === 'none') {
                      return null;
                    }
                    return (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all animate-in fade-in duration-200 ${strength.bgColor}`}
                      >
                        {strength.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8~16자리 영문, 숫자, 특수문자 입력"
                    className="w-full px-4 py-3 bg-white border border-[#dae2fd] rounded-2xl text-sm text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#777587]">
                    <button type="button" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security conditions chips (Dynamic evaluation: neutral when empty, success when met, X when not met) */}
              {(() => {
                const isLengthValid = password.length >= 8 && password.length <= 16;
                const hasLetters = /[a-zA-Z]/.test(password);
                const hasNumbers = /[0-9]/.test(password);
                const hasSpecial = /[^a-zA-Z0-9]/.test(password);
                const isComplexityValid = hasLetters && hasNumbers && hasSpecial;
                const hasPasswordInput = password.length > 0;

                return (
                  <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#dae2fd] flex items-center justify-between text-[11px] font-semibold mb-3">
                    {/* Condition 1: 8 to 16 characters */}
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        !hasPasswordInput
                          ? 'text-[#777587]'
                          : isLengthValid
                          ? 'text-[#2563eb]'
                          : 'text-[#dc2626]'
                      }`}
                    >
                      {!hasPasswordInput ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#777587]/60 inline-flex items-center justify-center text-[9px] text-[#777587]">
                          •
                        </span>
                      ) : isLengthValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#dc2626]" />
                      )}
                      <span>8자리 이상 16자리 이하</span>
                    </span>

                    {/* Condition 2: letters + numbers + special characters */}
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        !hasPasswordInput
                          ? 'text-[#777587]'
                          : isComplexityValid
                          ? 'text-[#2563eb]'
                          : 'text-[#dc2626]'
                      }`}
                    >
                      {!hasPasswordInput ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#777587]/60 inline-flex items-center justify-center text-[9px] text-[#777587]">
                          •
                        </span>
                      ) : isComplexityValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#dc2626]" />
                      )}
                      <span>영문/숫자/특수문자 포함</span>
                    </span>
                  </div>
                );
              })()}

              {/* Password confirm input */}
              {(() => {
                const hasBoth = Boolean(password && passwordConfirm);
                const isMatch = hasBoth && password === passwordConfirm;
                const isMismatch = Boolean(passwordConfirm && password !== passwordConfirm);

                return (
                  <div className="mb-2">
                    <label className="text-xs font-bold text-[#131b2e] block mb-1">비밀번호 확인</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="새 비밀번호를 한 번 더 입력하세요"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-2xl text-sm text-[#131b2e] focus:outline-none transition-colors ${
                          !passwordConfirm
                            ? 'border-[#dae2fd] focus:border-[#5046e5]'
                            : isMatch
                            ? 'border-[#2563eb] focus:border-[#2563eb]'
                            : 'border-[#dc2626] focus:border-[#dc2626]'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {isMatch && <CheckCircle2 className="w-4 h-4 text-[#2563eb]" />}
                        {isMismatch && <XCircle className="w-4 h-4 text-[#dc2626]" />}
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="text-[#777587] hover:text-[#131b2e] p-0.5"
                        >
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Status message: only show when user has entered confirmation */}
                    {isMatch && (
                      <p className="text-[11px] text-[#2563eb] font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>비밀번호가 일치합니다.</span>
                      </p>
                    )}
                    {isMismatch && (
                      <p className="text-[11px] text-[#dc2626] font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                        <XCircle className="w-3 h-3" />
                        <span>비밀번호가 일치하지 않습니다.</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* End-to-end encryption note */}
              <div className="p-3 rounded-2xl bg-white border border-[#dae2fd] flex items-center gap-2 text-[11px] text-[#464555]">
                <Shield className="w-4 h-4 text-[#5046e5] shrink-0" />
                <p className="truncate">ClipSort는 강화된 종단간 암호화 기술로 사용자의 북마크를 보호합니다.</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 space-y-2">
              {signupError && (
                <div
                  className={`mb-2 p-3.5 rounded-2xl border text-xs flex flex-col gap-2.5 animate-in fade-in duration-200 ${
                    isExistingAccount
                      ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-sm leading-none shrink-0">
                      {isExistingAccount ? 'ℹ️' : '⚠️'}
                    </span>
                    <span className="leading-relaxed font-medium">{signupError}</span>
                  </div>

                  {isExistingAccount && (
                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginId(fullEmail);
                          setScreen('email_direct_login');
                          setTimeout(() => {
                            setLoginError(
                              `이미 가입된 계정(${fullEmail})입니다. 기존 비밀번호를 입력해 로그인해 주세요.`
                            );
                          }, 50);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100/70 transition-colors cursor-pointer text-center shadow-xs"
                      >
                        기존 계정으로 로그인하기
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCompleteEmailSignup(true)}
                        disabled={isSubmitting || !password || password !== passwordConfirm}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#5046e5] text-white font-bold text-xs hover:bg-[#3625cd] transition-colors cursor-pointer text-center disabled:opacity-50 shadow-xs"
                      >
                        새 비밀번호로 변경 후 로그인
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isExistingAccount && (
                <button
                  type="button"
                  onClick={() => handleCompleteEmailSignup(false)}
                  disabled={isSubmitting || !password || password !== passwordConfirm}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#5046e5] text-white font-bold text-sm shadow-md shadow-[#5046e5]/30 hover:bg-[#3625cd] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>계정 생성 및 로그인 중...</span>
                    </>
                  ) : (
                    <>
                      <span>회원가입 완료 및 로그인</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
              <p className="text-[10px] text-center text-[#777587]">
                가입 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
