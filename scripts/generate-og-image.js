import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d17"/>
      <stop offset="50%" stop-color="#11162b"/>
      <stop offset="100%" stop-color="#181e3a"/>
    </linearGradient>
    <radialGradient id="glowIndigo" cx="20%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#5046e5" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#5046e5" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowCyan" cx="80%" cy="70%" r="45%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c7d2fe"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e2540" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#141a30" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="630" fill="url(#glowIndigo)"/>
  <rect width="1200" height="630" fill="url(#glowCyan)"/>

  <!-- Left Content Area -->
  <g transform="translate(90, 110)">
    <!-- App Brand Logo Icon + Badge -->
    <g>
      <rect x="0" y="0" width="80" height="80" rx="22" fill="#5046e5" filter="url(#shadow)"/>
      <!-- Sparkle Icon -->
      <path d="M40 22L44 34L56 38L44 42L40 54L36 42L24 38L36 34Z" fill="#ffffff"/>
      <circle cx="53" cy="25" r="3.5" fill="#a5b4fc"/>
      <circle cx="27" cy="51" r="2.5" fill="#a5b4fc"/>
    </g>

    <!-- Top Badge -->
    <g transform="translate(100, 18)">
      <rect x="0" y="0" width="220" height="38" rx="19" fill="#1e2648" stroke="#374151" stroke-width="1.5"/>
      <circle cx="20" cy="19" r="6" fill="#10b981"/>
      <text x="36" y="24" fill="#a5b4fc" font-family="'Pretendard', sans-serif" font-size="14" font-weight="700">AI 기반 스마트 링크 보관함</text>
    </g>

    <!-- Headline -->
    <text x="0" y="160" fill="url(#textGrad)" font-family="'Pretendard', sans-serif" font-size="62" font-weight="800" letter-spacing="-1.5">ClipSort</text>

    <!-- Subheadline -->
    <text x="0" y="215" fill="#ffffff" font-family="'Pretendard', sans-serif" font-size="28" font-weight="700">
      영상 링크만 붙여넣으면, AI가 주제별 자동 분류
    </text>

    <!-- Description -->
    <text x="0" y="260" fill="#94a3b8" font-family="'Pretendard', sans-serif" font-size="19" font-weight="400">
      유튜브 · 인스타그램 · 틱톡 영상들을 카테고리별로 깔끔하게 정리하세요.
    </text>

    <!-- Feature Pills -->
    <g transform="translate(0, 315)">
      <!-- Pill 1 -->
      <rect x="0" y="0" width="160" height="42" rx="12" fill="#18203c" stroke="#4f46e5" stroke-opacity="0.4" stroke-width="1.5"/>
      <text x="20" y="26" fill="#e0e7ff" font-family="'Pretendard', sans-serif" font-size="15" font-weight="600">✨ AI 자동 카테고리</text>

      <!-- Pill 2 -->
      <rect x="175" y="0" width="150" height="42" rx="12" fill="#18203c" stroke="#4f46e5" stroke-opacity="0.4" stroke-width="1.5"/>
      <text x="195" y="26" fill="#e0e7ff" font-family="'Pretendard', sans-serif" font-size="15" font-weight="600">⚡️ 초고속 클라우드</text>

      <!-- Pill 3 -->
      <rect x="340" y="0" width="170" height="42" rx="12" fill="#18203c" stroke="#4f46e5" stroke-opacity="0.4" stroke-width="1.5"/>
      <text x="360" y="26" fill="#e0e7ff" font-family="'Pretendard', sans-serif" font-size="15" font-weight="600">📱 PC &amp; 모바일 앱 지원</text>
    </g>
  </g>

  <!-- Right Graphic Area: Visual Mock Preview Card -->
  <g transform="translate(690, 85)" filter="url(#shadow)">
    <!-- Container Card -->
    <rect x="0" y="0" width="430" height="460" rx="28" fill="url(#cardGrad)" stroke="#2e385c" stroke-width="2"/>

    <!-- Header simulation -->
    <g transform="translate(30, 32)">
      <circle cx="12" cy="12" r="6" fill="#ef4444"/>
      <circle cx="32" cy="12" r="6" fill="#eab308"/>
      <circle cx="52" cy="12" r="6" fill="#22c55e"/>
      <text x="80" y="16" fill="#64748b" font-family="'Pretendard', sans-serif" font-size="13" font-weight="600">clipsort.app</text>
    </g>

    <!-- Simulated Category Pills -->
    <g transform="translate(30, 80)">
      <rect x="0" y="0" width="56" height="30" rx="15" fill="#5046e5"/>
      <text x="17" y="19" fill="#ffffff" font-family="'Pretendard', sans-serif" font-size="12" font-weight="700">전체</text>

      <rect x="66" y="0" width="65" height="30" rx="15" fill="#1e2744" stroke="#334155"/>
      <text x="80" y="19" fill="#94a3b8" font-family="'Pretendard', sans-serif" font-size="12" font-weight="600">음식 🍳</text>

      <rect x="141" y="0" width="65" height="30" rx="15" fill="#1e2744" stroke="#334155"/>
      <text x="155" y="19" fill="#94a3b8" font-family="'Pretendard', sans-serif" font-size="12" font-weight="600">운동 🏃</text>

      <rect x="216" y="0" width="65" height="30" rx="15" fill="#1e2744" stroke="#334155"/>
      <text x="230" y="19" fill="#94a3b8" font-family="'Pretendard', sans-serif" font-size="12" font-weight="600">여행 ✈️</text>

      <rect x="291" y="0" width="65" height="30" rx="15" fill="#1e2744" stroke="#334155"/>
      <text x="305" y="19" fill="#94a3b8" font-family="'Pretendard', sans-serif" font-size="12" font-weight="600">테크 💻</text>
    </g>

    <!-- Simulated Video Card 1 -->
    <g transform="translate(30, 130)">
      <rect x="0" y="0" width="370" height="135" rx="18" fill="#151b32" stroke="#252f52" stroke-width="1.5"/>
      <rect x="14" y="15" width="105" height="105" rx="12" fill="#2d3758"/>
      <!-- Play button icon on thumbnail -->
      <circle cx="66" cy="67" r="18" fill="#000000" fill-opacity="0.6"/>
      <path d="M62 60L74 67L62 74Z" fill="#ffffff"/>

      <rect x="132" y="20" width="60" height="20" rx="6" fill="#3b2b64"/>
      <text x="142" y="34" fill="#c084fc" font-family="'Pretendard', sans-serif" font-size="11" font-weight="700">음식 · AI</text>

      <text x="132" y="65" fill="#ffffff" font-family="'Pretendard', sans-serif" font-size="15" font-weight="700">초간단 5분 원팬 파스타 레시피</text>
      <text x="132" y="88" fill="#64748b" font-family="'Pretendard', sans-serif" font-size="12">YouTube · 요리하는 하루</text>

      <rect x="132" y="103" width="70" height="18" rx="9" fill="#10b981" fill-opacity="0.15"/>
      <text x="140" y="116" fill="#34d399" font-family="'Pretendard', sans-serif" font-size="10" font-weight="600">✓ 자동 분류됨</text>
    </g>

    <!-- Simulated Video Card 2 -->
    <g transform="translate(30, 285)">
      <rect x="0" y="0" width="370" height="135" rx="18" fill="#151b32" stroke="#252f52" stroke-width="1.5"/>
      <rect x="14" y="15" width="105" height="105" rx="12" fill="#2d3758"/>
      <!-- Play button icon on thumbnail -->
      <circle cx="66" cy="67" r="18" fill="#000000" fill-opacity="0.6"/>
      <path d="M62 60L74 67L62 74Z" fill="#ffffff"/>

      <rect x="132" y="20" width="60" height="20" rx="6" fill="#1e3a5f"/>
      <text x="142" y="34" fill="#60a5fa" font-family="'Pretendard', sans-serif" font-size="11" font-weight="700">운동 · AI</text>

      <text x="132" y="65" fill="#ffffff" font-family="'Pretendard', sans-serif" font-size="15" font-weight="700">집에서 15분 하체 루틴 홈트레이닝</text>
      <text x="132" y="88" fill="#64748b" font-family="'Pretendard', sans-serif" font-size="12">Instagram Reels · 핏라이프</text>

      <rect x="132" y="103" width="70" height="18" rx="9" fill="#10b981" fill-opacity="0.15"/>
      <text x="140" y="116" fill="#34d399" font-family="'Pretendard', sans-serif" font-size="10" font-weight="600">✓ 자동 분류됨</text>
    </g>
  </g>
</svg>
`;

async function main() {
  const outputPath = path.resolve('public/og-image.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);
  console.log('og-image.png generated at:', outputPath);
}

main().catch(console.error);
