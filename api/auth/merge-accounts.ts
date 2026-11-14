import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMergeAccounts } from '../../src/server/accountMergeService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleMergeAccounts(req, res);
}
