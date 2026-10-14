import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleSendTestEmail } from '../src/server/emailTestService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleSendTestEmail(req, res);
}
