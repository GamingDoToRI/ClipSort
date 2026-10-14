import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleExtractAndClassify, handleClassifyOnly } from './src/server/classificationService.js';
import { handleSendTestEmail } from './src/server/emailTestService.js';
import { handleSendVerificationCode } from './api/send-verification-code.js';
import { handleVerifyCode } from './api/verify-code.js';
import { handleCompleteSignup } from './api/complete-signup.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Resend email test endpoint (supports both /api/send-test-email and alias /api/test-email)
app.all('/api/send-test-email', handleSendTestEmail);
app.all('/api/test-email', handleSendTestEmail);

// Email Signup & OTP Verification endpoints
app.all('/api/send-verification-code', handleSendVerificationCode);
app.all('/api/verify-code', handleVerifyCode);
app.all('/api/complete-signup', handleCompleteSignup);

// YouTube & URL metadata extraction and AI categorization
app.all('/api/extract-and-classify', handleExtractAndClassify);

// Category classification for custom titles or reclassification
app.all('/api/classify-only', handleClassifyOnly);

export { app };
export default app;

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
