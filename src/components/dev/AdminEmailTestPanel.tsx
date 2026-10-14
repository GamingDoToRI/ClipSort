import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert, Sparkles, X } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface AdminEmailTestPanelProps {
  currentUserId?: string;
  currentUserEmail?: string;
  isLoggedIn: boolean;
  onShowToast: (msg: string) => void;
}

export const AdminEmailTestPanel: React.FC<AdminEmailTestPanelProps> = ({
  currentUserId,
  currentUserEmail,
  isLoggedIn,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: number;
    success: boolean;
    message?: string;
    emailId?: string;
    recipient?: string;
    missingVariables?: string[];
  } | null>(null);

  // In production Vite build, import.meta.env.DEV is false.
  // The user requested: "개발 환경에서만 표시되는 임시 테스트 버튼을 만들어 주세요."
  // "테스트 버튼은 개발 환경에서만 표시하고 운영 배포에서는 제거해 주세요."
  const isDevMode = import.meta.env.DEV;

  if (!isDevMode) {
    return null;
  }

  const handleSendTest = async () => {
    setLastResult(null);

    // 1. Check user login state before calling API
    if (!isLoggedIn || !auth.currentUser) {
      const msg = '로그인 상태가 아닙니다. 먼저 상단의 Google 로그인으로 로그인해 주세요.';
      setLastResult({
        status: 401,
        success: false,
        message: msg,
      });
      onShowToast(msg);
      return;
    }

    setIsLoading(true);
    try {
      // 2. Safely obtain Firebase ID Token internally without printing it to console/screen
      const idToken = await auth.currentUser.getIdToken(true);

      // 3. Call POST /api/send-test-email
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          // also pass in body as fallback
          idToken,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setLastResult({
          status: response.status,
          success: true,
          message: data.message || '테스트 이메일이 성공적으로 발송되었습니다.',
          emailId: data.emailId,
          recipient: data.recipient,
        });
        onShowToast('Resend 테스트 이메일이 발송되었습니다!');
      } else {
        const errorMsg =
          data?.error || `이메일 발송 실패 (HTTP ${response.status} ${response.statusText})`;
        setLastResult({
          status: response.status,
          success: false,
          message: errorMsg,
          missingVariables: data?.missingVariables,
        });
        onShowToast(`발송 실패: ${errorMsg}`);
      }
    } catch (err: any) {
      const netErrorMsg = err?.message || '네트워크 연결 오류가 발생했습니다.';
      setLastResult({
        status: 0,
        success: false,
        message: netErrorMsg,
      });
      onShowToast(`요청 실패: ${netErrorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-sm">
      {/* Dev Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 text-amber-300 hover:bg-slate-800 text-xs font-semibold shadow-xl border border-amber-400/40 active:scale-95 transition-all cursor-pointer"
          title="[개발자 전용] Resend 이메일 발송 테스트 패널 열기"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>[DEV] 이메일 발송 테스트</span>
        </button>
      )}

      {/* Expanded Test Card */}
      {isOpen && (
        <div className="w-84 sm:w-96 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Resend 이메일 발송 테스트
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono">
                    DEV ONLY
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">관리자 Firebase Auth 인증 기반 발송</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs">
            {/* Status overview */}
            <div className="bg-slate-800/80 rounded-lg p-2.5 space-y-1 text-[11px] border border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">엔드포인트:</span>
                <span className="font-mono text-slate-200">POST /api/send-test-email</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">로그인 상태:</span>
                <span className={isLoggedIn ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {isLoggedIn ? '인증됨' : '미로그인 (로그인 필요)'}
                </span>
              </div>
              {currentUserEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">계정 이메일:</span>
                  <span className="text-slate-200 truncate max-w-[170px]">{currentUserEmail}</span>
                </div>
              )}
              {currentUserId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">내 UID:</span>
                  <span className="font-mono text-slate-300 text-[10px] truncate max-w-[170px]">
                    {currentUserId}
                  </span>
                </div>
              )}
            </div>

            {/* Test Action Button */}
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Firebase 토큰 인증 및 발송 중...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>테스트 이메일 지금 발송하기</span>
                </>
              )}
            </button>

            {/* Response result display */}
            {lastResult && (
              <div
                className={`rounded-xl p-3 border text-xs space-y-1.5 animate-in fade-in duration-150 ${
                  lastResult.success
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {lastResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">
                        HTTP {lastResult.status}: {lastResult.success ? '발송 성공' : '발송 실패'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed break-words">{lastResult.message}</p>
                    {lastResult.missingVariables && lastResult.missingVariables.length > 0 && (
                      <div className="p-2 rounded bg-rose-900/40 border border-rose-700/40 text-[10px] space-y-0.5">
                        <span className="font-semibold text-rose-300">누락된 환경변수:</span>
                        <ul className="list-disc list-inside text-rose-200 font-mono">
                          {lastResult.missingVariables.map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {lastResult.recipient && (
                      <div className="text-[10px] text-slate-300">
                        수신처: <span className="font-mono text-emerald-300">{lastResult.recipient}</span>
                      </div>
                    )}
                    {lastResult.emailId && (
                      <div className="text-[10px] text-slate-300">
                        Resend ID: <span className="font-mono text-emerald-300">{lastResult.emailId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              토큰/키는 안전하게 보호됩니다
            </span>
            <span className="text-slate-400">운영 빌드 시 자동 제거됨</span>
          </div>
        </div>
      )}
    </div>
  );
};
