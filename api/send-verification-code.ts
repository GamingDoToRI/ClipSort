import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendOtpVerificationEmail } from '../src/server/emailAuthService.js';

export async function handleSendVerificationCode(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: '이메일 주소를 입력해 주세요.',
      });
    }

    const result = await sendOtpVerificationEmail(email);
    return res.status(result.success ? 200 : 429).json(result);
  } catch (error: any) {
    console.error('[Send Code API Error]:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || '인증번호 발송 처리 중 오류가 발생했습니다.',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleSendVerificationCode(req, res);
}
