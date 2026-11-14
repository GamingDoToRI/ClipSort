import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleResolveSession } from '../../src/server/accountMergeService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleResolveSession(req, res);
}
