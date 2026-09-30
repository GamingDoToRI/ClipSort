import React from 'react';

interface TermsDetailSubViewProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const TermsDetailSubView: React.FC<TermsDetailSubViewProps> = ({
  onBack,
  onShowToast,
}) => {
  const handleShareTerms = () => {
    navigator.clipboard?.writeText(window.location.href);
    onShowToast('약관 링크가 복사되었습니다');
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Top App Bar (Sub-page Header) */}
      <header className="sticky top-0 z-40 bg-[#faf8ff]/95 backdrop-blur-md px-1 py-3 flex items-center justify-between border-b border-[#dae2fd]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-[#131b2e] hover:bg-[#eaedff] active:scale-[0.95] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <h1 className="font-bold text-base text-[#131b2e] tracking-tight">이용약관</h1>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="공유"
            onClick={handleShareTerms}
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#464555] hover:bg-[#eaedff] active:scale-[0.95] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-1 pt-4">
        {/* Meta Summary Bento Pill */}
        <div className="mb-5 p-4 bg-white rounded-2xl border border-[#dae2fd]/60 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#5046e5]">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <span className="block text-xs text-[#131b2e] font-bold">ClipSort 서비스 이용약관</span>
              <span className="block text-[11px] text-[#777587]">버전 2.4 (최신 개정본)</span>
            </div>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 bg-[#eaedff] rounded-full">
            <span className="text-[11px] font-semibold text-[#5046e5]">시행: 2025.01.01</span>
          </div>
        </div>

        {/* Quick Navigation Anchor Pills */}
        <section className="mb-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
          <a
            className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#dae2fd]/70 text-[#464555] hover:text-[#5046e5] text-xs font-semibold transition-colors"
            href="#article-1"
          >
            제1조 목적
          </a>
          <a
            className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#dae2fd]/70 text-[#464555] hover:text-[#5046e5] text-xs font-semibold transition-colors"
            href="#article-2"
          >
            제2조 정의
          </a>
          <a
            className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#dae2fd]/70 text-[#464555] hover:text-[#5046e5] text-xs font-semibold transition-colors"
            href="#article-3"
          >
            제3조 제공 및 변경
          </a>
          <a
            className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#dae2fd]/70 text-[#464555] hover:text-[#5046e5] text-xs font-semibold transition-colors"
            href="#article-4"
          >
            제4조 의무 및 저작권
          </a>
        </section>

        {/* Document Viewer Container */}
        <article className="bg-white rounded-2xl border border-[#dae2fd]/60 p-5 shadow-xs divide-y divide-[#dae2fd]/30">
          {/* Article 1 */}
          <section className="py-4 first:pt-1 scroll-mt-20" id="article-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1.5 h-4 bg-[#5046e5] rounded-full" />
              <h2 className="text-sm text-[#131b2e] font-bold">제1조 (목적)</h2>
            </div>
            <p className="text-xs text-[#464555] leading-relaxed text-justify">
              본 약관은 <strong className="font-semibold text-[#131b2e]">ClipSort</strong>(이하 '회사')가 모바일 및 웹 환경에서 제공하는 영상 링크 자동 분류, 메타데이터 추출 및 북마크 아카이빙 서비스(이하 '서비스')의 이용 조건과 절차에 관한 권리, 의무 및 제반 책임 사항을 명확히 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* Article 2 */}
          <section className="py-4 scroll-mt-20" id="article-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1.5 h-4 bg-[#5046e5] rounded-full" />
              <h2 className="text-sm text-[#131b2e] font-bold">제2조 (용어의 정의)</h2>
            </div>
            <p className="text-xs text-[#464555] mb-3 leading-relaxed">
              본 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]/40">
                <h3 className="text-xs text-[#131b2e] font-bold mb-1">1. 서비스</h3>
                <p className="text-[11px] text-[#777587] leading-normal">
                  단말기(스마트폰, 태블릿 등)를 통하여 회원이 등록한 웹 상의 비디오 URL을 파싱하여 AI 엔진을 통해 카테고리를 자동 생성 및 분류하고 개인화된 보관함에 영구 저장할 수 있도록 지원하는 제반 시스템을 의미합니다.
                </p>
              </div>
              <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]/40">
                <h3 className="text-xs text-[#131b2e] font-bold mb-1">2. 회원</h3>
                <p className="text-[11px] text-[#777587] leading-normal">
                  본 약관에 동의하고 회사가 정한 절차에 따라 계정을 생성하거나 익명 토큰 인증을 통해 회사가 제공하는 모든 분류 기능을 지속적으로 이용하는 자를 지칭합니다.
                </p>
              </div>
              <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#dae2fd]/40">
                <h3 className="text-xs text-[#131b2e] font-bold mb-1">3. 북마크 콘텐츠</h3>
                <p className="text-[11px] text-[#777587] leading-normal">
                  회원이 외부 플랫폼(유튜브, 인스타그램, 틱톡, 엑스 등)에서 복사하여 서비스 내에 수집·분류 목적으로 등록한 URL 링크 주소, 영상 썸네일 캐시 및 자동 추출된 태그 정보를 뜻합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Article 3 */}
          <section className="py-4 scroll-mt-20" id="article-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1.5 h-4 bg-[#5046e5] rounded-full" />
              <h2 className="text-sm text-[#131b2e] font-bold">제3조 (서비스의 제공 및 변경)</h2>
            </div>
            <div className="space-y-2 text-xs text-[#464555] leading-relaxed">
              <p>
                ① 회사는 회원에게 다음과 같은 기술적 유틸리티 기능을 연중무휴 24시간 원칙으로 제공합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#777587]">
                <li><strong className="text-[#131b2e]">AI 메타데이터 자동 분류:</strong> 저장된 링크를 인공지능 알고리즘이 분석하여 주제별 스마트 폴더로 즉시 라벨링하는 작업.</li>
                <li><strong className="text-[#131b2e]">외부 SNS 플랫폼 링크 파싱:</strong> 제3자 동영상 플랫폼의 공개 OpenGraph 및 공공 API를 기반으로 썸네일, 제목, 채널 정보를 비간섭 형태로 수집하는 기능.</li>
                <li><strong className="text-[#131b2e]">원탭 카테고리 퀵 스위처:</strong> 저장된 분류값을 사용자의 탭 한 번으로 자유롭게 수정 및 동기화할 수 있는 인터페이스.</li>
              </ul>
              <p>
                ② 회사는 기술적 사양의 변경이나 제3자 플랫폼의 정책 변화에 따라 서비스의 전부 또는 일부를 수정하거나 중단할 수 있으며, 이 경우 앱 내 알림을 통해 고지합니다.
              </p>
            </div>
          </section>

          {/* Article 4 */}
          <section className="py-4 last:pb-1 scroll-mt-20" id="article-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-1.5 h-4 bg-[#5046e5] rounded-full" />
              <h2 className="text-sm text-[#131b2e] font-bold">제4조 (회원의 의무 및 저작권)</h2>
            </div>
            <div className="space-y-3 text-xs text-[#464555] leading-relaxed">
              <div className="p-3 bg-[#eaedff]/60 rounded-xl border-l-4 border-[#5046e5]">
                <p className="text-[11px] text-[#131b2e] font-medium leading-relaxed">
                  중요: 회원은 타인의 저작권을 존중해야 하며, 서비스 내에 보관하는 모든 콘텐츠는 법률에 저촉되지 않는 적법한 공개 웹 링크에 한정되어야 합니다.
                </p>
              </div>
              <p>
                ① 회원이 등록한 영상 자체의 저작권은 해당 영상을 제작하고 게시한 원작자 및 외부 플랫폼에 귀속되며, ClipSort는 해당 영상 파일 원본을 서버에 직접 복제하거나 저장·재배포하지 않습니다.
              </p>
              <p>
                ② 회원은 다음과 같은 행위를 하여서는 안 되며, 위반 시 회사는 사전 통보 없이 해당 북마크 데이터를 삭제하거나 계정 이용을 제한할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#777587]">
                <li>비공개 상태이거나 허가받지 않은 폐쇄형 유료 영상의 링크를 불법적인 방식으로 아카이빙하는 행위</li>
                <li>타인의 명예를 훼손하거나 음란·유해 사이트로 직접 연결되는 악성 링크를 서비스에 주입하는 행위</li>
                <li>서비스의 AI 파서 서버에 비정상적인 트래픽을 유발하여 시스템의 정상 운영을 방해하는 행위</li>
              </ul>
            </div>
          </section>

          {/* Document Footer Meta */}
          <div className="pt-4 pb-1 flex flex-col gap-1 text-[11px] text-[#777587]">
            <span>공고일자: 2024년 12월 24일</span>
            <span>시행일자: 2025년 1월 1일</span>
            <p className="pt-2 text-[#777587]">
              약관 내용에 관한 문의사항은 ClipSort 고객지원센터(support@clipsort.app)로 접수해주시기 바랍니다.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
};
