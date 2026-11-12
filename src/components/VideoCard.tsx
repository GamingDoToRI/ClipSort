import React, { useState } from 'react';
import { ExternalLink, Edit3, Trash2, Film, Copy, Check } from 'lucide-react';
import { VideoBookmark } from '../types';

interface VideoCardProps {
  video: VideoBookmark;
  isRecentHighlight?: boolean;
  primaryColor?: string;
  onChangeCategory: (video: VideoBookmark) => void;
  onDeleteVideo?: (video: VideoBookmark) => void;
  onShowToast?: (msg: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isRecentHighlight = false,
  primaryColor = '#5046e5',
  onChangeCategory,
  onDeleteVideo,
  onShowToast,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleOpenLink = () => {
    if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(video.url);
      setIsCopied(true);
      if (onShowToast) onShowToast('영상 링크가 클립보드에 복사되었습니다!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      if (onShowToast) onShowToast('링크 복사 권한이 필요합니다.');
    }
  };

  const formatSavedTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const isInstagram = video.source === 'instagram' || video.url.includes('instagram.com');
  const isTikTok = video.source === 'tiktok' || video.url.includes('tiktok.com');

  const displayTitle =
    isInstagram && (video.title === 'Instagram' || video.title.toLowerCase() === 'instagram')
      ? (() => {
          const match = video.url.match(/instagram\.com\/(?:reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/i);
          return match ? `인스타그램 릴스 (${match[1]})` : '인스타그램 릴스 비디오';
        })()
      : video.title;

  const isCdnImage =
    video.thumbnail &&
    (video.thumbnail.includes('cdninstagram.com') ||
      video.thumbnail.includes('fbcdn.net') ||
      video.thumbnail.includes('tiktokcdn.com'));

  const resolvedThumbnailSrc = isCdnImage
    ? `/api/image-proxy?url=${encodeURIComponent(video.thumbnail)}`
    : video.thumbnail;

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
        {resolvedThumbnailSrc && !imgError && !resolvedThumbnailSrc.includes('unsplash.com') ? (
          <img
            src={resolvedThumbnailSrc}
            alt={video.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : isInstagram ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white p-4 relative overflow-hidden select-none">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-lg pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-black/15 rounded-full blur-lg pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md mb-1.5 border border-white/30">
              <span className="material-symbols-outlined text-[24px] text-white">movie</span>
            </div>
            <span className="text-xs font-black tracking-wide drop-shadow-xs uppercase">Instagram Reel</span>
            <span className="text-[11px] text-white/90 font-medium mt-0.5 max-w-[85%] truncate text-center">
              {video.title}
            </span>
          </div>
        ) : isTikTok ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#010101] via-[#111111] to-[#1a1a2e] text-white p-4 relative overflow-hidden select-none">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-md mb-1.5 border border-white/20">
              <span className="material-symbols-outlined text-[24px] text-[#25F4EE]">music_video</span>
            </div>
            <span className="text-xs font-black tracking-wide drop-shadow-xs uppercase text-white">TikTok Short</span>
            <span className="text-[11px] text-gray-300 font-medium mt-0.5 max-w-[85%] truncate text-center">
              {video.title}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#eaedff] to-[#dae2fd] text-[#5046e5]">
            <Film className="w-8 h-8 opacity-60 mb-1" />
            <span className="text-xs font-medium text-[#464555]">동영상 미리보기</span>
          </div>
        )}

        {/* Fresh Ingestion Highlight badge if recent */}
        {isRecentHighlight && (
          <div
            className="absolute top-3 right-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10"
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
        {/* Source metadata row (YouTube / Instagram / TikTok) + Saved Time */}
        <div className="flex items-center justify-between text-xs text-[#777587]">
          <div className="flex items-center gap-1.5 font-medium">
            {isInstagram ? (
              <>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-xs">
                  IG
                </span>
                <span className="font-bold text-[#e1306c]">Instagram Reel</span>
              </>
            ) : isTikTok ? (
              <>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-black text-white shadow-xs">
                  TT
                </span>
                <span className="font-bold text-black">TikTok</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px] text-red-500">
                  smart_display
                </span>
                <span className="font-bold text-red-600">YouTube</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-[#8e8ca0]" title="저장된 시점">
            {formatSavedTime(video.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={handleOpenLink}
          className="text-sm sm:text-base font-semibold text-[#131b2e] leading-snug line-clamp-2 cursor-pointer hover:text-[#5046e5] transition-colors"
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        {/* Video Link URL bar */}
        <div className="text-[11px] text-[#777587] truncate bg-[#f2f3ff]/60 px-2 py-1 rounded-md border border-[#dae2fd]/50 font-mono">
          {video.url}
        </div>

        {/* Bottom row: Category Tag & Quick Action Buttons */}
        <div className="pt-2 border-t border-[#f2f3ff] flex items-center justify-between gap-2">
          {/* Assigned Category Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            {video.category === '미분류' ? (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
                title="카테고리가 분류되지 않았습니다. 카테고리 변경 버튼을 눌러 지정해주세요."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>분류 필요</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-semibold shadow-xs truncate max-w-[120px]"
                style={{ backgroundColor: primaryColor }}
              >
                {video.category}
              </span>
            )}
          </div>

          {/* Action Buttons: Quick Copy Link, Category Change, Delete */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative">
            {/* Quick Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#464555] hover:bg-[#f2f3ff] border border-[#dae2fd]/60 transition-colors cursor-pointer"
              title="링크 복사"
              aria-label="링크 복사"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-bold hidden sm:inline">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#777587]" />
                  <span className="text-[11px] hidden sm:inline">복사</span>
                </>
              )}
            </button>

            {/* Category Change Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeCategory(video);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                video.category === '미분류'
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold shadow-xs'
                  : 'text-[#464555] hover:text-[#3625cd] hover:bg-[#f2f3ff] border border-[#dae2fd]/60'
              }`}
              title={video.category === '미분류' ? '카테고리 지정하기 (분류 필요)' : '카테고리 변경'}
            >
              <Edit3 className={`w-3 h-3 ${video.category === '미분류' ? 'text-amber-600' : 'text-[#5046e5]'}`} />
              <span className="hidden sm:inline">카테고리</span>
              <span>{video.category === '미분류' ? '지정' : '변경'}</span>
            </button>

            {/* Delete Button (Moved to trash) */}
            {onDeleteVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVideo(video);
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#777587] hover:text-[#ba1a1a] hover:bg-[#fff0f0] border border-[#dae2fd]/60 hover:border-[#ffdad6] transition-colors cursor-pointer"
                title="휴지통으로 이동"
                aria-label="삭제"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#ba1a1a]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
