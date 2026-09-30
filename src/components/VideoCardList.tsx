import React from 'react';
import { VideoBookmark } from '../types';
import { VideoCard } from './VideoCard';
import { BookmarkX } from 'lucide-react';

interface VideoCardListProps {
  videos: VideoBookmark[];
  activeCategory: string;
  recentAddedId?: string | null;
  primaryColor?: string;
  onChangeCategory: (video: VideoBookmark) => void;
  onDeleteVideo?: (video: VideoBookmark) => void;
}

export const VideoCardList: React.FC<VideoCardListProps> = ({
  videos,
  activeCategory,
  recentAddedId,
  primaryColor,
  onChangeCategory,
  onDeleteVideo,
}) => {
  if (videos.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-[#dae2fd] my-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#eaedff] flex items-center justify-center text-[#5046e5]">
          <BookmarkX className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-[#131b2e] mb-1">
          {activeCategory === '전체'
            ? '저장된 영상이 아직 없습니다'
            : `'${activeCategory}' 카테고리에 저장된 영상이 없습니다`}
        </h4>
        <p className="text-xs text-[#777587] max-w-sm mx-auto">
          상단 입력창에 유튜브, 인스타그램, 틱톡 영상 링크를 붙여넣고 저장해 보세요. AI가 자동으로 주제별 카테고리를 분류해 줍니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          isRecentHighlight={video.id === recentAddedId}
          primaryColor={primaryColor}
          onChangeCategory={onChangeCategory}
          onDeleteVideo={onDeleteVideo}
        />
      ))}
    </div>
  );
};
