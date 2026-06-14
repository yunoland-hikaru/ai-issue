import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { unsubscribeToken } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

function page(message: string): Response {
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI issue</title></head>
<body style="margin:0;background:#f5f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans JP',sans-serif">
<div style="max-width:480px;margin:80px auto;background:#fff;border-radius:16px;padding:36px 28px;text-align:center">
<div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#111827;margin-bottom:18px">AI&nbsp;issue</div>
<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 22px">${message}</p>
<a href="https://ai-issue.com" style="display:inline-block;padding:10px 22px;border-radius:10px;background:#D64550;color:#fff;font-size:14px;font-weight:600;text-decoration:none">ホームへ</a>
</div></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/** メール内「配信を停止する」リンクの着地点。署名トークンを検証して購読者を削除。 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('e');
  const token = searchParams.get('t');
  const secret = process.env.NEWSLETTER_SECRET;

  if (!email || !token || !secret || token !== unsubscribeToken(email, secret)) {
    return page('リンクが無効です。お手数ですがお問い合わせください。');
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('subscribers').delete().eq('email', email);
  if (error) {
    return page('処理中にエラーが発生しました。時間をおいて再度お試しください。');
  }

  return page('ニュースレターの配信を停止しました。ご利用ありがとうございました。');
}
