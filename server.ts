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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Explicitly serve Service Worker and manifest with correct MIME types
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
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
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
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
