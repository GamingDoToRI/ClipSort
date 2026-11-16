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
import { handleImageProxy } from './imageProxyHandler.js';

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
  app.all('/api/image-proxy', handleImageProxy);

  return app;
}
