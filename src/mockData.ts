import { VideoBookmark } from './types';

export const INITIAL_BOOKMARKS: VideoBookmark[] = [
  {
    id: 'b-1',
    title: '15분 만에 완성하는 원팬 파스타 초간단 레시피',
    thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
    category: '음식',
    url: 'https://www.youtube.com/watch?v=recipe_pasta_sample',
    createdAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
    source: 'youtube',
  },
  {
    id: 'b-2',
    title: '하루 10분 허리 통증 없애는 스트레칭 루틴',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    category: '운동',
    url: 'https://www.youtube.com/watch?v=workout_stretch_sample',
    createdAt: Date.now() - 1000 * 60 * 60 * 1, // 1 hour ago
    source: 'youtube',
  },
  {
    id: 'b-3',
    title: '교토 3박 4일 필수 코스 & 숨은 골목 명소 완벽 가이드',
    thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    category: '여행',
    url: 'https://www.instagram.com/reel/travel_kyoto_sample',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    source: 'instagram',
  },
  {
    id: 'b-4',
    title: '집중력을 3배 올려주는 아침 루틴과 시간 관리법',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
    category: '자기계발',
    url: 'https://www.youtube.com/watch?v=productivity_routine_sample',
    createdAt: Date.now() - 1000 * 60 * 60 * 25, // yesterday
    source: 'youtube',
  },
  {
    id: 'b-5',
    title: '오사카 난바 현지인 라멘 맛집 투어',
    thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    category: '여행',
    url: 'https://www.youtube.com/watch?v=ramen_osaka_sample',
    createdAt: Date.now() - 1000 * 60 * 60 * 28, // yesterday
    source: 'youtube',
  },
];

export const STANDARD_CATEGORIES = [
  '전체',
  '음식',
  '운동',
  '여행',
  '자기계발',
  '라이프스타일',
  '테크',
];
