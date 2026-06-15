'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  nickname: string | null;
  displayName: string;
  needsNickname: boolean;
  signOut: () => Promise<void>;
  applyNickname: (n: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  nickname: null,
  displayName: '',
  needsNickname: false,
  signOut: async () => {},
  applyNickname: () => {},
});

/** ログイン状態 + profiles(ニックネーム)を供給。ニックネーム未設定なら needsNickname=true。 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profilesOk, setProfilesOk] = useState(true); // profilesテーブル未作成時はモーダルを強制しない

  useEffect(() => {
    const sb = getBrowserClient();
    let active = true;

    async function loadProfile(u: User | null) {
      if (!u) { setNickname(null); setProfileLoaded(true); return; }
      const { data, error } = await sb.from('profiles').select('nickname').eq('id', u.id).maybeSingle();
      if (!active) return;
      if (error) { setProfilesOk(false); setNickname(null); }
      else { setProfilesOk(true); setNickname((data?.nickname as string) ?? null); }
      setProfileLoaded(true);
    }

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data.session?.user ?? null;
      setUser(u); setLoading(false); loadProfile(u);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u); setProfileLoaded(false); loadProfile(u);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await getBrowserClient().auth.signOut();
  }
  function applyNickname(n: string) {
    setNickname(n);
  }

  const md = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    nickname ||
    (md.nickname as string) || (md.full_name as string) || (md.name as string) ||
    user?.email?.split('@')[0] || 'User';
  const needsNickname = !!user && profileLoaded && profilesOk && !nickname;

  return (
    <AuthContext.Provider value={{ user, loading, nickname, displayName, needsNickname, signOut, applyNickname }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
