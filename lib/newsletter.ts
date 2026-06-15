import { createHmac } from 'node:crypto';
import type { Article } from '@/types';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';
export const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'AI issue <news@ai-issue.com>';

/**
 * 朝のダイジェスト集計ウィンドウ: 直近の「JST 08:00」を終端とする過去24時間。
 * 例) JST 6/15 08:00 配信 → 6/14 08:00〜6/15 08:00 の記事（UTCで返す）。
 * 収集が24時間(2時間毎・最大12本/日)になったため、固定の「前日1日(00〜24時)」だと
 * 配信直前(当日0〜8時)の記事が翌日まで漏れる。直近24時間にすることで
 * 各記事を一度だけ・最大24時間以内に配信し、件数も安定する(約10〜12本)。
 * label は配信日(終端日)＝朝刊と同じ感覚。
 */
export function digestWindow(now: Date = new Date()) {
  const JST = 9 * 3600 * 1000;
  const jstNow = new Date(now.getTime() + JST);
  let y = jstNow.getUTCFullYear();
  let m = jstNow.getUTCMonth();
  let d = jstNow.getUTCDate();
  // 終端は「その日の JST 08:00」。万一 08:00 より前に走った場合は前日の 08:00 を終端に。
  if (jstNow.getUTCHours() < 8) {
    const prev = new Date(Date.UTC(y, m, d) - 24 * 3600 * 1000);
    y = prev.getUTCFullYear(); m = prev.getUTCMonth(); d = prev.getUTCDate();
  }
  // JST 08:00 → UTCは9時間引く（Date.UTCが繰り下げ正規化）。
  const endUTC = new Date(Date.UTC(y, m, d, 8 - 9, 0, 0));
  const startUTC = new Date(endUTC.getTime() - 24 * 3600 * 1000);
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
