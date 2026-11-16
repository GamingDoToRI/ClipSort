async function ensureParsedJsonBody(req: any): Promise<void> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
  if (req.body !== undefined) return;
  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json') && !contentType.includes('text/plain')) return;

  await new Promise<void>((resolve) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const limit = 8 * 1024 * 1024;
    req.on?.('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total <= limit) chunks.push(buf);
    });
    req.on?.('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        req.body = raw ? JSON.parse(raw) : {};
      } catch {
        req.body = {};
      }
      resolve();
    });
    req.on?.('error', () => resolve());
  });
}

function attachResponseHelpers(res: any) {
  if (typeof res.status !== 'function') {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = (payload: unknown) => {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
  if (typeof res.send !== 'function') {
    res.send = (payload: any) => {
      if (Buffer.isBuffer(payload) || typeof payload === 'string') {
        res.end(payload);
      } else if (payload === undefined || payload === null) {
        res.end();
      } else {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(payload));
      }
      return res;
    };
  }
}

export default async function handler(req: any, res: any) {
  attachResponseHelpers(res);

  try {
    const parsed = new URL(req.url || '/api', 'http://localhost');
    const rawApiPath = parsed.searchParams.get('__apiPath');

    let routeSubPath = '';
    if (rawApiPath !== null) {
      parsed.searchParams.delete('__apiPath');
      routeSubPath = rawApiPath.replace(/^\/+|\/+$/g, '');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${routeSubPath}${qs ? `?${qs}` : ''}`;
    } else {
      let pathname = parsed.pathname;
      if (pathname === '/api/index' && req.headers?.['x-matched-path']) {
        const matched = String(req.headers['x-matched-path']);
        if (matched.startsWith('/api/')) pathname = matched;
      }
      routeSubPath = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
    }

    // Ensure req.query reflects cleaned parameters without __apiPath
    const cleanQuery: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      cleanQuery[key] = value;
    });
    try {
      Object.defineProperty(req, 'query', {
        value: cleanQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      // ignore if req.query is non-configurable
    }

    await ensureParsedJsonBody(req);

    switch (routeSubPath) {
      case 'auth/kakao/url': {
        const { handleKakaoAuthUrl } = await import('../src/server/kakaoAuthService.js');
        return await handleKakaoAuthUrl(req, res);
      }
      case 'auth/kakao/callback': {
        const { handleKakaoAuthCallback } = await import('../src/server/kakaoAuthService.js');
        return await handleKakaoAuthCallback(req, res);
      }
      case 'auth/resolve-session': {
        const { handleResolveSession } = await import('../src/server/accountMergeService.js');
        return await handleResolveSession(req, res);
      }
      case 'auth/merge-accounts': {
        const { handleMergeAccounts } = await import('../src/server/accountMergeService.js');
        return await handleMergeAccounts(req, res);
      }
      case 'extract-and-classify': {
        const { handleExtractAndClassify } = await import('../src/server/classificationService.js');
        return await handleExtractAndClassify(req, res);
      }
      case 'classify-only': {
        const { handleClassifyOnly } = await import('../src/server/classificationService.js');
        return await handleClassifyOnly(req, res);
      }
      case 'send-verification-code': {
        const { handleSendVerificationCode } = await import('../src/server/accountActionHandlers.js');
        return await handleSendVerificationCode(req, res);
      }
      case 'verify-code': {
        const { handleVerifyCode } = await import('../src/server/accountActionHandlers.js');
        return await handleVerifyCode(req, res);
      }
      case 'complete-signup': {
        const { handleCompleteSignup } = await import('../src/server/accountActionHandlers.js');
        return await handleCompleteSignup(req, res);
      }
      case 'delete-account': {
        const { handleDeleteAccount } = await import('../src/server/accountActionHandlers.js');
        return await handleDeleteAccount(req, res);
      }
      case 'contact-inquiry': {
        const { handleContactInquiry } = await import('../src/server/contactService.js');
        return await handleContactInquiry(req, res);
      }
      case 'send-test-email':
      case 'test-email': {
        const { handleSendTestEmail } = await import('../src/server/emailTestService.js');
        return await handleSendTestEmail(req, res);
      }
      case 'image-proxy': {
        const { handleImageProxy } = await import('../src/server/imageProxyHandler.js');
        return await handleImageProxy(req, res);
      }
      default:
        return res.status(404).json({
          success: false,
          error: `Unknown API route: /api/${routeSubPath}`,
        });
    }
  } catch (err: any) {
    console.error('[API Router Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err?.message || '서버 내부 오류가 발생했습니다.',
        code: err?.code || 'INTERNAL_SERVER_ERROR',
      });
    }
  }
}
