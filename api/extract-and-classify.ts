import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleExtractAndClassify } from '../src/server/classificationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleExtractAndClassify(req, res);
}
