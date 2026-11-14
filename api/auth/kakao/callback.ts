import { handleKakaoAuthCallback } from '../../../src/server/kakaoAuthService.js';

export default async function handler(req: any, res: any) {
  return handleKakaoAuthCallback(req, res);
}
