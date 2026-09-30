import React, { useState, useRef, useEffect } from 'react';

interface AvatarCropModalProps {
  imageSrc: string;
  primaryColor?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  imageSrc,
  primaryColor = '#5046e5',
  onConfirm,
  onCancel,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Circle frame size in px (e.g. 220px diameter)
  const CROP_SIZE = 220;

  // Reset state when imageSrc changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(true);
  }, [imageSrc]);

  // Touch and Mouse drag handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Crop & Export
  const handleCrop = () => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const targetSize = 400; // High resolution profile export
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a circular clipping mask
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Calculate relative coordinates and scale
    // In our UI, the crop circle is centered in container of CROP_SIZE x CROP_SIZE
    // Target ratio = targetSize / CROP_SIZE
    const ratio = targetSize / CROP_SIZE;

    // Image rendered position relative to crop circle center
    const renderedWidth = img.width * scale;
    const renderedHeight = img.height * scale;

    const imgCenterX = CROP_SIZE / 2 + position.x;
    const imgCenterY = CROP_SIZE / 2 + position.y;

    const drawX = (imgCenterX - renderedWidth / 2) * ratio;
    const drawY = (imgCenterY - renderedHeight / 2) * ratio;
    const drawW = renderedWidth * ratio;
    const drawH = renderedHeight * ratio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm(croppedDataUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="bg-[#1e2330] text-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col border border-white/10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#818cf8] text-[20px]">
              crop
            </span>
            <h3 className="font-bold text-sm tracking-tight">프로필 영역 선택</h3>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Viewport Canvas Guide */}
        <div className="p-4 flex flex-col items-center">
          <p className="text-[11px] text-white/70 mb-3 text-center">
            원하는 영역이 원형 틀 안에 들어오도록 이동 및 확대해 보세요.
          </p>

          {/* Interactive Crop Frame */}
          <div
            ref={containerRef}
            className="relative w-[220px] h-[220px] rounded-full overflow-hidden shadow-2xl border-2 border-[#5046e5] cursor-grab active:cursor-grabbing bg-black/60 touch-none flex items-center justify-center"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchEnd={handlePointerUp}
          >
            {/* The Image being transformed */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="자르기 대상"
              onLoad={() => setImageLoaded(true)}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              className="max-h-[220px] object-contain pointer-events-none"
              draggable={false}
            />

            {/* Subtle Circular Grid Guideline Overlay */}
            <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="w-full max-w-[240px] mt-5 flex items-center space-x-3">
            <span className="material-symbols-outlined text-[18px] text-white/60">zoom_out</span>
            <input
              type="range"
              min={0.8}
              max={3.0}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#5046e5]"
            />
            <span className="material-symbols-outlined text-[18px] text-white/60">zoom_in</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              <span>위치 초기화</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#ffffff] font-semibold text-xs transition-all active:scale-98 cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleCrop}
            style={{
              backgroundColor: `color-mix(in srgb, ${primaryColor} 70%, white 30%)`,
              color: '#ffffff',
            }}
            className="flex-1 py-3.5 rounded-xl text-[#ffffff] font-bold text-xs shadow-lg shadow-indigo-500/25 hover:brightness-110 hover:shadow-indigo-500/40 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-1.5 ring-2 ring-white/30 hover:ring-white/60"
          >
            <span className="material-symbols-outlined text-[17px] font-bold text-[#ffffff]">check</span>
            <span className="tracking-tight text-[#ffffff] font-bold">선택 영역 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
};
