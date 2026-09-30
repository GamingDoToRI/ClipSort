import React, { useState } from 'react';
import { ExternalLink, Edit3, Trash2, Film } from 'lucide-react';
import { VideoBookmark } from '../types';

interface VideoCardProps {
  video: VideoBookmark;
  isRecentHighlight?: boolean;
  primaryColor?: string;
  onChangeCategory: (video: VideoBookmark) => void;
  onDeleteVideo?: (video: VideoBookmark) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isRecentHighlight = false,
  primaryColor = '#5046e5',
  onChangeCategory,
  onDeleteVideo,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleOpenLink = () => {
    if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      className={`group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col ${
        isRecentHighlight
          ? 'border-2 border-[#5046e5]/60 shadow-md ring-1 ring-[#5046e5]/20'
          : 'border border-[#dae2fd]/70 hover:border-[#dae2fd]'
      }`}
    >
      {/* 16:9 Thumbnail (Clickable to open original video) */}
      <div
        onClick={handleOpenLink}
        className="relative w-full aspect-video bg-[#eaedff] cursor-pointer overflow-hidden"
        title="클릭하여 원본 영상으로 이동"
      >
        {video.thumbnail && !imgError ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#eaedff] to-[#dae2fd] text-[#5046e5]">
            <Film className="w-8 h-8 opacity-60 mb-1" />
            <span className="text-xs font-medium text-[#464555]">동영상 미리보기</span>
          </div>
        )}

        {/* Fresh Ingestion Highlight badge if recent */}
        {isRecentHighlight && (
          <div
            className="absolute top-3 right-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <span
              className="material-symbols-outlined text-[13px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span>방금 추가됨</span>
          </div>
        )}

        {/* Hover External Link hint */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-medium backdrop-blur-xs">
            <ExternalLink className="w-3.5 h-3.5" />
            원본 영상 열기
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
        {/* Source metadata row (YouTube / Instagram) */}
        <div className="flex items-center gap-1.5 text-xs text-[#777587] font-medium">
          <span className="material-symbols-outlined text-[15px] text-red-500">
            smart_display
          </span>
          <span>{video.source === 'instagram' ? 'Instagram' : 'YouTube'}</span>
        </div>

        {/* Title */}
        <h3
          onClick={handleOpenLink}
          className="text-sm sm:text-base font-semibold text-[#131b2e] leading-snug line-clamp-2 cursor-pointer hover:text-[#5046e5] transition-colors"
          title={video.title}
        >
          {video.title}
        </h3>

        {/* Bottom row: Category Tag & Change Button + Delete Button */}
        <div className="pt-2 border-t border-[#f2f3ff] flex items-center justify-between gap-2">
          {/* Assigned Category Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs truncate max-w-[130px]"
              style={{ backgroundColor: primaryColor }}
            >
              {video.category}
            </span>
          </div>

          {/* Action Buttons: Category Change & Delete */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Category Change Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeCategory(video);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#464555] hover:text-[#3625cd] hover:bg-[#f2f3ff] border border-[#dae2fd]/60 transition-colors cursor-pointer"
              title="카테고리 변경"
            >
              <Edit3 className="w-3 h-3 text-[#5046e5]" />
              <span className="hidden sm:inline">카테고리</span>
              <span>변경</span>
            </button>

            {/* Delete Button (Moved to trash) */}
            {onDeleteVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVideo(video);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#777587] hover:text-[#ba1a1a] hover:bg-[#fff0f0] border border-[#dae2fd]/60 hover:border-[#ffdad6] transition-colors cursor-pointer"
                title="휴지통으로 이동"
                aria-label="삭제"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span className="text-[#ba1a1a]">삭제</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
