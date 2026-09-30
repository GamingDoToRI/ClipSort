import React, { useState } from 'react';
import { VideoBookmark } from '../../types';
import { Trash2 } from 'lucide-react';

interface RecentTimelineViewProps {
  bookmarks: VideoBookmark[];
  onChangeCategory: (video: VideoBookmark) => void;
  onDeleteVideo?: (video: VideoBookmark) => void;
  primaryColor?: string;
}

export const RecentTimelineView: React.FC<RecentTimelineViewProps> = ({
  bookmarks,
  onChangeCategory,
  onDeleteVideo,
  primaryColor = '#5046e5',
}) => {
  // Group bookmarks into Today (오늘) and Yesterday/Older (어제 / 이전)
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const todayBookmarks = bookmarks.filter((b) => b.createdAt >= oneDayAgo);
  const olderBookmarks = bookmarks.filter((b) => b.createdAt < oneDayAgo);

  const formatRelativeTime = (timestamp: number) => {
    const diffMins = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (diffMins < 1) return '방금 전 저장됨';
    if (diffMins < 60) return `${diffMins}분 전 저장됨`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전 저장됨`;
    return '어제 저장됨';
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28 pt-2">
      {/* Subheader & Controls Area */}
      <section className="mb-4">
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ color: primaryColor, fontVariationSettings: "'FILL' 1" }}
            >
              auto_label
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#131b2e]">최근 분류</h2>
          </div>
          <p className="text-xs text-[#777587]">
            저장된 시점 순으로 AI가 분류한 영상 목록
          </p>
        </div>

        {/* Filter/Sort Indicator Bar */}
        <div className="flex items-center justify-between bg-[#f2f3ff] rounded-xl px-4 py-2.5 border border-[#dae2fd]/60">
          <div className="flex items-center gap-1 text-xs text-[#131b2e] font-semibold">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ color: primaryColor }}
            >
              swap_vert
            </span>
            <span>최신순 (저장 시점 기준)</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#5046e5] border border-[#dae2fd]">
            총 {bookmarks.length}개
          </span>
        </div>
      </section>

      {/* Empty State */}
      {bookmarks.length === 0 && (
        <div className="py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-[#dae2fd] my-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#eaedff] flex items-center justify-center text-[#5046e5]">
            <span className="material-symbols-outlined text-[28px]">schedule</span>
          </div>
          <h3 className="text-base font-semibold text-[#131b2e] mb-1">
            최근 저장된 영상이 없습니다
          </h3>
          <p className="text-xs text-[#777587] max-w-sm mx-auto">
            보관함 탭에서 링크를 추가하면 시간대별로 분류된 타임라인을 확인하실 수 있습니다.
          </p>
        </div>
      )}

      {/* Timeline Section: 오늘 (Today) */}
      {todayBookmarks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5046e5]" />
            <h3 className="text-sm font-bold text-[#131b2e]">오늘 ({todayBookmarks.length})</h3>
          </div>

          <div className="flex flex-col gap-3">
            {todayBookmarks.map((video) => (
              <article
                key={video.id}
                className="bg-white rounded-2xl border border-[#dae2fd]/70 p-3.5 shadow-xs hover:border-[#dae2fd] transition-all"
              >
                <div className="flex items-center justify-between text-xs text-[#777587] mb-2 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{formatRelativeTime(video.createdAt)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#5046e5]">자동 분류 완료</span>
                </div>

                <div className="flex gap-3 items-start">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#eaedff] relative block group"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-[20px]">
                        open_in_new
                      </span>
                    </div>
                  </a>

                  <div className="flex-1 flex flex-col justify-between h-20">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#131b2e] leading-snug line-clamp-2 hover:text-[#5046e5]"
                    >
                      {video.title}
                    </a>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#f2f3ff]">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-[11px] font-semibold truncate max-w-[120px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {video.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onChangeCategory(video)}
                          className="flex items-center gap-0.5 text-xs text-[#464555] hover:text-[#3625cd] transition-colors py-0.5 px-1.5 rounded hover:bg-[#f2f3ff] cursor-pointer"
                        >
                          <span>카테고리 변경</span>
                        </button>
                        {onDeleteVideo && (
                          <button
                            type="button"
                            onClick={() => onDeleteVideo(video)}
                            className="flex items-center gap-0.5 text-xs text-[#ba1a1a] hover:bg-[#fff0f0] transition-colors py-0.5 px-1.5 rounded cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Section: 어제 / 이전 (Yesterday or Older) */}
      {olderBookmarks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
            <h3 className="text-sm font-bold text-[#131b2e]">
              어제 및 이전 ({olderBookmarks.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {olderBookmarks.map((video) => (
              <article
                key={video.id}
                className="bg-white rounded-2xl border border-[#dae2fd]/70 p-3.5 shadow-xs hover:border-[#dae2fd] transition-all"
              >
                <div className="flex items-center justify-between text-xs text-[#777587] mb-2 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>{new Date(video.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#eaedff] relative block group"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>

                  <div className="flex-1 flex flex-col justify-between h-20">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#131b2e] leading-snug line-clamp-2 hover:text-[#5046e5]"
                    >
                      {video.title}
                    </a>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#f2f3ff]">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-[11px] font-semibold truncate max-w-[120px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {video.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onChangeCategory(video)}
                          className="flex items-center gap-0.5 text-xs text-[#464555] hover:text-[#3625cd] transition-colors py-0.5 px-1.5 rounded hover:bg-[#f2f3ff] cursor-pointer"
                        >
                          <span>카테고리 변경</span>
                        </button>
                        {onDeleteVideo && (
                          <button
                            type="button"
                            onClick={() => onDeleteVideo(video)}
                            className="flex items-center gap-0.5 text-xs text-[#ba1a1a] hover:bg-[#fff0f0] transition-colors py-0.5 px-1.5 rounded cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
