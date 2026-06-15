'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { getBrowserClient } from '@/lib/supabaseClient';
import { localePath } from '@/lib/i18n';
import { formatDateTime } from '@/lib/utils';
import type { Language } from '@/types';

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  hidden?: boolean;
}

interface LikeState { count: number; liked: boolean }

const STRINGS: Record<Language, Record<string, string>> = {
  ja: {
    title: 'コメント', placeholder: 'コメントを入力…', replyPlaceholder: '返信を入力…', post: '投稿',
    reply: '返信', loginToComment: 'コメントするにはログイン', empty: 'まだコメントはありません。最初のコメントを書いてみましょう！',
    edit: '編集', del: '削除', save: '保存', cancel: 'キャンセル', edited: '(編集済み)',
    confirmDel: 'このコメントを削除しますか？', err: 'エラーが発生しました。',
  },
  ko: {
    title: '댓글', placeholder: '댓글을 입력하세요…', replyPlaceholder: '답글을 입력하세요…', post: '작성',
    reply: '답글', loginToComment: '댓글을 작성하려면 로그인하세요', empty: '아직 댓글이 없습니다. 첫 댓글을 남겨보세요!',
    edit: '수정', del: '삭제', save: '저장', cancel: '취소', edited: '(수정됨)',
    confirmDel: '댓글을 삭제할까요?', err: '오류가 발생했습니다.',
  },
  en: {
    title: 'Comments', placeholder: 'Write a comment…', replyPlaceholder: 'Write a reply…', post: 'Post',
    reply: 'Reply', loginToComment: 'Log in to comment', empty: 'No comments yet. Be the first to comment!',
    edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel', edited: '(edited)',
    confirmDel: 'Delete this comment?', err: 'Something went wrong.',
  },
};

export default function ArticleComments({ articleId }: { articleId: string }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const s = STRINGS[lang];
  const loginHref = localePath(lang, '/login');
  const uid = user?.id;

  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getBrowserClient();
      try {
        const { data: cs, error: cErr } = await sb
          .from('comments')
          .select('*')
          .eq('article_id', articleId)
          .order('created_at', { ascending: true });
        if (!alive) return;
        if (cErr) { setComments([]); setLoading(false); return; }
        const list = ((cs as Comment[]) ?? []).filter((c) => !c.hidden);
        setComments(list);
        setLoading(false);

        // いいね（テーブル未作成でもコメントは表示。ベストエフォート）
        const ids = list.map((c) => c.id);
        if (ids.length) {
          try {
            const { data: ls } = await sb.from('comment_likes').select('comment_id,user_id').in('comment_id', ids);
            if (!alive) return;
            const map: Record<string, LikeState> = {};
            for (const id of ids) map[id] = { count: 0, liked: false };
            (ls as { comment_id: string; user_id: string }[] | null ?? []).forEach((row) => {
              const m = map[row.comment_id];
              if (m) { m.count++; if (uid && row.user_id === uid) m.liked = true; }
            });
            setLikes(map);
          } catch { /* likesテーブル未作成等 */ }
        }
      } catch {
        if (alive) { setComments([]); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [articleId, uid]);

  const authorName = (user?.user_metadata?.nickname as string) || user?.email?.split('@')[0] || 'User';

  async function insertComment(content: string, parentId: string | null) {
    const { data, error: insErr } = await getBrowserClient()
      .from('comments')
      .insert({ article_id: articleId, user_id: user!.id, author_name: authorName, content, parent_id: parentId })
      .select()
      .single();
    if (insErr || !data) { setError(s.err); return null; }
    const row = data as Comment;
    setComments((c) => [...c, row]);
    setLikes((m) => ({ ...m, [row.id]: { count: 0, liked: false } }));
    return row;
  }

  async function submitTop(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !user || posting) return;
    setPosting(true); setError('');
    const row = await insertComment(content, null);
    if (row) setDraft('');
    setPosting(false);
  }

  async function submitReply(parentId: string) {
    const content = replyDraft.trim();
    if (!content || !user) return;
    setError('');
    const row = await insertComment(content, parentId);
    if (row) { setReplyDraft(''); setReplyingTo(null); }
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim();
    if (!content) return;
    const { data, error: upErr } = await getBrowserClient()
      .from('comments')
      .update({ content, edited_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (upErr || !data) { setError(s.err); return; }
    setComments((c) => c.map((x) => (x.id === id ? (data as Comment) : x)));
    setEditingId(null); setEditDraft('');
  }

  async function remove(id: string) {
    if (!window.confirm(s.confirmDel)) return;
    const { error: delErr } = await getBrowserClient().from('comments').delete().eq('id', id);
    if (delErr) { setError(s.err); return; }
    // 本人削除でRLSにより返信(子)も on delete cascade で消える
    setComments((c) => c.filter((x) => x.id !== id && x.parent_id !== id));
  }

  async function toggleLike(id: string) {
    if (!user) { router.push(loginHref); return; }
    const cur = likes[id] ?? { count: 0, liked: false };
    const next: LikeState = { count: cur.count + (cur.liked ? -1 : 1), liked: !cur.liked };
    setLikes((m) => ({ ...m, [id]: next }));
    const sb = getBrowserClient();
    try {
      if (cur.liked) await sb.from('comment_likes').delete().eq('comment_id', id).eq('user_id', user.id);
      else await sb.from('comment_likes').insert({ comment_id: id, user_id: user.id });
    } catch {
      setLikes((m) => ({ ...m, [id]: cur })); // 失敗時は戻す
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  const inputStyle = { color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' } as const;
  const actionBtn = 'text-xs font-medium transition-colors hover:text-[var(--accent)]';

  function renderComment(c: Comment, isReply: boolean) {
    const mine = user?.id === c.user_id;
    const lk = likes[c.id] ?? { count: 0, liked: false };
    const initial = (c.author_name || 'U').charAt(0).toUpperCase();

    return (
      <div key={c.id} className="flex gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{c.author_name}</span>
            <span className="text-xs" style={{ color: 'var(--text-4)' }}>
              {formatDateTime(c.created_at, lang)}{c.edited_at ? ` ${s.edited}` : ''}
            </span>
          </div>

          {editingId === c.id ? (
            <div className="mt-1.5">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-h-[72px] resize-y"
                style={inputStyle}
              />
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => saveEdit(c.id)} disabled={!editDraft.trim()} className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>{s.save}</button>
                <button onClick={() => { setEditingId(null); setEditDraft(''); }} className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}>{s.cancel}</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm sm:text-base mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-2)' }}>{c.content}</p>

              <div className="flex items-center gap-4 mt-1.5">
                {/* Like */}
                <button onClick={() => toggleLike(c.id)} className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: lk.liked ? 'var(--accent)' : 'var(--text-4)' }} aria-label="like">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={lk.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {lk.count > 0 && <span>{lk.count}</span>}
                </button>

                {/* Reply (top-level only) */}
                {!isReply && (
                  <button onClick={() => { if (!user) { router.push(loginHref); return; } setReplyingTo(replyingTo === c.id ? null : c.id); setReplyDraft(''); }} className={actionBtn} style={{ color: 'var(--text-4)' }}>{s.reply}</button>
                )}

                {/* Own: edit/delete */}
                {mine && (
                  <>
                    <button onClick={() => { setEditingId(c.id); setEditDraft(c.content); }} className={actionBtn} style={{ color: 'var(--text-4)' }}>{s.edit}</button>
                    <button onClick={() => remove(c.id)} className={actionBtn} style={{ color: 'var(--text-4)' }}>{s.del}</button>
                  </>
                )}
              </div>

              {/* Reply composer */}
              {replyingTo === c.id && (
                <div className="mt-2.5">
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder={s.replyPlaceholder}
                    className="w-full rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-h-[64px] resize-y"
                    style={inputStyle}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => submitReply(c.id)} disabled={!replyDraft.trim()} className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>{s.post}</button>
                    <button onClick={() => { setReplyingTo(null); setReplyDraft(''); }} className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}>{s.cancel}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-base font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
        {s.title}{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {user ? (
        <form onSubmit={submitTop} className="mb-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={s.placeholder}
            className="w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-h-[88px] resize-y"
            style={inputStyle}
          />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={posting || !draft.trim()} className="py-2 px-5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>
              {posting ? '...' : s.post}
            </button>
          </div>
        </form>
      ) : (
        <Link href={loginHref} className="inline-block mb-6 py-2.5 px-5 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}>
          {s.loginToComment}
        </Link>
      )}

      {error && <p className="text-sm mb-3" style={{ color: 'var(--accent)' }}>{error}</p>}

      {!loading && topLevel.length === 0 ? (
        <p className="text-sm py-4" style={{ color: 'var(--text-4)' }}>{s.empty}</p>
      ) : (
        <div className="space-y-6">
          {topLevel.map((c) => {
            const replies = repliesOf(c.id);
            return (
              <div key={c.id}>
                {renderComment(c, false)}
                {replies.length > 0 && (
                  <div className="ml-11 mt-4 space-y-4">
                    {replies.map((r) => renderComment(r, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
