import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__pwaPrompt) {
      return (window as any).__pwaPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect if running inside iframe (e.g. AI Studio development preview)
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsIframe(inIframe);

    // Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') (window as any).__pwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<
    'installed' | 'prompted' | 'dismissed' | 'opened_top_tab' | 'ios_share' | 'show_omnibox_guide'
  > => {
    // 1. Direct Chrome/Android beforeinstallprompt if available
    let promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwaPrompt : null);

    // If inside iframe (e.g. AI Studio development preview):
    // Chrome strictly blocks beforeinstallprompt in cross-origin iframes.
    // Must open a top-level standalone tab to allow native PWA installation.
    if (isIframe) {
      try {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('clipsort_open_pwa_install', 'true');
          } catch {
            // ignore
          }
          const targetUrl = new URL(window.location.href);
          targetUrl.searchParams.set('pwa', 'install');
          targetUrl.hash = '#pwa-install';
          window.open(targetUrl.toString(), '_blank');
        }
        return 'opened_top_tab';
      } catch (e) {
        console.warn('Open window error:', e);
      }
    }

    // 2. iOS Safari with Web Share API
    if (isIOS && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ClipSort - AI 스마트 클립 보관함',
          text: '유튜브, 인스타그램, 틱톡 영상 링크를 자동 분류해 주는 ClipSort',
          url: window.location.href,
        });
        return 'ios_share';
      } catch (shareErr) {
        return 'ios_share';
      }
    }

    // 3. In top-level tab: if promptEvent is not ready yet, wait up to 1.2s for Chrome's event
    if (!promptEvent && typeof window !== 'undefined') {
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        let isDone = false;
        const handler = (e: Event) => {
          if (!isDone) {
            isDone = true;
            window.removeEventListener('beforeinstallprompt', handler);
            resolve(e as BeforeInstallPromptEvent);
          }
        };
        window.addEventListener('beforeinstallprompt', handler);
        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            window.removeEventListener('beforeinstallprompt', handler);
            resolve((window as any).__pwaPrompt || null);
          }
        }, 1200);
      });
    }

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') (window as any).__pwaPrompt = null;
          return 'installed';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('PWA prompt install error:', err);
      }
    }

    // If deferredPrompt is still not available (e.g. desktop Chrome omnibox mode),
    // guide user to Chrome's native omnibox install icon
    return 'show_omnibox_guide';
  };

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!(window as any).__pwaPrompt),
    isInstalled,
    isIOS,
    isIframe,
    install: triggerInstall,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
