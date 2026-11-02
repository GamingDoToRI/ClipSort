import type { VercelRequest, VercelResponse } from '@vercel/node';
import { completeEmailSignup } from '../src/server/emailAuthService.js';

export async function handleCompleteSignup(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const { email, password, nickname, approvalToken, allowPasswordUpdate } = req.body || {};
    if (!email || !password || !approvalToken) {
      return res.status(400).json({
        success: false,
        error: '이메일, 비밀번호, 가입 승인 토큰이 모두 필요합니다.',
      });
    }

    const result = await completeEmailSignup({
      email,
      password,
      nickname,
      approvalToken,
      allowPasswordUpdate: Boolean(allowPasswordUpdate),
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.code === 'EMAIL_ALREADY_EXISTS' || error.message?.includes('이미 등록된')) {
      console.warn('[Complete Signup Notice]:', error.message);
    } else {
      console.error('[Complete Signup API Error]:', error.message);
    }
    return res.status(400).json({
      success: false,
      code: error.code || 'SIGNUP_ERROR',
      error: error.message || '회원가입 처리 중 오류가 발생했습니다.',
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCompleteSignup(req, res);
}
