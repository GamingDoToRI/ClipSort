import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleExtractAndClassify, handleClassifyOnly } from './src/server/classificationService.js';
import { handleSendTestEmail } from './src/server/emailTestService.js';
import { handleSendVerificationCode } from './api/send-verification-code.js';
import { handleVerifyCode } from './api/verify-code.js';
import { handleCompleteSignup } from './api/complete-signup.js';
import { handleDeleteAccount } from './api/delete-account.js';
import { handleContactInquiry } from './src/server/contactService.js';
import { handleKakaoAuthUrl, handleKakaoAuthCallback } from './src/server/kakaoAuthService.js';
import { handleResolveSession, handleMergeAccounts } from './src/server/accountMergeService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '8mb' }));

// Explicitly serve Service Worker and manifest with correct MIME types
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Dynamic SEO robots.txt & sitemap.xml respecting SITE_URL if a custom domain is configured
const getPublicSiteUrl = () =>
  (
    process.env.SITE_URL?.trim() ||
    'https://ais-pre-65azsuha2xifn2bgmsfkhq-887540500420.asia-east1.run.app'
  ).replace(/\/+$/, '');

app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${getPublicSiteUrl()}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (_req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${getPublicSiteUrl()}/</loc>
    <lastmod>2026-11-14</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);
});

// Serve public static assets (icons, manifest.json, etc.)
app.use(express.static(path.resolve(__dirname, 'public')));

// Resend email test endpoint (supports both /api/send-test-email and alias /api/test-email)
app.all('/api/send-test-email', handleSendTestEmail);
app.all('/api/test-email', handleSendTestEmail);

// Email Signup & OTP Verification endpoints
app.all('/api/send-verification-code', handleSendVerificationCode);
app.all('/api/verify-code', handleVerifyCode);
app.all('/api/complete-signup', handleCompleteSignup);
app.all('/api/delete-account', handleDeleteAccount);

// YouTube & URL metadata extraction and AI categorization
app.all('/api/extract-and-classify', handleExtractAndClassify);

// Category classification for custom titles or reclassification
app.all('/api/classify-only', handleClassifyOnly);

// Customer support inquiry submission (saves to Firestore & notifies operator email)
app.all('/api/contact-inquiry', handleContactInquiry);

// Kakao OAuth login endpoints (supports trailing slash on callback)
app.get('/api/auth/kakao/url', handleKakaoAuthUrl);
app.get(['/api/auth/kakao/callback', '/api/auth/kakao/callback/'], handleKakaoAuthCallback);

// Unified Account Session Resolution & Account Merging endpoints
app.post('/api/auth/resolve-session', handleResolveSession);
app.post('/api/auth/merge-accounts', handleMergeAccounts);

// Safe image proxy endpoint to bypass Meta/Instagram Referer blocks and CDN expiration
app.all('/api/image-proxy', async (req, res) => {
  try {
    let rawUrl = (req.query.url as string) || '';
    if (!rawUrl && req.url.includes('/api/image-proxy?url=')) {
      rawUrl = req.url.slice(req.url.indexOf('/api/image-proxy?url=') + '/api/image-proxy?url='.length);
    }
    if (!rawUrl) return res.status(400).send('URL is required');

    let decoded = rawUrl;
    try {
      decoded = decodeURIComponent(rawUrl);
    } catch {
      // ignore
    }
    decoded = decoded.replace(/&amp;/g, '&');

    const parsed = new URL(decoded);
    const allowed = ['cdninstagram.com', 'fbcdn.net', 'instagram.com', 'ytimg.com', 'ggpht.com', 'tiktokcdn.com'];
    const isAllowed = allowed.some((d) => parsed.hostname.endsWith(d));
    if (!isAllowed) {
      return res.status(403).send('Forbidden domain');
    }

    const response = await fetch(decoded, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Image proxy error:', err);
    return res.status(500).send('Proxy error');
  }
});

export { app };
export default app;

async function startServer() {
  if (!isProduction) {
    // Serve a clean zero-WebSocket @vite/client shim in dev mode since HMR is disabled,
    // preventing Vite 8 from opening a WebSocket to port 24678 and logging connection errors.
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipSort Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the HTTP listener when running as a persistent Node server (e.g. AI Studio preview)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
