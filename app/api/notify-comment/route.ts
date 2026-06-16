import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 新しいコメント投稿を管理者へメール通知（Resend）。
 * commentId を受け取り、DBに実在するコメントのときだけ送信する（公開エンドポイントの悪用防止）。
 * best-effort: env未設定や失敗でも握りつぶす。
 */
export async function POST(req: NextRequest) {
  let commentId: string | undefined;
  try {
    ({ commentId } = (await req.json()) as { commentId?: string });
  } catch { /* no body */ }
  if (!commentId) return NextResponse.json({ ok: false });

  const to = process.env.CONTACT_TO || 'contact@ai-issue.com';
  if (!process.env.RESEND_API_KEY || !to) return NextResponse.json({ ok: false });

  try {
    const supabase = getServiceClient();
    // 実在確認（捏造リクエストでの通知スパムを防ぐ）
    const { data: c } = await supabase
      .from('comments')
      .select('article_id, author_name, content, parent_id, created_at')
      .eq('id', commentId)
      .maybeSingle();
    if (!c) return NextResponse.json({ ok: false });

    const { data: a } = await supabase
      .from('articles')
      .select('title_ja')
      .eq('id', c.article_id)
      .maybeSingle();
    const title = a?.title_ja || '(記事)';
    const url = `${SITE}/ja/news/${c.article_id}`;
    const kind = c.parent_id ? '返信' : 'コメント';

    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.7;color:#111827">
      <p><strong>新しい${kind}が投稿されました。</strong></p>
      <p><strong>記事:</strong> <a href="${url}">${esc(title)}</a></p>
      <p><strong>投稿者:</strong> ${esc(c.author_name || '')}</p>
      <p><strong>内容:</strong></p>
      <p style="white-space:pre-wrap;background:#f5f5fa;padding:12px;border-radius:8px">${esc(c.content || '')}</p>
    </div>`;
    await resend.emails.send({
      from: process.env.CONTACT_FROM || 'AI issue <contact@ai-issue.com>',
      to,
      subject: `[AI issue] 새 ${kind} · ${title}`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
