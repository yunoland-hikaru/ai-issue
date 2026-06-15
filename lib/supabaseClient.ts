import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ブラウザ用シングルトン。セッション維持・自動更新・OAuthリダイレクト検出を有効化。
// 認証(ログイン/サインアップ/Google)とログイン後のクライアント操作(コメント等)で使う。
let browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return browserClient;
}
