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

// Rule-based classification fallback
function ruleBasedClassify(title: string, url: string): string {
  const text = (title + ' ' + url).toLowerCase();
  
  if (/요리|레시피|쿡|먹방|맛집|찌개|파스타|베이킹|식단|밥|라면|디저트|cook|recipe|food|chef/.test(text)) {
    return '요리';
  }
  if (/운동|헬스|홈트|피트니스|다이어트|스트레칭|근육|러닝|필라테스|요가|스쿼트|벌크업|workout|fitness|gym/.test(text)) {
    return '운동';
  }
  if (/여행|도쿄|오사카|유럽|제주|호텔|항공|브이로그|관광|명소|해외여행|국내여행|travel|trip|vlog|tour/.test(text)) {
    return '여행';
  }
  if (/테크|개발|맥북|아이폰|코딩|인공지능|ai|it|스마트폰|소프트웨어|하드웨어|리뷰|gadget|tech|code|apple/.test(text)) {
    return '테크';
  }
  if (/자기계발|독서|생산성|공부|동기부여|시간관리|마인드셋|재테크|주식|성공|습관|study|productivity|book/.test(text)) {
    return '자기계발';
  }
  if (/패션|뷰티|메이크업|스킨케어|코디|스타일|헤어|착장|ootd|fashion|beauty|makeup/.test(text)) {
    return '패션/뷰티';
  }
  if (/음악|노래|기타|피아노|댄스|안무|플레이리스트|cover|music|dance|playlist/.test(text)) {
    return '음악/댄스';
  }
  
  return '라이프스타일';
}

// AI Classifier using Gemini
async function classifyWithAI(title: string, url: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return ruleBasedClassify(title, url);
  }

  try {
    const ai = new GoogleGenAI();
    const prompt = `당신은 영상 콘텐츠의 주제를 분류하는 스마트 AI 엔진입니다.
주어진 영상 제목과 URL 정보를 분석하여 가장 적합한 단 하나의 간결한 한국어 카테고리를 골라주세요.

[카테고리 후보 예시]:
- 요리
- 운동
- 여행
- 테크
- 자기계발
- 패션/뷰티
- 음악/댄스
- 라이프스타일
- 예능/유머
- 지식/교양
- 영화/드라마
- 반려동물
(만약 위 후보에 적합한 것이 없다면 가장 명확한 2~5글자 한국어 카테고리 단어를 생성해도 됩니다)

영상 제목: "${title}"
영상 URL: "${url}"

답변 규칙: 오직 카테고리 단어 하나만 출력하세요. 다른 인사말이나 설명, 따옴표, 괄호 등은 일절 붙이지 마세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const category = response.text?.trim().replace(/['"\[\]\n\r]/g, '');
    if (category && category.length > 0 && category.length <= 10) {
      return category;
    }
  } catch (err) {
    console.warn('Gemini classification fallback to rule-based:', err);
  }

  return ruleBasedClassify(title, url);
}

// Extract metadata (oEmbed / OpenGraph)
async function extractMetadata(url: string) {
  let title = '';
  let thumbnail = '';
  let source = 'web';

  // Fast-track known sample links for instant UI feedback
  if (url.includes('recipe_pasta') || url.includes('pasta_sample')) {
    return {
      title: '15분 만에 완성하는 원팬 파스타 초간단 레시피',
      thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
      source: 'youtube'
    };
  }
  if (url.includes('workout_stretch') || url.includes('stretch_sample')) {
    return {
      title: '하루 10분 허리 통증 없애는 스트레칭 루틴',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
      source: 'youtube'
    };
  }
  if (url.includes('travel_kyoto') || url.includes('kyoto_sample')) {
    return {
      title: '교토 3박 4일 필수 코스 & 숨은 골목 명소 완벽 가이드',
      thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
      source: 'instagram'
    };
  }
  if (url.includes('productivity_routine') || url.includes('morning_sample')) {
    return {
      title: '집중력을 3배 올려주는 아침 루틴과 시간 관리법',
      thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      source: 'youtube'
    };
  }
  if (url.includes('recipe_kimchi') || url.includes('kimchi_sample')) {
    return {
      title: '백종원의 집밥 비법! 깊고 진한 돼지고기 김치찌개 황금 레시피',
      thumbnail: 'https://img.youtube.com/vi/recipe_kimchi_sample/hqdefault.jpg',
      source: 'youtube'
    };
  }
  if (url.includes('workout_core') || url.includes('fitness_sample')) {
    return {
      title: '하루 10분 복근 박살 내기! 초보자도 가능한 코어 버닝 루틴',
      thumbnail: 'https://img.youtube.com/vi/workout_core_sample/hqdefault.jpg',
      source: 'youtube'
    };
  }
  if (url.includes('tokyo_travel') || url.includes('japan_sample')) {
    return {
      title: '도쿄 3박 4일 감성 여행 브이로그 ✈️ 시부야 신주쿠 맛집 총정리',
      thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
      source: 'instagram'
    };
  }
  if (url.includes('macbook_setup') || url.includes('apple_sample')) {
    return {
      title: '맥북 프로 구매 후 무조건 해야 할 10가지 세팅 및 필수 앱 추천',
      thumbnail: 'https://img.youtube.com/vi/macbook_setup_sample/hqdefault.jpg',
      source: 'youtube'
    };
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    source = 'youtube';
    thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, {
        signal: AbortSignal.timeout(2000)
      });
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || '';
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
        }
      }
    } catch {
      // ignore
    }

    if (!title) {
      title = `유튜브 영상 (${ytId})`;
    }
  } else {
    // Other platforms (Instagram, TikTok, Blog, etc.)
    if (url.includes('instagram.com')) {
      source = 'instagram';
    } else if (url.includes('tiktok.com')) {
      source = 'tiktok';
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const html = await response.text();
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
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
      // network/bot protect fallback
    }

    if (!title) {
      if (url.includes('instagram.com')) {
        title = '인스타그램 릴스 핫플레이스 & 감성 트렌드 클립';
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
    const { url, title: providedTitle, thumbnail: providedThumbnail } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const trimmedUrl = url.trim();
    let metadata = { title: providedTitle || '', thumbnail: providedThumbnail || '', source: 'web' };

    if (!metadata.title || !metadata.thumbnail) {
      const extracted = await extractMetadata(trimmedUrl);
      if (!metadata.title) metadata.title = extracted.title;
      if (!metadata.thumbnail) metadata.thumbnail = extracted.thumbnail;
      metadata.source = extracted.source;
    }

    // AI categorization
    const category = await classifyWithAI(metadata.title, trimmedUrl);

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

// Category classification for custom titles
app.post('/api/classify-only', async (req, res) => {
  try {
    const { title, url } = req.body;
    const category = await classifyWithAI(title || '', url || '');
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
