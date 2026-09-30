import React, { useState } from 'react';

interface OpenSourceSubViewProps {
  onBack: () => void;
}

const LIBRARIES = [
  {
    name: 'Tailwind CSS',
    version: 'v4.0',
    type: '유틸리티 우선 CSS 프레임워크',
    license: 'MIT',
    author: 'Copyright (c) Tailwind Labs, Inc.',
    body: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.',
  },
  {
    name: 'Plus Jakarta Sans',
    version: 'Font',
    type: '고가독성 모던 지오메트릭 산세리프 서체',
    license: 'OFL 1.1',
    author: 'Copyright (c) 2020 The Plus Jakarta Sans Project Authors',
    body: 'This Font Software is licensed under the SIL Open Font License, Version 1.1. This license is available with a FAQ at: http://scripts.sil.org/OFL',
  },
  {
    name: 'Material Symbols & Lucide',
    version: 'Icons',
    type: '직관적이고 일관된 시스템 UI 아이콘 셋',
    license: 'Apache 2.0',
    author: 'Copyright (c) Google LLC & Lucide Contributors',
    body: 'Licensed under the Apache License, Version 2.0. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0',
  },
  {
    name: 'Google GenAI SDK (@google/genai)',
    version: 'v2.4.0',
    type: '구글 차세대 Gemini AI 비디오 카테고리 추출 엔진',
    license: 'Apache 2.0',
    author: 'Copyright (c) Google LLC',
    body: 'Licensed under the Apache License, Version 2.0 (the "License"). You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0',
  },
  {
    name: 'React & React-DOM',
    version: 'v19.0',
    type: '고속 사용자 인터페이스 구축 라이브러리',
    license: 'MIT',
    author: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
    body: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.',
  },
];

export const OpenSourceSubView: React.FC<OpenSourceSubViewProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');

  const filtered = LIBRARIES.filter(
    (lib) =>
      lib.name.toLowerCase().includes(search.toLowerCase()) ||
      lib.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-1 py-3 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#dae2fd]/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#eaedff] active:scale-95 transition-transform text-[#131b2e] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
          <h1 className="font-bold text-base text-[#131b2e] tracking-tight">오픈소스 라이선스</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-1 pt-3 flex flex-col gap-4">
        {/* Summary Banner */}
        <section className="rounded-2xl bg-[#eaedff] p-4 flex gap-3 items-start border border-[#dae2fd]/50">
          <div className="w-8 h-8 rounded-lg bg-[#5046e5] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#3625cd] font-bold">오픈소스 소프트웨어 고지</span>
            <p className="text-xs text-[#464555] leading-relaxed">
              본 서비스는 오픈소스 소프트웨어를 준수하며, 각 라이브러리의 저작권 및 라이선스 고지 의무를 이행합니다. 기여해 주신 모든 개발자 분들께 감사드립니다.
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#777587] text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="라이브러리 검색 (예: Tailwind, React, Lucide 등)"
            className="w-full bg-white text-[#131b2e] placeholder-[#777587] text-xs rounded-xl py-2.5 pl-10 pr-4 border border-[#dae2fd] focus:outline-none focus:border-[#5046e5] shadow-xs"
          />
        </div>

        {/* Statistics */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-[#464555]">
            포함된 라이브러리 <strong className="text-[#5046e5] font-bold">{filtered.length}개</strong>
          </span>
          <span className="text-[11px] text-[#777587]">모바일 기기 내부 AI 탑재</span>
        </div>

        {/* License Cards */}
        <div className="flex flex-col gap-2.5">
          {filtered.map((lib, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl p-4 border border-[#dae2fd]/60 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-[#131b2e]">{lib.name}</h2>
                    <span className="text-[11px] text-[#777587]">{lib.version}</span>
                  </div>
                  <p className="text-xs text-[#464555] mt-0.5">{lib.type}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#5046e5] text-[11px] font-bold shrink-0">
                  {lib.license}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#dae2fd]/30 flex flex-col gap-1">
                <span className="text-[11px] text-[#777587]">저작권: {lib.author}</span>
                <details className="group mt-1">
                  <summary className="list-none flex items-center justify-between text-[#5046e5] text-xs font-semibold cursor-pointer pt-0.5 select-none hover:underline">
                    <span>라이선스 전문 보기</span>
                    <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">
                      expand_more
                    </span>
                  </summary>
                  <div className="mt-2 p-2.5 rounded-xl bg-[#f2f3ff] text-[11px] text-[#464555] leading-relaxed">
                    <p>{lib.body}</p>
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="pt-2 text-center text-xs text-[#777587]">
          <p>ClipSort v1.0.0 • All rights reserved</p>
        </footer>
      </main>
    </div>
  );
};
