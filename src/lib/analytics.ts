declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
let initialized = false;

export function initAnalytics(): void {
  if (initialized || !GA_ID || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: true,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, params || {});
}

export function trackTabView(tabName: string): void {
  if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', 'page_view', {
    page_title: `ClipSort - ${tabName}`,
    page_path: `/${tabName}`,
  });
}
