import { Resend } from 'resend';
import { getFirebaseAdminApp } from './firebaseAdminHelper.js';
import { SITE_CONFIG } from '../config/siteConfig.js';

interface InquiryRateLimitEntry {
  count: number;
  windowStart: number;
  lastSentAt: number;
}

const inquiryRateLimitMap = new Map<string, InquiryRateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_INQUIRIES_PER_WINDOW = 5;
const COOLDOWN_MS = 15 * 1000; // 15 seconds

const INQUIRY_LABELS: Record<string, string> = {
  bug: '버그/오류 제보',
  feature: '기능 제안',
  ai: 'AI 분류 오류',
  other: '기타 문의',
};

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function checkInquiryRateLimit(key: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = inquiryRateLimitMap.get(key);

  if (!entry) {
    inquiryRateLimitMap.set(key, { count: 1, windowStart: now, lastSentAt: now });
    return { allowed: true };
  }

  const elapsed = now - entry.lastSentAt;
  if (elapsed < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return {
      allowed: false,
      message: `문의 접수가 너무 빠릅니다. ${waitSec}초 후에 다시 시도해 주세요.`,
    };
  }

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    inquiryRateLimitMap.set(key, { count: 1, windowStart: now, lastSentAt: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_INQUIRIES_PER_WINDOW) {
    return {
      allowed: false,
      message: '잠시 후 다시 시도해 주세요. (10분당 최대 5회까지 접수 가능)',
    };
  }

  entry.count += 1;
  entry.lastSentAt = now;
  return { allowed: true };
}

export async function handleContactInquiry(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
  }

  try {
    const {
      inquiryType = 'other',
      replyEmail = '',
      message = '',
      includeDiagnostics = true,
      appVersion = SITE_CONFIG.appVersion,
      userAgent = '',
      attachments = [],
    } = req.body || {};

    const cleanReplyEmail = String(replyEmail).trim();
    const cleanMessage = String(message).trim();
    const cleanType = INQUIRY_LABELS[String(inquiryType)] ? String(inquiryType) : 'other';
    const typeLabel = INQUIRY_LABELS[cleanType];

    if (!cleanReplyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanReplyEmail)) {
      return res.status(400).json({
        success: false,
        error: '답변 받으실 올바른 이메일 주소를 입력해 주세요.',
      });
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return res.status(400).json({
        success: false,
        error: '문의 내용을 5자 이상 자세히 작성해 주세요.',
      });
    }

    if (cleanMessage.length > 1500) {
      return res.status(400).json({
        success: false,
        error: '문의 내용은 1,500자 이하로 작성해 주세요.',
      });
    }

    const clientIp =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      cleanReplyEmail.toLowerCase();

    const rateCheck = checkInquiryRateLimit(`${clientIp}:${cleanReplyEmail.toLowerCase()}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateCheck.message,
      });
    }

    const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const operatorEmail = process.env.OPERATOR_EMAIL?.trim() || SITE_CONFIG.operatorEmail;

    // 1. Store inquiry record in Firestore via Admin SDK (best effort)
    let savedToFirestore = false;
    const { firestore, hasServiceAccount } = getFirebaseAdminApp();
    if (hasServiceAccount && firestore) {
      try {
        await firestore.collection('inquiries').doc(inquiryId).set({
          id: inquiryId,
          inquiryType: cleanType,
          typeLabel,
          replyEmail: cleanReplyEmail,
          message: cleanMessage,
          includeDiagnostics: Boolean(includeDiagnostics),
          appVersion: String(appVersion).slice(0, 50),
          userAgent: includeDiagnostics ? String(userAgent).slice(0, 300) : '',
          attachmentCount: Array.isArray(attachments) ? Math.min(attachments.length, 3) : 0,
          recipientEmail: operatorEmail,
          createdAt: Date.now(),
          status: 'received',
        });
        savedToFirestore = true;
      } catch (err: any) {
        console.warn('[Contact Inquiry] Firestore save skipped:', err.message);
      }
    }

    // 2. Send notification email via Resend
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'ClipSort <onboarding@resend.dev>';
    const isTestSender = fromEmail.includes('@resend.dev');
    const testFallbackEmail = process.env.RESEND_TEST_EMAIL?.trim();

    let emailSent = false;
    let emailErrorMsg = '';

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      // Parse valid base64 image attachments (max 3, capped in size)
      const resendAttachments: Array<{ filename: string; content: Buffer }> = [];
      if (Array.isArray(attachments)) {
        attachments.slice(0, 3).forEach((rawImg, idx) => {
          if (typeof rawImg === 'string' && rawImg.startsWith('data:image/')) {
            const match = rawImg.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
            if (match && match[2] && match[2].length <= 4 * 1024 * 1024) {
              const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
              resendAttachments.push({
                filename: `attachment_${idx + 1}.${ext}`,
                content: Buffer.from(match[2], 'base64'),
              });
            }
          }
        });
      }

      const subject = `[ClipSort 고객문의][${typeLabel}] ${cleanReplyEmail}`;
      const diagText = includeDiagnostics
        ? `\n\n[진단 정보]\n- 앱 버전: ClipSort v${appVersion}\n- 환경: ${userAgent || '미상'}`
        : '';

      const textBody = `[ClipSort 신규 고객 문의 접수]
문의 ID: ${inquiryId}
문의 유형: ${typeLabel}
답변 받을 이메일: ${cleanReplyEmail}
수신 지정 운영자: ${operatorEmail}

[문의 내용]
${cleanMessage}${diagText}`;

      const htmlBody = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px 16px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table align="center" width="100%" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:linear-gradient(135deg,#4338ca 0%,#5046e5 100%);color:#ffffff;">
        <h1 style="margin:0;font-size:18px;font-weight:700;">ClipSort 신규 문의 접수</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#e0e7ff;">문의 유형: ${escapeHtml(typeLabel)} · ${escapeHtml(inquiryId)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#334155;">
          <div><strong>답변 받을 이메일:</strong> ${escapeHtml(cleanReplyEmail)}</div>
          <div style="margin-top:4px;"><strong>운영자 수신처:</strong> ${escapeHtml(operatorEmail)}</div>
        </div>
        <div style="font-size:14px;line-height:1.7;color:#0f172a;white-space:pre-wrap;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">${escapeHtml(cleanMessage)}</div>
        ${
          includeDiagnostics
            ? `<div style="margin-top:16px;font-size:11px;color:#64748b;background:#f1f5f9;padding:10px 12px;border-radius:8px;">
                <div><strong>진단 정보:</strong> ClipSort v${escapeHtml(String(appVersion))}</div>
                <div style="margin-top:2px;word-break:break-all;">${escapeHtml(String(userAgent || 'N/A'))}</div>
              </div>`
            : ''
        }
      </td>
    </tr>
  </table>
</body>
</html>`;

      try {
        const primarySend = await resend.emails.send({
          from: fromEmail,
          to: [operatorEmail],
          replyTo: cleanReplyEmail,
          subject,
          text: textBody,
          html: htmlBody,
          ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {}),
        });

        if (!primarySend.error) {
          emailSent = true;
        } else {
          emailErrorMsg = primarySend.error.message || 'Resend send error';
          // Fallback to verified test recipient if Resend free sandbox restricts recipient
          if (isTestSender && testFallbackEmail && testFallbackEmail.toLowerCase() !== operatorEmail.toLowerCase()) {
            const fallbackSend = await resend.emails.send({
              from: fromEmail,
              to: [testFallbackEmail],
              replyTo: cleanReplyEmail,
              subject: `${subject} (운영자: ${operatorEmail})`,
              text: textBody,
              html: htmlBody,
              ...(resendAttachments.length > 0 ? { attachments: resendAttachments } : {}),
            });
            if (!fallbackSend.error) {
              emailSent = true;
            }
          }
        }
      } catch (err: any) {
        emailErrorMsg = err.message || 'Email delivery failed';
      }
    }

    if (!emailSent && !savedToFirestore) {
      console.warn('[Contact Inquiry] Neither Resend nor Firestore succeeded:', emailErrorMsg);
      return res.status(503).json({
        success: false,
        error: `문의 자동 발송 설정이 완료되지 않았습니다. 직접 ${operatorEmail} 로 메일을 보내주시면 빠르게 답변드리겠습니다.`,
      });
    }

    return res.status(200).json({
      success: true,
      inquiryId,
      emailSent,
      savedToFirestore,
      message: '문의가 운영팀으로 안전하게 접수되었습니다.',
    });
  } catch (err: any) {
    console.error('[Contact Inquiry Error]:', err);
    return res.status(500).json({
      success: false,
      error: '문의 접수 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
}
