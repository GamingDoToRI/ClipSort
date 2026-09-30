import React from 'react';

interface PrivacyDetailSubViewProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const PrivacyDetailSubView: React.FC<PrivacyDetailSubViewProps> = ({
  onBack,
  onShowToast,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-1 py-3 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#dae2fd]/40">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#eaedff] transition-transform duration-150 active:scale-[0.95] text-[#131b2e] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
          <h1 className="font-bold text-base text-[#131b2e] tracking-tight">개인정보 처리방침</h1>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onShowToast('개인정보 처리방침 링크가 복사되었습니다')}
            className="p-2 text-[#777587] hover:text-[#5046e5] rounded-full hover:bg-[#eaedff] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-1 pt-3">
        {/* Top Meta Badge & Intro */}
        <div className="pt-2 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eaedff] border border-[#dae2fd]/50 text-[#3625cd] text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>최종 개정일: 2025년 1월 1일</span>
          </div>
          <p className="text-xs text-[#464555] leading-relaxed">
            ClipSort는 이용자의 개인정보를 안전하게 보호하며, '개인정보 보호법' 등 관련 법령을 엄격히 준수합니다. 본 방침은 북마크 관리 및 AI 분류 과정에서 수집되는 정보의 처리 투명성을 안내합니다.
          </p>
        </div>

        {/* Highlights Section (Bento Card Pattern) */}
        <section className="mt-2 space-y-3">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="material-symbols-outlined text-[#5046e5] text-[18px]">
              verified_user
            </span>
            <h2 className="text-xs font-bold text-[#131b2e]">주요 개인정보 보호 조항 요약</h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Item 1: Collected items */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">dataset</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-[#131b2e]">수집하는 개인정보 항목</h3>
                  <p className="text-xs text-[#777587] leading-relaxed">
                    이메일(계정 식별 및 동기화 키), 저장 링크 URL 메타데이터(타이틀, 썸네일 경로, 북마크 태그)
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#f2f3ff] text-[#5046e5] text-[11px] font-semibold">
                      필수 계정 정보
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#f2f3ff] text-[#464555] text-[11px] font-medium">
                      콘텐츠 메타데이터
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2: Purpose */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5] shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-[#131b2e]">개인정보 수집 및 이용 목적</h3>
                  <p className="text-xs text-[#777587] leading-relaxed">
                    디바이스 간 실시간 북마크 동기화, 사용자 맞춤형 AI 분류 모델 정확도 개선
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#f2f3ff] text-[#00687a] text-[11px] font-semibold">
                      실시간 동기화
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#f2f3ff] text-[#5046e5] text-[11px] font-semibold">
                      AI 자동 분류
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 3: Retention & Disposal */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#ba1a1a] shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-[#131b2e]">보유 및 이용 기간</h3>
                  <p className="text-xs text-[#777587] leading-relaxed">
                    회원 탈퇴 시 즉시 영구 파기 원칙. 법령에 특별한 규정이 있는 경우 해당 법정 기간 동안 암호화 보관 후 지체 없이 삭제합니다.
                  </p>
                  <div className="pt-1">
                    <span className="px-2 py-0.5 rounded bg-[#ffdad6]/40 text-[#ba1a1a] text-[11px] font-bold">
                      탈퇴 즉시 비가역적 파기
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clauses Section */}
        <section className="mt-5 space-y-3">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="material-symbols-outlined text-[#5046e5] text-[18px]">gavel</span>
            <h2 className="text-xs font-bold text-[#131b2e]">상세 처리 조항</h2>
          </div>

          <article className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs space-y-1.5">
            <h4 className="text-xs font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5046e5] inline-block" />
              제1조 (개인정보의 제3자 제공 및 위탁)
            </h4>
            <p className="text-xs text-[#464555] leading-relaxed">
              ClipSort는 원칙적으로 이용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다. 클라우드 인프라 안정성 유지를 위해 신뢰받는 보안 인프라 제공처(Google Cloud)에 암호화된 상태로 데이터 처리를 위탁하고 있습니다.
            </p>
          </article>

          <article className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs space-y-1.5">
            <h4 className="text-xs font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5046e5] inline-block" />
              제2조 (정보주체의 권리 및 행사 방법)
            </h4>
            <p className="text-xs text-[#464555] leading-relaxed">
              이용자는 앱 내 설정 메뉴를 통해 언제든지 등록된 개인정보의 열람, 정정 및 삭제를 요구할 수 있습니다.
            </p>
          </article>

          <article className="p-3.5 rounded-2xl bg-white border border-[#dae2fd]/60 shadow-xs space-y-1.5">
            <h4 className="text-xs font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5046e5] inline-block" />
              제3조 (개인정보 보호책임자 및 고충처리)
            </h4>
            <p className="text-xs text-[#464555] leading-relaxed">
              개인정보 처리에 관한 문의 및 피해구제는 전담 보호책임 부서로 문의하시면 신속하게 답변드립니다.
            </p>
            <div className="mt-2 p-2.5 rounded-xl bg-[#f2f3ff] border border-[#dae2fd]/40 flex flex-col gap-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#777587]">담당부서</span>
                <span className="font-semibold text-[#131b2e]">데이터 보안 총괄팀</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777587]">연락처</span>
                <a className="text-[#5046e5] font-semibold hover:underline" href="mailto:privacy@clipsort.app">
                  privacy@clipsort.app
                </a>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

