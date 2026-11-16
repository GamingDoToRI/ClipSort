import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let rawUrl = (req.query.url as string) || '';
    if (!rawUrl && req.url && req.url.includes('/api/image-proxy?url=')) {
      rawUrl = req.url.slice(
        req.url.indexOf('/api/image-proxy?url=') + '/api/image-proxy?url='.length
      );
    }
    if (!rawUrl) {
      return res.status(400).send('URL is required');
    }

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
}
