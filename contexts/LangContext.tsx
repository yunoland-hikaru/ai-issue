'use client';

import { createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Language } from '@/types';
import { LOCALES } from '@/lib/i18n';
import ja from '@/messages/ja';
import ko from '@/messages/ko';
import en from '@/messages/en';
import type { Messages } from '@/messages/ja';

const MESSAGES: Record<Language, Messages> = { ja, ko, en };

interface LangContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Messages;
}

const LangContext = createContext<LangContextValue>({
  lang: 'ja',
  setLang: () => {},
  t: ja,
});

/**
 * 言語はURLのロケール接頭辞(/ja /ko /en)が正本。layout がルートパラメータから lang を渡す。
 * 切替時は同じパスのロケール部分を差し替えて遷移し、Cookieにも保存（ルート"/"再訪時に proxy が反映）。
 */
export function LangProvider({
  lang,
  children,
}: {
  lang: Language;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setLang(next: Language) {
    try {
      document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch { /* ignore */ }

    const segments = (pathname || `/${lang}`).split('/');
    if (LOCALES.includes(segments[1] as Language)) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.push(segments.join('/') || `/${next}`);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: MESSAGES[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
