import { createHmac } from 'node:crypto';
import type { Article } from '@/types';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';
export const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'AI issue <news@ai-issue.com>';

/**
 * JST 08:00 に送る「前日分」の集計ウィンドウ。
 * 前日のJST 1日全体(00:00〜翌00:00) に created_at がある記事を対象にする（UTCで返す）。
 */
export function yesterdayJstWindow(now: Date = new Date()) {
  const JST = 9 * 3600 * 1000;
  const jstNow = new Date(now.getTime() + JST);
  const jstYesterday = new Date(jstNow.getTime() - 24 * 3600 * 1000);
  const y = jstYesterday.getUTCFullYear();
  const m = jstYesterday.getUTCMonth();
  const d = jstYesterday.getUTCDate();
  // 前日のJST 1日まるごと(00:00〜翌00:00)。JST→UTCは9時間引く（Date.UTCが繰り上げ正規化）。
  // 収集が24時間(2時間毎)になったため、深夜帯の記事も取りこぼさない。
  const startUTC = new Date(Date.UTC(y, m, d, 0 - 9, 0, 0));
  const endUTC = new Date(Date.UTC(y, m, d, 24 - 9, 0, 0));
  const label = `${y}年${m + 1}月${d}日`;
  return { startUTC, endUTC, label };
}

/** メール購読解除リンクの署名トークン（emailの改ざん防止）。 */
export function unsubscribeToken(email: string, secret: string): string {
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

export function unsubscribeUrl(email: string, secret: string): string {
  const t = unsubscribeToken(email, secret);
  return `${SITE_URL}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${t}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** ダイジェストメールのHTML本文（インラインCSS、メールクライアント向け）。 */
export function buildDigestHtml(articles: Article[], dateLabel: string, unsubUrl: string): string {
  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/news/${a.id}`;
      const title = esc(a.title_ja);
      const summary = a.summary_ja ? esc(a.summary_ja) : '';
      const img = a.image_url
        ? `<a href="${url}" style="text-decoration:none"><img src="${esc(a.image_url)}" alt="" width="552" style="width:100%;max-width:552px;height:auto;border-radius:10px;display:block;margin-bottom:10px" /></a>`
        : '';
      return `
        <tr><td style="padding:0 0 22px">
          ${img}
          <a href="${url}" style="color:#111827;text-decoration:none;font-size:18px;font-weight:700;line-height:1.4">${title}</a>
          ${summary ? `<p style="margin:8px 0 0;color:#4b5563;font-size:14px;line-height:1.6">${summary}</p>` : ''}
          <a href="${url}" style="display:inline-block;margin-top:10px;color:#D64550;font-size:13px;font-weight:600;text-decoration:none">続きを読む →</a>
        </td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;background:#f5f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans JP',sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5fa;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;padding:28px 24px">
        <tr><td style="padding-bottom:6px">
          <img src="${SITE_URL}/email-logo.png" alt="" width="28" height="28" style="vertical-align:middle;display:inline-block;border:0" />
          <span style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#111827;vertical-align:middle;margin-left:8px">AI&nbsp;issue</span>
        </td></tr>
        <tr><td style="padding-bottom:20px;border-bottom:1px solid rgba(0,0,0,0.08)">
          <span style="color:#6b7280;font-size:13px">${esc(dateLabel)} のAIニュース</span>
        </td></tr>
        <tr><td style="height:20px"></td></tr>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
        <tr><td style="padding-top:8px;border-top:1px solid rgba(0,0,0,0.08);color:#9ca3af;font-size:12px;line-height:1.6">
          <p style="margin:14px 0 0">このメールは AI issue ニュースレターにお申し込みいただいた方にお送りしています。</p>
          <p style="margin:6px 0 0"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline">配信を停止する</a> ・ <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline">${esc(SITE_URL)}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
