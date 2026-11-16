/**
 * Intelligent Client-Side Semantic Category Classification
 * Strictly enforces broad categories (대분류):
 * - "음식": 맛집 탐방, 먹방, 요리, 레시피, 부대찌개, 카페, 식당 투어 등 음식 관련 전반
 * - "운동": 헬스, 홈트, 피트니스, 스트레칭 및 야구, 축구, 농구, 골프 등 모든 스포츠 종목 포괄
 * - "여행", "테크", "자기계발", "패션/뷰티", "라이프스타일", "음악/댄스", "예능/유머", "반려동물", "영화/드라마"
 */

export function classifyContentClientSide(
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

  // 1. 음식 (대분류: 맛집, 먹방, 부대찌개, 요리, 레시피, 카페 등 — '국'/'탕' 단독 매칭으로 인한 '솜사탕'/'한국' 오분류 방지)
  if (
    !excluded.has('음식') &&
    (/(음식|맛집|먹방|요리|레시피|쿡|찌개|파스타|베이킹|식단|라면|디저트|브런치|반찬|조리|간식|카페|베이커리|떡볶이|치킨|피자|바베큐|부대찌개|고기|식당|미식|안주|만들기|삼계탕|갈비탕|설렁탕|감자탕|매운탕|곰탕|마라탕|육개장|탕수육|샤브샤브|미역국|떡국|국밥|국수|칼국수|김밥|비빔밥|볶음밥|덮밥|초밥)/i.test(
      text
    ) ||
      /\b(cook|recipe|food|chef|baking|pasta|noodle|mukbang|dessert|kitchen|dish|restaurant|delicious|yummy|eating)\b/i.test(
        titleLower
      ))
  ) {
    return '음식';
  }

  // 2. 게임 (대분류: 롤, 배그, 발로란트, 오버워치, 마인크래프트, 피파, 로아, 메이플, 스타, 철권, 원신, 스팀, 콘솔, e스포츠, 공략 등)
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

  // 3. 운동 (대분류: 헬스, 홈트, 스트레칭 및 야구/축구/골프 등 모든 세부 스포츠 포괄)
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

  // 4. 여행 (Travel / Tourism / Trip / Tour)
  if (
    !excluded.has('여행') &&
    (/(여행|도쿄|오사카|교토|후쿠오카|유럽|제주|호텔|항공|관광|명소|해외여행|국내여행|비행기|숙소|리조트|휴가|공항|맛집투어|시티투어|호캉스|여권|패키지여행)/i.test(
      text
    ) ||
      /\b(travel|trip|japan|tokyo|kyoto|osaka|hotel|flight|resort|vacation|sightseeing|airline)\b/i.test(
        titleLower
      ))
  ) {
    return '여행';
  }

  // 5. 테크 (Tech / Gadgets / Programming / AI)
  // Short acronyms (it, ai, pc) MUST be tested with word boundaries on title, never matching raw URL params or query strings
  if (
    !excluded.has('테크') &&
    (/(테크|개발자|맥북|아이폰|갤럭시|코딩|인공지능|chatgpt|스마트폰|소프트웨어|하드웨어|리뷰|전자기기|태블릿|아이패드|애플|삼성|컴퓨터|노트북|모니터|프로그래밍)/i.test(
      text
    ) ||
      /\b(tech|technology|coding|programming|developer|software|hardware|laptop|monitor|gadget|iphone|galaxy|macbook|ipad|ai|it|pc)\b/i.test(
        titleLower
      ))
  ) {
    return '테크';
  }

  // 5. 자기계발 (Self-Improvement / Productivity / Reading / Habit)
  if (
    !excluded.has('자기계발') &&
    /(자기계발|독서|생산성|공부|동기부여|시간관리|마인드셋|재테크|주식|성공|습관|아침루틴|모닝루틴|학습|자격증|영어|외국어|회화|커리어|취업|이직|부자|투자|부동산|경제|study|productivity|book|mindset|routine|habit|motivation|career|finance|investment|growth)/i.test(
      text
    )
  ) {
    return '자기계발';
  }

  // 6. 패션/뷰티 (Fashion / Beauty / Cosmetics)
  if (
    !excluded.has('패션/뷰티') &&
    /(패션|뷰티|메이크업|스킨케어|코디|스타일|헤어|착장|오오티디|향수|립스틱|피부|옷|화장|화장품|룩북|ootd|fashion|beauty|makeup|style|hair|skincare|cosmetics|lookbook|outfit)/i.test(
      text
    )
  ) {
    return '패션/뷰티';
  }

  // 7. 음악/댄스 (Music / Dance / Choreo)
  if (
    !excluded.has('음악/댄스') &&
    /(음악|노래|기타|피아노|댄스|안무|플레이리스트|커버|보컬|악기|밴드|음원|가요|kpop|아이돌|콘서트|cover|music|dance|song|playlist|choreo|vocal|guitar|piano|concert|band)/i.test(
      text
    )
  ) {
    return '음악/댄스';
  }

  // 8. 반려동물 (Pets / Animals) - Check before 예능/유머
  if (
    !excluded.has('반려동물') &&
    (/(반려동물|강아지|고양이|댕댕이|냥이|냥냥이|애견|애묘|반려견|반려묘|말티즈|비숑|푸들|포메|포메라니안|골든리트리버|리트리버|웰시코기|시바견|시츄|치와와|진돗개|닥스훈트|사모예드|허스키|보더콜리|슈나우저|꼬순내|강쥐|멍멍이|멍뭉이|집사|페르시안|러시안블루|스코티시폴드|코숏|먼치킨|랙돌|동물)/i.test(
      text
    ) ||
      /\b(pet|pets|dog|dogs|cat|cats|puppy|puppies|kitten|kittens|animal|maltese|bichon|poodle|corgi)\b/i.test(
        titleLower
      ))
  ) {
    return '반려동물';
  }

  // 9. 예능/유머 (Entertainment / Comedy)
  if (
    !excluded.has('예능/유머') &&
    /(예능|유머|웃긴|개그|코미디|쇼츠|밈|웃음|꿀잼|몰카|토크|comedy|humor|funny|meme|entertainment)/i.test(
      text
    )
  ) {
    return '예능/유머';
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


  // Check matching against existing broad categories
  if (existingCategories.length > 0) {
    for (const ec of existingCategories) {
      if (ec && ec !== '전체' && ec !== '미분류' && !excluded.has(ec) && text.includes(ec.toLowerCase())) {
        return ec;
      }
    }
  }

  // Only return '라이프스타일' if explicit lifestyle keywords match (룸투어, 인테리어, 청소, 살림 등)
  if (
    !excluded.has('라이프스타일') &&
    /(라이프스타일|인테리어|방꾸미기|룸투어|청소|정리|살림|자취|홈스타일링|집꾸미기|lifestyle|homedecor)/i.test(text)
  ) {
    return '라이프스타일';
  }

  // Active AI Heuristic Inference (Zero-Friction: Do NOT default to '미분류')
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

  if (!excluded.has('예능/유머')) return '예능/유머';
  if (!excluded.has('라이프스타일')) return '라이프스타일';

  const firstValid = existingCategories.find((c) => c && c !== '전체' && c !== '미분류' && !excluded.has(c));
  return firstValid || '예능/유머';
}
