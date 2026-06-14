'use client';

import { createContext, useContext, useState } from 'react';
import type { Language } from '@/types';
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
 * 初期言語はサーバ(layout)が「Cookie優先 → IP国 → en」で決め、initialLangで渡す。
 * SSRと初回描画が一致するためチラつきなし。切替時はCookieに保存しサーバが次回も反映。
 */
export function LangProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  function setLang(next: Language) {
    setLangState(next);
    try {
      document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch { /* ignore */ }
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
