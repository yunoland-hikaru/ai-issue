import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ログインユーザーのアバター画像。クライアント側で256px程度にリサイズ済みのものを受け取り、
// avatars バケット（Public）へ保存して profiles.avatar_url を更新する。
// 認証はAuthorizationヘッダのアクセストークンを service client で検証（Storage RLSは不要）。

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await getServiceClient().auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

// POST: 画像をアップロードして avatar_url を更新
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: 'unsupported type' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'file too large' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getServiceClient();
  // ユーザーごとに固定パス。upsertで上書きし、URLにキャッシュバスター(?t=)を付ける。
  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: `upload failed: ${upErr.message}` }, { status: 500 });

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (dbErr) return NextResponse.json({ error: `db update failed: ${dbErr.message}` }, { status: 500 });

  return NextResponse.json({ url });
}

// DELETE: アバターを削除して avatar_url を null に戻す
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  // Storage上のファイルはベストエフォートで全拡張子を削除
  await supabase.storage
    .from('avatars')
    .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`])
    .catch(() => {});

  const { error: dbErr } = await supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: null, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (dbErr) return NextResponse.json({ error: `db update failed: ${dbErr.message}` }, { status: 500 });

  return NextResponse.json({ ok: true });
}
