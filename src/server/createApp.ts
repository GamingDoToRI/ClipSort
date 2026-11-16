import express from 'express';
import { handleExtractAndClassify, handleClassifyOnly } from './classificationService.js';
import { handleSendTestEmail } from './emailTestService.js';
import {
  handleSendVerificationCode,
  handleVerifyCode,
  handleCompleteSignup,
  handleDeleteAccount,
} from './accountActionHandlers.js';
import { handleContactInquiry } from './contactService.js';
import { handleKakaoAuthUrl, handleKakaoAuthCallback } from './kakaoAuthService.js';
import { handleResolveSession, handleMergeAccounts } from './accountMergeService.js';

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: '8mb' }));

  // Resend email test endpoint
  app.all('/api/send-test-email', handleSendTestEmail);
  app.all('/api/test-email', handleSendTestEmail);

  // Email Signup, OTP Verification & Account Deletion endpoints
  app.all('/api/send-verification-code', handleSendVerificationCode);
  app.all('/api/verify-code', handleVerifyCode);
  app.all('/api/complete-signup', handleCompleteSignup);
  app.all('/api/delete-account', handleDeleteAccount);

  // YouTube & URL metadata extraction and AI categorization
  app.all('/api/extract-and-classify', handleExtractAndClassify);

  // Category classification for custom titles or reclassification
  app.all('/api/classify-only', handleClassifyOnly);

  // Customer support inquiry submission
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
        rawUrl = req.url.slice(
          req.url.indexOf('/api/image-proxy?url=') + '/api/image-proxy?url='.length
        );
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
      const allowed = [
        'cdninstagram.com',
        'fbcdn.net',
        'instagram.com',
        'ytimg.com',
        'ggpht.com',
        'tiktokcdn.com',
      ];
      const isAllowed = allowed.some((d) => parsed.hostname.endsWith(d));
      if (!isAllowed) {
        return res.status(403).send('Forbidden domain');
      }

      const response = await fetch(decoded, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
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

  return app;
}
