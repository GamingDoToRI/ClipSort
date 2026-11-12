import { GoogleGenAI } from '@google/genai';

/**
 * YouTube ID extractor supporting standard, shorts, mobile m.youtube, youtu.be, live, and share urls
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
      }
      if (parsed.pathname.startsWith('/live/')) {
        return parsed.pathname.split('/live/')[1].split('/')[0].split('?')[0];
      }
      if (host.includes('youtu.be')) {
        return parsed.pathname.slice(1).split('?')[0].split('/')[0];
      }
      const v = parsed.searchParams.get('v');
      if (v) return v;
    }
  } catch {
    // fallback regex below
  }

  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

/**
 * Rule-based category classification with comprehensive gaming, food, workout, lifestyle and other broad categories
 */
/**
 * Instagram shortcode extractor
 */
export function extractInstagramShortcode(url: string): string | null {
  try {
    const match = url.match(/instagram\.com\/(?:reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Rule-based category classification with comprehensive gaming, food, workout, lifestyle and other broad categories
 */
export function ruleBasedClassify(
  title: string,
  url: string,
  thumbnail: string = '',
  excludedCategories: string[] = [],
  existingCategories: string[] = []
): string {
  // Extract clean text from title and url path (never include query parameters like fit=crop or thumbnail URLs)
  let urlPath = '';
  try {
    const parsed = new URL(url);
    urlPath = parsed.pathname;
  } catch {
    urlPath = url.split('?')[0] || '';
  }

  const cleanTitle = (title || '').trim();
  const titleLower = cleanTitle.toLowerCase();
  const text = `${titleLower} ${urlPath.toLowerCase()}`;
  const excluded = new Set(excludedCategories.map((c) => c.trim().toLowerCase()));

  // 1. 음식 (Food)
  if (
    !excluded.has('음식') &&
    (/(음식|맛집|먹방|요리|레시피|쿡|찌개|파스타|베이킹|식단|밥|라면|디저트|브런치|반찬|국|탕|조리|간식|카페|베이커리|떡볶이|치킨|피자|바베큐|부대찌개|고기|골목|식당|미식|안주|만들기)/i.test(
      text
    ) ||
      /\b(cook|recipe|food|chef|baking|pasta|noodle|mukbang|dessert|kitchen|dish|restaurant|delicious|yummy|eating|asmr)\b/i.test(
        titleLower
      ))
  ) {
    return '음식';
  }

  // 2. 게임 (Gaming: 롤, 배그, 발로란트, 오버워치, 마인크래프트, 피파, 로아, 메이플, 스타, 철권, 원신, 스팀, 콘솔 등)
  // CRITICAL: 스타, 마크, 롤, 로아 등 짧은 단어가 '인스타그램', '파스타', '스타일', '워터마크' 등에 오분류되지 않도록 바운더리 검사
  if (
    !excluded.has('게임') &&
    (/(게임|겜|게이밍|리그\s*오브\s*레전드|페이커|faker|쵸비|chovy|t1|lck|lpl|롤드컵|배그|배틀그라운드|pubg|오버워치|overwatch|발로란트|valorant|마인크래프트|피파|fifa|fc온라인|fc\s*online|메이플|메이플스토리|maplestory|로스트아크|던파|던전앤파이터|철권|tekken|원신|genshin|붕괴|스타레일|starrail|젤다|zelda|포켓몬|pokemon|팰월드|palworld|엘든링|elden\s*ring|다크소울|gta|디아블로|diablo|사이버펑크|cyberpunk|몬스터헌터|몬헌|monster\s*hunter|동물의숲|동숲|스위치|닌텐도|nintendo|switch|플스|플레이스테이션|playstation|ps5|ps4|엑박|xbox|스팀|steam|e스포츠|esports|프로게이머|gamer|gaming|gameplay|walkthrough|playthrough|공략|실황|보스전|퀘스트|치지직|트위치|인방|스트리머|침착맨|풍월량|우왁굳|괴물쥐|랄로|파카|도파|롤챔스|승급전|솔랭|칼바람|롤토체스|tft|매드무비|템트리|게임플레이|게임방송|스타크래프트|starcraft|스타[12]|스타\s*(리그|대전|경기|빨무)|(?<![가-힣a-zA-Z0-9])스타(?![가-힣a-zA-Z0-9])|(?<![가-힣a-zA-Z0-9])(롤|마크|로아|티어)(?![가-힣a-zA-Z0-9]))/i.test(
      text
    ) ||
      /\b(gamer|gaming|gameplay|esports|game)\b/i.test(titleLower))
  ) {
    return '게임';
  }

  // 3. 운동 (Workout / Sports)
  if (
    !excluded.has('운동') &&
    (/(운동|헬스|홈트|피트니스|다이어트|스트레칭|근육|러닝|필라테스|요가|스쿼트|벌크업|체지방|복근|하체|상체|등운동|가슴운동|웨이트|스포츠|야구|축구|농구|골프|테니스|수영|배구|배드민턴|kbo|mlb|홈런|삼진|투수|타자|안타)/i.test(
      text
    ) ||
      /\b(workout|fitness|gym|health|diet|stretch|pilates|yoga|running|training|sports|soccer|baseball|football|bodybuilding|exercise)\b/i.test(
        titleLower
      ))
  ) {
    return '운동';
  }

  // 4. 여행 (Travel)
  if (
    !excluded.has('여행') &&
    (/(여행|투어|호텔|항공|공항|비행기|숙소|게스트하우스|리조트|펜션|제주|도쿄|오사카|유럽|다낭|방콕|발리|후쿠오카|해외여행|국내여행|관광|명소|캐리어|환전|출국|호캉스)/i.test(
      text
    ) ||
      /\b(travel|trip|tour|hotel|flight|resort|vacation|sightseeing)\b/i.test(
        titleLower
      ))
  ) {
    return '여행';
  }

  // 5. 테크 (Tech / IT / Science)
  // Short acronyms (it, ai, pc) MUST be tested with word boundaries on title, never matching raw URL params or query strings
  if (
    !excluded.has('테크') &&
    (/(테크|전자기기|스마트폰|아이폰|갤럭시|맥북|노트북|컴퓨터|코딩|개발자|프로그래밍|인공지능|chatgpt|태블릿|아이패드|애플|삼성|소프트웨어|하드웨어|얼리어답터|기기리뷰)/i.test(
      text
    ) ||
      /\b(tech|technology|coding|programming|developer|software|gadget|iphone|galaxy|macbook|ipad|ai|it|pc)\b/i.test(
        titleLower
      ))
  ) {
    return '테크';
  }

  // 6. 자기계발 (Self-Improvement / Productivity)
  if (
    !excluded.has('자기계발') &&
    /(자기계발|독서|책|공부|학습|스터디|시간관리|루틴|생산성|모닝루틴|재테크|주식|부동산|투자|성공|동기부여|마인드셋|영어회화|자격증|멘탈|습관|productivity|study|habit|routine|motivation|investment|finance|self-development)/i.test(
      text
    )
  ) {
    return '자기계발';
  }

  // 7. 패션/뷰티 (Fashion / Beauty)
  if (
    !excluded.has('패션/뷰티') &&
    /(패션|뷰티|메이크업|화장|화장품|스킨케어|피부|옷|코디|룩북|ootd|헤어|스타일|립스틱|파운데이션|향수|데일리룩|fashion|beauty|makeup|skincare|lookbook|outfit|style|cosmetic)/i.test(
      text
    )
  ) {
    return '패션/뷰티';
  }

  // 8. 예능/유머 (Entertainment)
  if (
    !excluded.has('예능/유머') &&
    /(예능|유머|웃긴|개그|코미디|쇼츠|밈|웃음|꿀잼|몰카|토크|comedy|humor|funny|meme|entertainment)/i.test(
      text
    )
  ) {
    return '예능/유머';
  }

  // 9. 반려동물 (Pets)
  if (
    !excluded.has('반려동물') &&
    /(반려동물|강아지|고양이|댕댕이|냥이|애견|애묘|포메라니안|골든리트리버|동물|pet|dog|cat|puppy|kitten|animal)/i.test(
      text
    )
  ) {
    return '반려동물';
  }

  // 10. 영화/드라마 (Movies / Drama)
  if (
    !excluded.has('영화/드라마') &&
    /(영화|드라마|넷플릭스|애니|시리즈|결말|리뷰|명장면|배우|시즌|movie|drama|netflix|cinema|anime|series)/i.test(
      text
    )
  ) {
    return '영화/드라마';
  }

  // 11. 음악/댄스 (Music / Dance)
  if (
    !excluded.has('음악/댄스') &&
    /(노래|음악|댄스|안무|뮤직|뮤비|아이돌|가수|기타|피아노|보컬|랩|힙합|플레이리스트|플리|song|music|dance|kpop|cover|playlist|vocal|piano|guitar)/i.test(
      text
    )
  ) {
    return '음악/댄스';
  }

  // 12. 라이프스타일 (Lifestyle: 주거, 인테리어, 청소, 살림)
  if (
    !excluded.has('라이프스타일') &&
    /(라이프스타일|인테리어|방꾸미기|룸투어|청소|정리|살림|자취|홈스타일링|집꾸미기|lifestyle|homedecor)/i.test(
      text
    )
  ) {
    return '라이프스타일';
  }

  // Existing custom category matching
  if (existingCategories.length > 0) {
    for (const ec of existingCategories) {
      if (ec && ec !== '전체' && ec !== '미분류' && !excluded.has(ec) && text.includes(ec.toLowerCase())) {
        return ec;
      }
    }
  }

  // Active AI Heuristic Inference (Do NOT default to '미분류' so user doesn't have to manually categorize)
  if (
    !excluded.has('자기계발') &&
    /(official|아카데미|데미|학원|스쿨|study|tips|career|job|mentoring|강의|노하우|꿀팁|정보)/i.test(text)
  ) {
    return '자기계발';
  }

  if (
    !excluded.has('패션/뷰티') &&
    /(outfit|look|style|hair|fashion|ootd|코디|패션|스타일)/i.test(text)
  ) {
    return '패션/뷰티';
  }

  if (
    !excluded.has('음악/댄스') &&
    /(dance|song|music|cover|idol|kpop|sound|노래|댄스|안무|음악)/i.test(text)
  ) {
    return '음악/댄스';
  }

  // Shortform video default: Overwhelmingly Entertainment/Humor or Lifestyle
  if (url.includes('instagram.com') || url.includes('tiktok.com')) {
    if (!excluded.has('예능/유머')) return '예능/유머';
    if (!excluded.has('라이프스타일')) return '라이프스타일';
  }

  if (!excluded.has('라이프스타일')) return '라이프스타일';
  if (!excluded.has('예능/유머')) return '예능/유머';

  const firstValid = existingCategories.find((c) => c && c !== '전체' && c !== '미분류' && !excluded.has(c));
  return firstValid || '예능/유머';
}

/**
 * AI Classifier using Gemini
 */
export async function classifyWithAI(
  title: string,
  url: string,
  thumbnail: string = '',
  excludedCategories: string[] = [],
  existingCategories: string[] = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const validExisting = existingCategories.filter((c) => c && c !== '전체' && !excludedCategories.includes(c));
      const existingList = validExisting.length > 0
        ? validExisting.join(', ')
        : '음식, 운동, 여행, 게임, 테크, 자기계발, 패션/뷰티, 예능/유머, 음악/댄스, 라이프스타일';

      const prompt = `당신은 영상 콘텐츠의 주제를 직관적이고 포괄적인 **대분류(Broad Category)**로 분류하는 스마트 AI 엔진입니다.
사용자가 수동으로 카테고리를 설정하는 번거로움을 완전히 없애기 위해, 영상 제목이나 내용이 다소 짧거나 모호하더라도 영상의 맥락(채널/계정명, 숏폼 성격 등)을 최대한 유추하여 가장 가능성이 높은 카테고리로 적극적으로 자동 분류하세요. 절대로 '미분류'로 분류하지 말고 아래 카테고리 중 단 하나를 선택하세요.

[현재 앱의 카테고리 목록]:
${existingList}

[★ 핵심 대분류 분류 규칙]:
1. **게임 (대분류)**: 롤, 배그, 발로란트, 오버워치, 마인크래프트, 피파, 로아, 메이플, 스타, 철권, 원신, 스팀, 콘솔/모바일 게임, e스포츠, 게임 방송 등 게임 관련 모든 영상.
2. **음식 (대분류)**: 맛집 탐방, 먹방, 길거리음식, 요리 및 레시피, 카페, 베이커리 등 음식 관련 모든 영상.
3. **운동 (대분류)**: 헬스, 홈트, 피트니스, 스트레칭뿐만 아니라 야구, 축구, 농구, 골프 등 모든 스포츠 경기 영상.
4. **자기계발 (대분류)**: 공부, 독서, 커리어, 재테크, 주식, 동기부여, 자격증, 영어, 교육 아카데미 등.
5. **패션/뷰티 (대분류)**: 메이크업, 옷 코디, 룩북, 헤어스타일, 스킨케어, 데일리룩 등.
6. **음악/댄스 (대분류)**: 노래, 댄스, 안무 챌린지, 악기 연주, 플레이리스트, 아이돌 등.
7. **예능/유머 (대분류)**: 재미있는 숏폼 밈, 웃긴 영상, 개그, 토크, 코미디 등 (주제가 모호한 릴스/쇼츠의 1순위 추천).
8. **라이프스타일 (대분류)**: 일상 브이로그, 룸투어, 인테리어, 청소, 살림 등.
9. **테크 (대분류)**: 스마트폰, 전자기기 리뷰, 맥북, 코딩, 인공지능, IT 신제품 등.

영상 제목: "${title}"
영상 URL: "${url}"
썸네일 이미지: "${thumbnail}"

반드시 추가 부연 설명 없이 카테고리 이름 한 단어만 정확히 출력하세요 (예: 예능/유머, 자기계발, 음식, 운동, 여행, 게임, 테크, 라이프스타일 등).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text ? response.text.trim() : '';
      const cleanCategory = text.replace(/^[#\*\s"']+|[#\*\s"']+$/g, '').replace(/카테고리:?/i, '').trim();

      if (cleanCategory && !excludedCategories.includes(cleanCategory) && cleanCategory !== '미분류') {
        return cleanCategory;
      }
    } catch (e) {
      console.warn('Gemini classification error:', e);
    }
  }

  // Fallback to rule-based active inference
  return ruleBasedClassify(title, url, thumbnail, excludedCategories, existingCategories);
}

export function cleanHtmlTitle(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract title, thumbnail, and source metadata from URL
 */
export async function extractMetadata(url: string) {
  let title = '';
  let thumbnail = '';
  let source: 'youtube' | 'instagram' | 'tiktok' | 'web' = 'web';

  const ytId = extractYouTubeId(url);
  if (ytId) {
    source = 'youtube';
    thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as { title?: string; thumbnail_url?: string };
        if (data.title && typeof data.title === 'string' && data.title.trim().length > 0) {
          title = cleanHtmlTitle(data.title);
        }
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
        }
      }
    } catch (e) {
      console.warn('YouTube oEmbed fetch error:', e);
    }

    if (!title || title.includes(`유튜브 영상 (${ytId})`)) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(4000),
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
              title = cleanHtmlTitle(rawTitle);
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
  } else if (url.includes('instagram.com')) {
    source = 'instagram';
    const shortcode = extractInstagramShortcode(url);

    if (shortcode) {
      // Extract real Instagram thumbnail and author via fxinstagram OpenGraph proxy
      try {
        const fxUrl = `https://www.fxinstagram.com/reel/${shortcode}/`;
        const fxRes = await fetch(fxUrl, {
          headers: {
            'User-Agent': 'Twitterbot/1.0',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (fxRes.ok) {
          const fxHtml = await fxRes.text();
          const ogImgMatch =
            fxHtml.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
            fxHtml.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
          const ogTitleMatch =
            fxHtml.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
            fxHtml.match(/<title>(.*?)<\/title>/i);

          if (ogImgMatch && ogImgMatch[1]) {
            // Replace XML &amp; with clean & to ensure valid CDN signature
            thumbnail = ogImgMatch[1].replace(/&amp;/g, '&').trim();
          }

          if (ogTitleMatch && ogTitleMatch[1]) {
            const parsedTitle = cleanHtmlTitle(ogTitleMatch[1]);
            if (parsedTitle && parsedTitle.toLowerCase() !== 'instagram') {
              title = parsedTitle;
            }
          }
        }
      } catch (e) {
        console.warn('fxinstagram fetch error:', e);
      }
    }

    // Quick fallback to /p/ shortcode endpoint if reel endpoint did not return thumbnail
    if (shortcode && (!thumbnail || !title)) {
      try {
        const pUrl = `https://www.fxinstagram.com/p/${shortcode}/`;
        const pRes = await fetch(pUrl, {
          headers: {
            'User-Agent': 'Twitterbot/1.0',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(3000),
        });
        if (pRes.ok) {
          const pHtml = await pRes.text();
          const ogImg = pHtml.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i)?.[1];
          const ogTitle = pHtml.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i)?.[1];
          if (!thumbnail && ogImg) thumbnail = ogImg.replace(/&amp;/g, '&').trim();
          if (!title && ogTitle && ogTitle.toLowerCase() !== 'instagram') title = cleanHtmlTitle(ogTitle);
        }
      } catch {
        // ignore
      }
    }

    if (!title) {
      title = shortcode ? `인스타그램 릴스 (${shortcode})` : '인스타그램 릴스 비디오';
    }
  } else {
    if (url.includes('tiktok.com')) {
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
        signal: AbortSignal.timeout(4000),
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
          title = cleanHtmlTitle(ogTitleMatch[1]);
        } else if (titleMatch && titleMatch[1]) {
          title = cleanHtmlTitle(titleMatch[1]);
        }

        if (ogImageMatch && ogImageMatch[1]) {
          thumbnail = ogImageMatch[1].replace(/&amp;/g, '&').trim();
        }
      }
    } catch {
      // ignore
    }

    if (source === 'tiktok' && (!title || title.trim().toLowerCase() === 'tiktok')) {
      title = '틱톡 인기 숏폼 영상';
    }

    if (!title) {
      if (url.includes('tiktok.com')) {
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

/**
 * Request handler for /api/extract-and-classify
 */
export async function handleExtractAndClassify(req: any, res: any) {
  try {
    const { url, title: providedTitle, thumbnail: providedThumbnail, excludedCategories, existingCategories } =
      req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
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

    const excluded = Array.isArray(excludedCategories) ? excludedCategories : [];
    const existing = Array.isArray(existingCategories) ? existingCategories : [];
    let category = await classifyWithAI(
      metadata.title,
      trimmedUrl,
      metadata.thumbnail,
      excluded,
      existing
    );

    if (!category || category === '라이프스타일' || category === '기타' || category === '미분류') {
      const ruleCat = ruleBasedClassify(metadata.title, trimmedUrl, metadata.thumbnail, excluded, existing);
      if (ruleCat && ruleCat !== '라이프스타일' && ruleCat !== '기타' && ruleCat !== '미분류') {
        category = ruleCat;
      }
    }

    // Zero-friction: Never return '미분류' so user is not forced into manual categorization
    if (!category || category === '기타' || category === '미분류') {
      if (!excluded.includes('예능/유머')) {
        category = '예능/유머';
      } else if (!excluded.includes('라이프스타일')) {
        category = '라이프스타일';
      } else {
        const fallback = existing.find((c) => c && c !== '전체' && c !== '미분류' && !excluded.includes(c));
        category = fallback || '예능/유머';
      }
    }

    return res.json({
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      category,
      source: metadata.source,
      url: trimmedUrl,
    });
  } catch (error) {
    console.error('Error in handleExtractAndClassify:', error);
    return res.status(500).json({ error: 'Failed to process URL' });
  }
}

/**
 * Request handler for /api/classify-only
 */
export async function handleClassifyOnly(req: any, res: any) {
  try {
    const { title, url, thumbnail, excludedCategories, existingCategories } = req.body || {};
    const excluded = Array.isArray(excludedCategories) ? excludedCategories : [];
    const existing = Array.isArray(existingCategories) ? existingCategories : [];
    let category = await classifyWithAI(
      title || '',
      url || '',
      thumbnail || '',
      excluded,
      existing
    );

    if (!category || category === '라이프스타일' || category === '기타' || category === '미분류') {
      const ruleCat = ruleBasedClassify(title || '', url || '', thumbnail || '', excluded, existing);
      if (ruleCat && ruleCat !== '라이프스타일' && ruleCat !== '기타' && ruleCat !== '미분류') {
        category = ruleCat;
      }
    }

    // Zero-friction: Never return '미분류'
    if (!category || category === '기타' || category === '미분류') {
      if (!excluded.includes('예능/유머')) {
        category = '예능/유머';
      } else if (!excluded.includes('라이프스타일')) {
        category = '라이프스타일';
      } else {
        const fallback = existing.find((c) => c && c !== '전체' && c !== '미분류' && !excluded.includes(c));
        category = fallback || '예능/유머';
      }
    }

    return res.json({ category });
  } catch (error) {
    console.error('Error in handleClassifyOnly:', error);
    return res.status(500).json({ error: 'Failed to classify' });
  }
}
