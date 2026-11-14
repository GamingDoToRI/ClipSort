import { handleKakaoAuthUrl } from '../../../src/server/kakaoAuthService.js';

export default async function handler(req: any, res: any) {
  return handleKakaoAuthUrl(req, res);
}
