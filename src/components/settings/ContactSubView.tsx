import React, { useState, useRef } from 'react';

interface ContactSubViewProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const ContactSubView: React.FC<ContactSubViewProps> = ({
  onBack,
  onShowToast,
}) => {
  const [inquiryType, setInquiryType] = useState<'bug' | 'feature' | 'ai' | 'other'>('bug');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [inquiryBody, setInquiryBody] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText('support@clipsort.app');
    onShowToast('이메일 주소(support@clipsort.app)가 복사되었습니다');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachedImages.length + files.length > 3) {
      onShowToast('이미지는 최대 3장까지 첨부할 수 있습니다.');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setAttachedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryBody.trim()) {
      onShowToast('문의 내용을 입력해 주세요.');
      return;
    }
    onShowToast('문의가 개발팀으로 성공적으로 전송되었습니다.');
    setInquiryBody('');
    setAttachedImages([]);
    setTimeout(() => {
      onBack();
    }, 1200);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-28">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-1 py-3 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#dae2fd]/40">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
          <h1 className="font-bold text-base text-[#131b2e] tracking-tight">개발팀 문의</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-1 pt-3 space-y-4">
        {/* Informational Bento Card */}
        <section className="bg-white rounded-2xl p-4 border border-[#dae2fd]/60 shadow-xs space-y-3">
          <div className="space-y-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#5046e5]">
              <span className="material-symbols-outlined text-[13px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
              영업일 기준 24시간 이내 회신
            </span>
            <p className="text-xs text-[#777587] leading-relaxed pt-1">
              어떤 도움이 필요하신가요? 문의사항이나 버그 제보, 기능 제안을 남겨주시면 개발팀이 신속하게 답변해 드립니다.
            </p>
          </div>

          {/* Support Email Pill */}
          <div className="flex items-center justify-between bg-[#f2f3ff] px-3.5 py-2.5 rounded-xl border border-[#dae2fd]/40">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="material-symbols-outlined text-[#5046e5] text-[18px]">
                alternate_email
              </span>
              <span className="text-xs font-semibold text-[#131b2e] select-all truncate">
                support@clipsort.app
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white text-[#5046e5] text-xs font-semibold border border-[#dae2fd]/60 hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              <span>복사</span>
            </button>
          </div>
        </section>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Inquiry Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#131b2e]">
              문의 유형 <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInquiryType('bug')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
                  inquiryType === 'bug'
                    ? 'bg-[#5046e5] text-white shadow-sm'
                    : 'bg-white text-[#464555] border border-[#dae2fd]/60 hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bug_report</span>
                <span>버그/오류 제보</span>
              </button>

              <button
                type="button"
                onClick={() => setInquiryType('feature')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
                  inquiryType === 'feature'
                    ? 'bg-[#5046e5] text-white shadow-sm'
                    : 'bg-white text-[#464555] border border-[#dae2fd]/60 hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                <span>기능 제안</span>
              </button>

              <button
                type="button"
                onClick={() => setInquiryType('ai')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
                  inquiryType === 'ai'
                    ? 'bg-[#5046e5] text-white shadow-sm'
                    : 'bg-white text-[#464555] border border-[#dae2fd]/60 hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>AI 분류 오류</span>
              </button>

              <button
                type="button"
                onClick={() => setInquiryType('other')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer ${
                  inquiryType === 'other'
                    ? 'bg-[#5046e5] text-white shadow-sm'
                    : 'bg-white text-[#464555] border border-[#dae2fd]/60 hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">help</span>
                <span>기타 문의</span>
              </button>
            </div>
          </div>

          {/* 2. Device Diagnostic */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#dae2fd]/60 flex items-center justify-between shadow-xs">
            <div className="flex items-start space-x-2.5 min-w-0">
              <span className="material-symbols-outlined text-[#777587] text-[20px] mt-0.5">
                phone_iphone
              </span>
              <div>
                <p className="text-xs font-bold text-[#131b2e]">디바이스 진단 정보</p>
                <p className="text-[11px] text-[#777587] truncate">ClipSort v1.0.0 · Web/Mobile</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#c7c4d8]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5046e5]" />
            </label>
          </div>

          {/* 3. Return Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#131b2e]">
              답변 받을 이메일 <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-none focus:border-[#5046e5]"
            />
          </div>

          {/* 4. Details Textarea */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-[#131b2e]">
                문의 내용 작성 <span className="text-[#ba1a1a]">*</span>
              </label>
              <span className="text-[11px] text-[#777587]">{inquiryBody.length} / 1000</span>
            </div>
            <textarea
              value={inquiryBody}
              onChange={(e) => setInquiryBody(e.target.value)}
              maxLength={1000}
              rows={4}
              required
              placeholder="발생한 문제 상황이나 제안하고 싶은 기능을 상세히 적어주세요. (링크 복사 오류, 비디오 썸네일 미표시 등)"
              className="w-full p-3 rounded-xl bg-white border border-[#dae2fd] text-xs text-[#131b2e] focus:outline-none focus:border-[#5046e5] resize-none"
            />
          </div>

          {/* 5. Image Attachment (Optional - No asterisk per requirement) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#131b2e]">
                이미지 첨부
              </label>
              <span className="text-[11px] text-[#777587] font-normal">
                (최대 3장 · {attachedImages.length}/3)
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
              {/* Add Button Tile */}
              {attachedImages.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-[#dae2fd] hover:border-[#5046e5] flex flex-col items-center justify-center text-[#777587] hover:text-[#5046e5] bg-white active:scale-95 transition-all flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                  <span className="text-[10px] mt-1 font-semibold">사진 추가</span>
                </button>
              )}

              {/* Attached Image Preview Tiles */}
              {attachedImages.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#dae2fd]/60 flex-shrink-0 group shadow-xs"
                >
                  <img
                    src={imgSrc}
                    alt={`첨부 이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="이미지 삭제"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-[#ba1a1a] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#5046e5] hover:bg-[#3625cd] text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">send</span>
              <span>문의 보내기</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
