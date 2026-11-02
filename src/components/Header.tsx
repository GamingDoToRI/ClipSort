import React from 'react';
import { LogIn, User } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  primaryColor?: string;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  primaryColor = '#5046e5',
  onOpenAccount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#dae2fd]/60 px-4 py-2.5 transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center shadow-xs"
            style={{ color: primaryColor }}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#131b2e]">
            ClipSort
          </span>
        </div>

        {/* Action Zone */}
        <div className="flex items-center gap-2">
          {/* Account Profile or Guest Login Button */}
          {user.isLoggedIn ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-[#dae2fd] bg-white text-[#131b2e] hover:bg-[#f2f3ff] active:scale-95 transition-all cursor-pointer shadow-xs"
              title="내 정보 관리"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                ) : user.nickname ? (
                  user.nickname.charAt(0)
                ) : (
                  <User className="w-3 h-3" />
                )}
              </div>
              <span className="max-w-[75px] truncate text-[#131b2e]">
                {user.nickname || '내 정보'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              title="로그인 또는 회원가입"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
