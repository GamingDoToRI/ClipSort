import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// YouTube ID extractor
function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
      }
      return parsed.searchParams.get('v');
    } else if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0];
    }
  } catch {
    // fallback regex
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Standard Major (대분류) Categories System:
 * - 음식: 요리, 레시피, 맛집, 먹방, 길거리음식, 부대찌개, 디저트, 카페, 식당 투어 등 모든 음식 관련
 * - 운동: 헬스, 홈트, 피트니스, 스트레칭, 다이어트 및 모든 스포츠 종목 (야구, 축구, 농구, 러닝, 골프 등)
 * - 여행: 국내/해외 여행, 숙소, 호텔, 항공, 명소, 관광 브이로그
 * - 테크: 전자기기, 스마트폰, 맥북/컴퓨터, 코딩/IT, AI, 소프트웨어 리뷰
 * - 자기계발: 독서, 공부, 시간관리, 아침루틴, 생산성, 재테크, 주식, 동기부여
 * - 패션/뷰티: 메이크업, 스킨케어, 데일리룩, 코디, 헤어 스타일링
 * - 음악/댄스: 노래, 댄스 안무, 커버 영상, 악기, 플레이리스트
 * - 예능/유머: 개그, 예능 클립, 밈, 웃긴 영상
 * - 반려동물: 강아지, 고양이, 펫 일상
 * - 영화/드라마: 영화 리뷰, 드라마 명장면, 애니메이션
 * - 라이프스타일: 인테리어, 청소, 일상 브이로그, 룸투어
 */
function ruleBasedClassify(
  title: string,
  url: string,
  thumbnail: string = '',
  excludedCategories: string[] = [],
  existingCategories: string[] = []
): string {
  const text = `${title} ${url} ${thumbnail}`.toLowerCase();
  const excluded = new Set(excludedCategories.map((c) => c.trim().toLowerCase()));

  // 1. 음식 (대분류: 맛집, 먹방, 요리, 레시피, 부대찌개, 베이킹, 카페 등 음식 관련 전반)
  if (
    !excluded.has('음식') &&
    /(음식|맛집|먹방|요리|레시피|쿡|찌개|파스타|베이킹|식단|밥|라면|디저트|브런치|반찬|국|탕|조리|간식|카페|베이커리|떡볶이|치킨|피자|바베큐|부대찌개|고기|골목|식당|미식|안주|cook|recipe|food|chef|baking|pasta|noodle|mukbang|dessert|kitchen|dish|restaurant)/i.test(
      text
    )
  ) {
    return '음식';
  }

  // 2. 운동 (대분류: 헬스, 홈트, 스트레칭 및 야구/축구/골프 등 모든 세부 스포츠 종목 포괄)
  if (
    !excluded.has('운동') &&
    /(운동|헬스|홈트|피트니스|다이어트|스트레칭|근육|러닝|필라테스|요가|스쿼트|벌크업|루틴|체지방|복근|하체|상체|등운동|가슴운동|웨이트|스포츠|야구|축구|농구|골프|테니스|수영|kbo|mlb|홈런|삼진|투수|타자|안타|선수|workout|fitness|gym|health|diet|stretch|pilates|yoga|running|training|sports|soccer|baseball|bodybuilding)/i.test(
      text
    )
  ) {
    return '운동';
  }

  // 3. 여행 (Travel / Tourism / Trip / Tour)
  if (
    !excluded.has('여행') &&
    /(여행|도쿄|오사카|교토|후쿠오카|유럽|제주|호텔|항공|브이로그|관광|명소|해외여행|국내여행|비행기|숙소|리조트|휴가|공항|맛집투어|호캉스|여권|패키지|travel|trip|tour|vlog|japan|tokyo|kyoto|osaka|hotel|flight|resort|vacation|sightseeing)/i.test(
      text
    )
  ) {
    return '여행';
  }

  // 4. 테크 (Tech / Gadgets / IT / Coding / AI)
  if (
    !excluded.has('테크') &&
    /(테크|개발|맥북|아이폰|갤럭시|코딩|인공지능|ai|it|스마트폰|소프트웨어|하드웨어|리뷰|기기|전자기기|태블릿|아이패드|애플|삼성|컴퓨터|노트북|모니터|프로그래밍|gadget|tech|code|apple|samsung|macbook|iphone|galaxy|software|hardware|laptop|monitor|programming|developer)/i.test(
      text
    )
  ) {
    return '테크';
  }

  // 5. 자기계발 (Self-Improvement / Productivity / Study / Finance)
  if (
    !excluded.has('자기계발') &&
    /(자기계발|독서|생산성|공부|동기부여|시간관리|마인드셋|재테크|주식|성공|습관|아침루틴|모닝루틴|학습|자격증|영어|외국어|회화|커리어|취업|이직|부자|투자|부동산|study|productivity|book|mindset|routine|habit|motivation|career|finance|investment|growth)/i.test(
      text
    )
  ) {
    return '자기계발';
  }

  // 6. 패션/뷰티 (Fashion / Beauty / Makeup / Styling)
  if (
    !excluded.has('패션/뷰티') &&
    /(패션|뷰티|메이크업|스킨케어|코디|스타일|헤어|착장|오오티디|향수|립스틱|피부|옷|화장|화장품|룩북|ootd|fashion|beauty|makeup|style|hair|skincare|cosmetics|lookbook|outfit)/i.test(
      text
    )
  ) {
    return '패션/뷰티';
  }

  // 7. 음악/댄스 (Music / Dance / Song / Performance)
  if (
    !excluded.has('음악/댄스') &&
    /(음악|노래|기타|피아노|댄스|안무|플레이리스트|커버|보컬|악기|밴드|음원|가요|kpop|아이돌|콘서트|cover|music|dance|song|playlist|choreo|vocal|guitar|piano|concert|band)/i.test(
      text
    )
  ) {
    return '음악/댄스';
  }

  // 8. 예능/유머 (Entertainment / Humor)
  if (
    !excluded.has('예능/유머') &&
    /(예능|유머|웃긴|개그|코미디|쇼츠|밈|웃음|꿀잼|몰카|토크|comedy|humor|funny|meme|entertainment)/i.test(
      text
    )
  ) {
    return '예능/유머';
  }

  // 9. 반려동물 (Pets / Animals)
  if (
    !excluded.has('반려동물') &&
    /(반려동물|강아지|고양이|댕댕이|냥이|애견|애묘|포메라니안|골든리트리버|동물|pet|dog|cat|puppy|kitten|animal)/i.test(
      text
    )
  ) {
    return '반려동물';
  }

  // 10. 영화/드라마 (Movies / Series)
  if (
    !excluded.has('영화/드라마') &&
    /(영화|드라마|넷플릭스|애니|시리즈|결말|리뷰|명장면|배우|시즌|movie|drama|netflix|cinema|anime|series)/i.test(
      text
    )
  ) {
    return '영화/드라마';
  }

  // 11. 게임 (Gaming)
  if (
    !excluded.has('게임') &&
    /(게임|롤|리그오브레전드|배틀그라운드|오버워치|발로란트|마인크래프트|스팀|닌텐도|플스|game|gaming|steam)/i.test(
      text
    )
  ) {
    return '게임';
  }

  // Existing category matching
  if (existingCategories.length > 0) {
    for (const ec of existingCategories) {
      if (ec && ec !== '전체' && !excluded.has(ec) && text.includes(ec.toLowerCase())) {
        return ec;
      }
    }
  }

  if (!excluded.has('라이프스타일')) {
    return '라이프스타일';
  }
  return '기타';
}

// AI Classifier using Gemini with multimodal thumbnail capability
async function classifyWithAI(
  title: string,
  url: string,
  thumbnail: string = '',
  excludedCategories: string[] = [],
  existingCategories: string[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI();
      const excludeInstruction =
        excludedCategories.length > 0
          ? `\n[절대 분류 금지 카테고리 (사용자가 이미 삭제한 카테고리)]: ${excludedCategories.join(
              ', '
            )}\n위 목록에 있는 카테고리로는 절대로 분류하지 마세요.`
          : '';

      const validExisting = existingCategories.filter((c) => c && c !== '전체' && !excludedCategories.includes(c));
      const existingList = validExisting.length > 0 ? validExisting.join(', ') : '음식, 운동, 여행, 테크, 자기계발, 패션/뷰티, 라이프스타일';

      const prompt = `당신은 영상 콘텐츠의 주제를 직관적이고 포괄적인 **대분류(Broad Category)**로 분류하는 스마트 AI 엔진입니다.
주어진 영상 제목, 썸네일 이미지 정보, 링크 정보를 종합 분석하여 가장 적합한 단 하나의 간결한 한국어 대분류 카테고리를 선택하세요.

[현재 앱의 카테고리 목록]:
${existingList}

[★ 핵심 대분류 분류 규칙]:
1. **음식 (대분류)**:
   - 맛집 탐방, 먹방, 길거리음식, 부대찌개/김치찌개/파스타 등 요리 및 레시피, 카페, 베이커리, 식당 투어 등 음식과 관련된 모든 영상은 세부적인 '요리'나 '맛집'으로 쪼개지 않고 **"음식"** 대분류로 통일하여 분류합니다.
2. **운동 (대분류)**:
   - 헬스, 홈트, 피트니스, 스트레칭뿐만 아니라 야구, 축구, 농구, 골프, 테니스, 러닝 등 **모든 세부 스포츠 종목이나 경기 영상은 별도의 세부 종목(야구, 축구 등)이나 외래어(스포츠)로 나누지 않고 포괄적인 "운동"** 카테고리로 통일하여 분류합니다.
3. **대분류 지향 원칙**:
   - 세부 종목이나 지나치게 좁은 소분류(예: 야구, 디저트, 파스타 등)를 만들지 마세요.
   - 단, 기존 대분류(음식, 운동, 여행, 테크, 자기계발, 패션/뷰티, 라이프스타일, 음악/댄스, 예능/유머, 반려동물, 영화/드라마 등)에 명백히 속하지 않는 전혀 새로운 영역(예: 게임, 주식/재테크 등)일 때만 직관적인 2~4글자 한국어 대분류를 생성하세요.${excludeInstruction}

영상 제목: "${title}"
영상 썸네일 URL: "${thumbnail}"
영상 링크: "${url}"

답변 규칙:
- 오직 카테고리 단어 하나만 정확히 출력하세요 (예: 음식, 운동, 여행, 테크, 자기계발).
- 인사말, 마크다운 따옴표, 괄호, 줄바꿈 등 부가적인 텍스트는 일절 출력하지 마세요.`;

      // Multimodal attempt if thumbnail image is accessible
      let imagePart: any = null;
      if (thumbnail && (thumbnail.startsWith('http://') || thumbnail.startsWith('https://'))) {
        try {
          const imgRes = await fetch(thumbnail, { signal: AbortSignal.timeout(2500) });
          if (imgRes.ok) {
            const arrayBuf = await imgRes.arrayBuffer();
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            if (mimeType.startsWith('image/')) {
              imagePart = {
                inlineData: {
                  data: Buffer.from(arrayBuf).toString('base64'),
                  mimeType,
                },
              };
            }
          }
        } catch {
          // Thumbnail download failed or timed out, continue with text prompt
        }
      }

      const contents = imagePart ? [prompt, imagePart] : prompt;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
      });

      const rawCategory = response.text?.trim().replace(/['"\[\]\n\r#*]/g, '');
      if (
        rawCategory &&
        rawCategory.length >= 2 &&
        rawCategory.length <= 10 &&
        !excludedCategories.includes(rawCategory)
      ) {
        // Normalize specific sport subcategories to 운동
        if (/^(야구|축구|농구|배구|골프|테니스|스포츠|sports|baseball)$/i.test(rawCategory)) {
          return '운동';
        }
        // Normalize specific cooking/recipe subcategories to 음식
        if (/^(요리|맛집|먹방|식당|레시피|cook|cooking|recipe)$/i.test(rawCategory)) {
          return '음식';
        }
        return rawCategory;
      }
    } catch (err) {
      console.warn('Gemini classification fallback to rule-based:', err);
    }
  }

  // Intelligent rule-based classifier fallback
  return ruleBasedClassify(title, url, thumbnail, excludedCategories, existingCategories);
}

// Extract metadata (oEmbed / OpenGraph / YouTube HTML)
async function extractMetadata(url: string) {
  let title = '';
  let thumbnail = '';
  let source: 'youtube' | 'instagram' | 'tiktok' | 'web' = 'web';

  // Fast-track known sample links for instant UI feedback
  if (url.includes('recipe_pasta') || url.includes('pasta_sample')) {
    return {
      title: '15분 만에 완성하는 원팬 파스타 초간단 레시피',
      thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
      source: 'youtube' as const,
    };
  }
  if (url.includes('workout_stretch') || url.includes('stretch_sample')) {
    return {
      title: '하루 10분 허리 통증 없애는 스트레칭 루틴',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
      source: 'youtube' as const,
    };
  }
  if (url.includes('travel_kyoto') || url.includes('kyoto_sample')) {
    return {
      title: '교토 3박 4일 필수 코스 & 숨은 골목 명소 완벽 가이드',
      thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
      source: 'instagram' as const,
    };
  }
  if (url.includes('productivity_routine') || url.includes('morning_sample')) {
    return {
      title: '집중력을 3배 올려주는 아침 루틴과 시간 관리법',
      thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      source: 'youtube' as const,
    };
  }
  if (url.includes('recipe_kimchi') || url.includes('kimchi_sample')) {
    return {
      title: '백종원의 집밥 비법! 깊고 진한 돼지고기 김치찌개 황금 레시피',
      thumbnail: 'https://img.youtube.com/vi/recipe_kimchi_sample/hqdefault.jpg',
      source: 'youtube' as const,
    };
  }
  if (url.includes('workout_core') || url.includes('fitness_sample')) {
    return {
      title: '하루 10분 복근 박살 내기! 초보자도 가능한 코어 버닝 루틴',
      thumbnail: 'https://img.youtube.com/vi/workout_core_sample/hqdefault.jpg',
      source: 'youtube' as const,
    };
  }
  if (url.includes('tokyo_travel') || url.includes('japan_sample')) {
    return {
      title: '도쿄 3박 4일 감성 여행 브이로그 ✈️ 시부야 신주쿠 맛집 총정리',
      thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
      source: 'instagram' as const,
    };
  }
  if (url.includes('macbook_setup') || url.includes('apple_sample')) {
    return {
      title: '맥북 프로 구매 후 무조건 해야 할 10가지 세팅 및 필수 앱 추천',
      thumbnail: 'https://img.youtube.com/vi/macbook_setup_sample/hqdefault.jpg',
      source: 'youtube' as const,
    };
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    source = 'youtube';
    thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

    // Try YouTube oEmbed first (fast & reliable)
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title) {
          title = data.title;
        }
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
        }
      }
    } catch {
      // ignore
    }

    // Secondary fetch: YouTube page HTML if oEmbed didn't provide good title
    if (!title || title.includes(`유튜브 영상 (${ytId})`)) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(3000),
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const titleMatch =
            html.match(/<meta\s+name=["']title["']\s+content=["'](.*?)["']/i) ||
            html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
            html.match(/<title>(.*?)<\/title>/i);

          if (titleMatch && titleMatch[1]) {
            const rawTitle = titleMatch[1].replace(/ - YouTube$/, '').trim();
            if (rawTitle && rawTitle !== 'YouTube') {
              title = rawTitle;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!title) {
      title = `유튜브 영상 (${ytId})`;
    }
  } else {
    // Other platforms (Instagram, TikTok, Web)
    if (url.includes('instagram.com')) {
      source = 'instagram';
    } else if (url.includes('tiktok.com')) {
      source = 'tiktok';
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const html = await response.text();
        const ogTitleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const ogImageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);

        if (ogTitleMatch && ogTitleMatch[1]) {
          title = ogTitleMatch[1].trim();
        } else if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }

        if (ogImageMatch && ogImageMatch[1]) {
          thumbnail = ogImageMatch[1].trim();
        }
      }
    } catch {
      // network / bot protect fallback
    }

    if (!title) {
      if (url.includes('instagram.com')) {
        title = '인스타그램 릴스 트렌드 비디오 클립';
      } else if (url.includes('tiktok.com')) {
        title = '틱톡 숏폼 인기 트렌드 영상';
      } else {
        try {
          const parsed = new URL(url);
          title = `${parsed.hostname} 저장 영상`;
        } catch {
          title = '저장된 비디오 클립';
        }
      }
    }
  }

  return { title, thumbnail, source };
}

// API endpoint to analyze and classify
app.post('/api/extract-and-classify', async (req, res) => {
  try {
    const { url, title: providedTitle, thumbnail: providedThumbnail, excludedCategories, existingCategories } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const trimmedUrl = url.trim();
    let metadata = {
      title: providedTitle || '',
      thumbnail: providedThumbnail || '',
      source: 'web' as 'youtube' | 'instagram' | 'tiktok' | 'web',
    };

    if (!metadata.title || !metadata.thumbnail) {
      const extracted = await extractMetadata(trimmedUrl);
      if (!metadata.title) metadata.title = extracted.title;
      if (!metadata.thumbnail) metadata.thumbnail = extracted.thumbnail;
      metadata.source = extracted.source;
    }

    // AI categorization with multimodal thumbnail, excluded categories, and dynamic broad category generation
    const excluded = Array.isArray(excludedCategories) ? excludedCategories : [];
    const existing = Array.isArray(existingCategories) ? existingCategories : [];
    const category = await classifyWithAI(
      metadata.title,
      trimmedUrl,
      metadata.thumbnail,
      excluded,
      existing
    );

    res.json({
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      category,
      source: metadata.source,
      url: trimmedUrl,
    });
  } catch (error) {
    console.error('Error in /api/extract-and-classify:', error);
    res.status(500).json({ error: 'Failed to process URL' });
  }
});

// Category classification for custom titles or reclassification
app.post('/api/classify-only', async (req, res) => {
  try {
    const { title, url, thumbnail, excludedCategories, existingCategories } = req.body;
    const excluded = Array.isArray(excludedCategories) ? excludedCategories : [];
    const existing = Array.isArray(existingCategories) ? existingCategories : [];
    const category = await classifyWithAI(
      title || '',
      url || '',
      thumbnail || '',
      excluded,
      existing
    );
    res.json({ category });
  } catch (error) {
    console.error('Error in /api/classify-only:', error);
    res.status(500).json({ error: 'Failed to classify' });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipSort Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
