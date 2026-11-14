import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleContactInquiry } from '../src/server/contactService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleContactInquiry(req, res);
}
