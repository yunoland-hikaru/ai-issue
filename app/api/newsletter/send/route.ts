import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceClient } from '@/lib/supabase';
import {
  yesterdayJstWindow,
  buildDigestHtml,
  unsubscribeUrl,
  NEWSLETTER_FROM,
} from '@/lib/newsletter';
import type { Article } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * ニュースレターのダイジェスト配信。cron-job.org が毎日 JST 08:00(=UTC 23:00) に叩く。
 * 前日のJST 1日分(00:00〜翌00:00)の記事をまとめ、購読者全員に Resend で送信。
 * 認証: Authorization: Bearer <NEWSLETTER_SECRET>。
 */
export async function POST(req: NextRequest) {
  const secret = process.env.NEWSLETTER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'NEWSLETTER_SECRET not configured' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const supabase = getServiceClient();
  const { startUTC, endUTC, label } = yesterdayJstWindow();

  // 対象記事（前日のJST 1日分）
  const { data: articles, error: aErr } = await supabase
    .from('articles')
    .select('*')
    .gte('created_at', startUTC.toISOString())
    .lt('created_at', endUTC.toISOString())
    .order('created_at', { ascending: false });
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!articles || articles.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no articles in window', window: { startUTC, endUTC } });
  }

  // 購読者
  const { data: subs, error: sErr } = await supabase.from('subscribers').select('email');
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  const emails = (subs ?? []).map((s) => s.email).filter((e): e is string => !!e);
  if (emails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject = `【AI issue】${label}のAIニュース ${articles.length}本`;

  // 購読者ごとにメール作成（配信停止リンクを個別化）。Resendの一括送信は100件/回まで。
  // List-Unsubscribe（RFC 8058のワンクリック）でGmail等の信頼度・配信性を上げる。
  const messages = emails.map((email) => {
    const unsub = unsubscribeUrl(email, secret);
    return {
      from: NEWSLETTER_FROM,
      to: email,
      subject,
      html: buildDigestHtml(articles as Article[], label, unsub),
      headers: {
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const { error } = await resend.batch.send(chunk);
    if (error) errors.push(error.message);
    else sent += chunk.length;
  }

  return NextResponse.json({ ok: errors.length === 0, sent, articles: articles.length, errors });
}
