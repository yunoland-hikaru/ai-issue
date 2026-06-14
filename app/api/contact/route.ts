import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * お問い合わせフォーム送信。内容を contacts に保存し、Resendで管理者(CONTACT_TO)へ転送。
 * 管理者アドレスは env のみ（フロント・公開コードには出さない）。
 */
export async function POST(req: NextRequest) {
  let body: ContactBody = {};
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    /* no body */
  }
  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();

  if (!name || !email || !email.includes('@') || !message) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }

  // 1) DB保存（ベストエフォート: テーブル未作成でも握りつぶす）
  let stored = false;
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from('contacts').insert({ name, email, message });
    stored = !error;
  } catch {
    /* ignore */
  }

  // 2) 管理者へメール転送（Resend）
  let mailed = false;
  const to = process.env.CONTACT_TO;
  if (process.env.RESEND_API_KEY && to) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.7;color:#111827">
        <p><strong>お名前:</strong> ${esc(name)}</p>
        <p><strong>メール:</strong> ${esc(email)}</p>
        <p><strong>内容:</strong></p>
        <p style="white-space:pre-wrap;background:#f5f5fa;padding:12px;border-radius:8px">${esc(message)}</p>
      </div>`;
      const { error } = await resend.emails.send({
        from: process.env.CONTACT_FROM || 'AI issue <contact@ai-issue.com>',
        to,
        replyTo: email,
        subject: `[お問い合わせ] ${name}`,
        html,
      });
      mailed = !error;
    } catch {
      /* ignore */
    }
  }

  if (!stored && !mailed) {
    return NextResponse.json({ error: 'failed to deliver' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
