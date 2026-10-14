import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleClassifyOnly } from '../src/server/classificationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleClassifyOnly(req, res);
}
