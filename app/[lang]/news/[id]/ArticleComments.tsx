'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  author_name: string;
  content: string;
  created_at: string;
  edited_at: string | null;
}

const STRINGS: Record<Language, Record<string, string>> = {
  ja: {
    title: 'コメント', placeholder: 'コメントを入力…', post: '投稿', loginToComment: 'コメントするにはログイン',
    empty: 'まだコメントはありません。最初のコメントを書いてみましょう！', edit: '編集', del: '削除',
    save: '保存', cancel: 'キャンセル', edited: '(編集済み)', confirmDel: 'このコメントを削除しますか？', err: 'エラーが発生しました。',
  },
  ko: {
    title: '댓글', placeholder: '댓글을 입력하세요…', post: '작성', loginToComment: '댓글을 작성하려면 로그인하세요',
    empty: '아직 댓글이 없습니다. 첫 댓글을 남겨보세요!', edit: '수정', del: '삭제',
    save: '저장', cancel: '취소', edited: '(수정됨)', confirmDel: '댓글을 삭제할까요?', err: '오류가 발생했습니다.',
  },
  en: {
    title: 'Comments', placeholder: 'Write a comment…', post: 'Post', loginToComment: 'Log in to comment',
    empty: 'No comments yet. Be the first to comment!', edit: 'Edit', del: 'Delete',
    save: 'Save', cancel: 'Cancel', edited: '(edited)', confirmDel: 'Delete this comment?', err: 'Something went wrong.',
  },
};

export default function ArticleComments({ articleId }: { articleId: string }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const s = STRINGS[lang];

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await getBrowserClient()
          .from('comments')
          .select('*')
          .eq('article_id', articleId)
          .order('created_at', { ascending: false });
        if (alive) setComments((data as Comment[]) ?? []);
      } catch {
        if (alive) setComments([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [articleId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !user || posting) return;
    setPosting(true);
    setError('');
    const authorName = (user.user_metadata?.nickname as string) || user.email?.split('@')[0] || 'User';
    try {
      const { data, error: insErr } = await getBrowserClient()
        .from('comments')
        .insert({ article_id: articleId, user_id: user.id, author_name: authorName, content })
        .select()
        .single();
      if (insErr || !data) { setError(s.err); return; }
      setComments((c) => [data as Comment, ...c]);
      setDraft('');
    } catch {
      setError(s.err);
    } finally {
      setPosting(false);
    }
  }

  async function saveEdit(id: string) {
    const content = editDraft.trim();
    if (!content) return;
    try {
      const { data, error: upErr } = await getBrowserClient()
        .from('comments')
        .update({ content, edited_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (upErr || !data) { setError(s.err); return; }
      setComments((c) => c.map((x) => (x.id === id ? (data as Comment) : x)));
      setEditingId(null);
      setEditDraft('');
    } catch {
      setError(s.err);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(s.confirmDel)) return;
    try {
      const { error: delErr } = await getBrowserClient().from('comments').delete().eq('id', id);
      if (delErr) { setError(s.err); return; }
      setComments((c) => c.filter((x) => x.id !== id));
    } catch {
      setError(s.err);
    }
  }

  const inputStyle = { color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' } as const;

  return (
    <section className="mt-12">
      <h2 className="text-base font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
        {s.title}{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {/* Composer */}
      {user ? (
        <form onSubmit={submit} className="mb-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={s.placeholder}
            className="w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-h-[88px] resize-y"
            style={inputStyle}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="py-2 px-5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {posting ? '...' : s.post}
            </button>
          </div>
        </form>
      ) : (
        <Link
          href={localePath(lang, '/login')}
          className="inline-block mb-6 py-2.5 px-5 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
        >
          {s.loginToComment}
        </Link>
      )}

      {error && <p className="text-sm mb-3" style={{ color: 'var(--accent)' }}>{error}</p>}

      {/* List */}
      {!loading && comments.length === 0 ? (
        <p className="text-sm py-4" style={{ color: 'var(--text-4)' }}>{s.empty}</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => {
            const mine = user?.id === c.user_id;
            const initial = (c.author_name || 'U').charAt(0).toUpperCase();
            return (
              <div key={c.id} className="flex gap-3">
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
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
                        <button
                          onClick={() => saveEdit(c.id)}
                          disabled={!editDraft.trim()}
                          className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                          style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                          {s.save}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditDraft(''); }}
                          className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-colors"
                          style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
                        >
                          {s.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm sm:text-base mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-2)' }}>
                        {c.content}
                      </p>
                      {mine && (
                        <div className="flex gap-3 mt-1.5">
                          <button
                            onClick={() => { setEditingId(c.id); setEditDraft(c.content); }}
                            className="text-xs font-medium transition-colors hover:text-[var(--accent)]"
                            style={{ color: 'var(--text-4)' }}
                          >
                            {s.edit}
                          </button>
                          <button
                            onClick={() => remove(c.id)}
                            className="text-xs font-medium transition-colors hover:text-[var(--accent)]"
                            style={{ color: 'var(--text-4)' }}
                          >
                            {s.del}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
