import { createApiApp } from '../src/server/createApp.js';

const app = createApiApp();

export default function handler(req: any, res: any) {
  // Restore original /api/* pathname & query string when rewritten via vercel.json
  try {
    const parsed = new URL(req.url || '/api', 'http://localhost');
    const apiPath = parsed.searchParams.get('__apiPath');
    if (apiPath !== null) {
      parsed.searchParams.delete('__apiPath');
      const cleanSubPath = apiPath.replace(/^\/+/, '');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${cleanSubPath}${qs ? `?${qs}` : ''}`;
    } else if (req.headers?.['x-matched-path'] && req.url === '/api/index') {
      const matched = String(req.headers['x-matched-path']);
      if (matched.startsWith('/api/')) {
        req.url = matched;
      }
    }
  } catch {
    // Keep original req.url on fallback
  }

  return app(req, res);
}
