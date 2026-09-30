import React, { useState } from 'react';
import { TrashItem } from '../../types';
import { Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';

interface TrashViewProps {
  trashItems: TrashItem[];
  primaryColor?: string;
  onRestore: (item: TrashItem) => void;
  onPermanentDelete: (itemId: string) => void;
  onClearAll: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashItems,
  primaryColor = '#5046e5',
  onRestore,
  onPermanentDelete,
  onClearAll,
}) => {
  // Modals state
  const [itemToRestore, setItemToRestore] = useState<TrashItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 30 days in milliseconds
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Calculate remaining days for an item
  const getRemainingDays = (deletedAt: number) => {
    const elapsed = Date.now() - deletedAt;
    const remainingMs = Math.max(0, THIRTY_DAYS_MS - elapsed);
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return days;
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28 pt-2">
      {/* Header */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#fff0f0] flex items-center justify-center text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[22px]">delete</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#131b2e]">휴지통</h2>
              <p className="text-xs text-[#777587]">삭제된 영상 보관함</p>
            </div>
          </div>

          {trashItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#fff0f0] border border-[#ffdad6] transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>휴지통 비우기</span>
            </button>
          )}
        </div>

        {/* 30-Day Auto Permanent Deletion Warning Banner */}
        <div className="bg-[#fff9ed] border border-[#fde68a] rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#92400e] mb-0.5">
              30일 후 자동 영구 삭제 안내
            </h4>
            <p className="text-[11px] text-[#b45309] leading-relaxed">
              휴지통에 보관된 영상은 들어온 후로 <span className="font-bold underline">30일이 지나면 ClipSort에서 영구 삭제됩니다.</span> 필요한 영상은 기간 내에 복원해 주세요.
            </p>
          </div>
        </div>
      </section>

      {/* Main List Area */}
      {trashItems.length === 0 ? (
        <div className="py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-[#dae2fd] my-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#777587]">
            <span className="material-symbols-outlined text-[28px]">delete_sweep</span>
          </div>
          <h3 className="text-base font-semibold text-[#131b2e] mb-1">
            휴지통이 비어 있습니다
          </h3>
          <p className="text-xs text-[#777587] max-w-sm mx-auto leading-relaxed">
            보관함에서 삭제한 영상이 이곳에 보관됩니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-[#777587] px-1 font-medium">
            <span>보관 중인 영상 {trashItems.length}개</span>
            <span>남은 기간 기준 자동 삭제</span>
          </div>

          {trashItems.map((item) => {
            const remainingDays = getRemainingDays(item.deletedAt);
            const isUrgent = remainingDays <= 3;

            return (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-[#dae2fd]/70 p-3.5 shadow-xs hover:border-[#dae2fd] transition-all flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
              >
                {/* Video Info (Thumbnail + Title + Metadata) */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#eaedff] flex-shrink-0 relative">
                    <img
                      src={item.video.thumbnail}
                      alt={item.video.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                      {item.video.category}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#131b2e] leading-snug truncate mb-1" title={item.video.title}>
                      {item.video.title}
                    </h4>

                    {/* Expiration badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-[#fff0f0] text-[#ba1a1a] border border-[#ffdad6]'
                            : 'bg-[#f2f3ff] text-[#5046e5]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{remainingDays}일 후 영구 삭제</span>
                      </span>
                      <span className="text-[11px] text-[#777587]">
                        {item.video.source === 'instagram' ? 'Instagram' : 'YouTube'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Restore & Permanent Delete */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f2f3ff] flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setItemToRestore(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#131b2e] bg-[#f2f3ff] hover:bg-[#eaedff] border border-[#dae2fd]/60 active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="보관함으로 복원"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#5046e5]" />
                    <span>복원</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToDelete(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ba1a1a] bg-white hover:bg-[#fff0f0] border border-[#ffdad6] active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="영구 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>영구 삭제</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Restore Confirm Modal */}
      {itemToRestore && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setItemToRestore(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              영상을 복원하시겠습니까?
            </h3>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              선택한 영상이 원래 카테고리('{itemToRestore.video.category}')의 보관함으로 복원됩니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setItemToRestore(null)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-98 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestore(itemToRestore);
                  setItemToRestore(null);
                }}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 rounded-xl text-white font-semibold text-xs hover:brightness-110 transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Permanent Delete Confirm Modal */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#fff0f0] text-[#ba1a1a]">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              영상을 영구히 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              영구 삭제된 영상은 복구할 수 없으며 ClipSort에서 완전히 사라집니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-98 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete) {
                    onPermanentDelete(itemToDelete);
                    setItemToDelete(null);
                  }
                }}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-[#93000a] transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Trash Confirm Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto text-center w-[85%] border border-[#dae2fd]/60 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full p-3 mx-auto mb-3 flex items-center justify-center bg-[#fff0f0] text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[26px]">delete_forever</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e] mb-1.5 tracking-tight">
              휴지통을 모두 비우시겠습니까?
            </h3>
            <p className="text-xs text-[#777587] leading-relaxed mb-6">
              휴지통의 모든 영상({trashItems.length}개)이 영구 삭제되며 다시 복원할 수 없습니다.
            </p>
            <div className="flex items-center space-x-2 w-full">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] font-semibold text-xs hover:bg-[#eaedff] transition-colors active:scale-98 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-[#93000a] transition-colors active:scale-98 shadow-sm cursor-pointer"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
