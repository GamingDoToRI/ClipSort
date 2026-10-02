export type VideoLinkStatus = 'active' | 'source_deleted' | 'trash_purged';

export interface VideoBookmark {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  url: string;
  createdAt: number;
  source?: 'youtube' | 'instagram' | 'tiktok' | 'web';
  status?: VideoLinkStatus; // 'active' (정상 저장), 'source_deleted' (SNS 원본 삭제됨), 'trash_purged' (영구 삭제됨)
  inTrash?: boolean;
  trashedAt?: number;
}

export interface TrashItem {
  id: string;
  video: VideoBookmark;
  deletedAt: number; // timestamp when moved to trash
}

export interface UserProfile {
  isLoggedIn: boolean;
  nickname: string;
  email: string;
  avatarUrl?: string;
  provider?: 'email' | 'kakao' | 'google' | 'apple';
}

export type MainTabType = 'storage' | 'recent' | 'trash' | 'settings';

export type SettingsSubPage =
  | null
  | 'my_info'
  | 'change_password'
  | 'theme_color'
  | 'display_mode'
  | 'terms'
  | 'privacy'
  | 'version_info'
  | 'contact'
  | 'open_source';

export type ThemeColorOption = {
  id: string;
  name: string;
  sub: string;
  hex: string;
};

export type DisplayMode = 'system' | 'light' | 'dark';

export type AuthScreenType =
  | 'email_step1'
  | 'email_step2'
  | 'email_step4'
  | 'email_direct_login'
  | 'find_password'
  | 'reset_password_step'
  | 'kakao_login'
  | 'google_select'
  | 'google_consent'
  | 'apple_login';
