import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Ignore benign WebSocket connection notices in cloud preview environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (String(event.reason.message || event.reason).includes('WebSocket') ||
        String(event.reason.stack || '').includes('WebSocket'))
    ) {
      event.preventDefault();
    }
  });
}

// Register PWA service worker so Chromium recognizes the app as installable
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
    console.warn('SW register notice:', err);
  });
}

// Capture beforeinstallprompt immediately on window so it is not missed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__pwaPrompt = e;
  });
}

createRoot(document.getElementById('root')!).render(<App />);
