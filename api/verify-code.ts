import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOtpCode } from '../src/server/emailAuthService.js';

export async function handleVerifyCode(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: '이메일과 6자리 인증번호를 모두 입력해 주세요.',
      });
    }

    const result = await verifyOtpCode(email, code);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.error('[Verify Code API Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || '인증번호 검증 처리 중 오류가 발생했습니다.',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleVerifyCode(req, res);
}
