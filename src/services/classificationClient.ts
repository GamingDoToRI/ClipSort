/**
 * Intelligent Client-Side Semantic Category Classification
 * Strictly enforces broad categories (대분류):
 * - "음식": 맛집 탐방, 먹방, 요리, 레시피, 부대찌개, 카페, 식당 투어 등 음식 관련 전반
 * - "운동": 헬스, 홈트, 피트니스, 스트레칭 및 야구, 축구, 농구 등 모든 스포츠 종목 포괄
 * - "여행", "테크", "자기계발", "패션/뷰티", "라이프스타일", "음악/댄스", "예능/유머", "반려동물", "영화/드라마"
 */

export function classifyContentClientSide(
  title: string,
  url: string,
  thumbnail: string = '',
  excludedCategories: string[] = [],
  existingCategories: string[] = []
): string {
  const text = `${title} ${url} ${thumbnail}`.toLowerCase();
  const excluded = new Set(excludedCategories.map((c) => c.trim().toLowerCase()));

  // 1. 음식 (대분류: 맛집, 먹방, 부대찌개, 골목, 요리, 레시피, 카페, 베이커리 등 전반)
  if (
    !excluded.has('음식') &&
    /(음식|맛집|먹방|요리|레시피|쿡|찌개|파스타|베이킹|식단|밥|라면|디저트|브런치|반찬|조리|간식|카페|베이커리|떡볶이|치킨|피자|바베큐|부대찌개|고기|골목|식당|미식|안주|cook|recipe|food|chef|baking|pasta|noodle|mukbang|dessert|kitchen|dish|restaurant)/i.test(
      text
    )
  ) {
    return '음식';
  }

  // 2. 운동 (대분류: 헬스, 홈트, 스트레칭 및 야구/축구/골프 등 모든 세부 스포츠 포괄)
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

  // 4. 테크 (Tech / Gadgets / Programming / AI)
  if (
    !excluded.has('테크') &&
    /(테크|개발|맥북|아이폰|갤럭시|코딩|인공지능|ai|it|스마트폰|소프트웨어|하드웨어|리뷰|기기|전자기기|태블릿|아이패드|애플|삼성|컴퓨터|노트북|모니터|프로그래밍|gadget|tech|code|apple|samsung|macbook|iphone|galaxy|software|hardware|laptop|monitor|programming|developer)/i.test(
      text
    )
  ) {
    return '테크';
  }

  // 5. 자기계발 (Self-Improvement / Productivity / Reading / Habit)
  if (
    !excluded.has('자기계발') &&
    /(자기계발|독서|생산성|공부|동기부여|시간관리|마인드셋|재테크|주식|성공|습관|아침루틴|모닝루틴|학습|자격증|영어|외국어|회화|커리어|취업|이직|부자|투자|부동산|study|productivity|book|mindset|routine|habit|motivation|career|finance|investment|growth)/i.test(
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

  // 8. 예능/유머 (Entertainment / Comedy)
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
    /(반려동물|강아지|고양이|댕댕이|냥이|애견|애묘|포메라니안|동물|pet|dog|cat|puppy|kitten|animal)/i.test(
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

  // Check matching against existing broad categories
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
