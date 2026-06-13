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
  lang: 'ko',
  setLang: () => {},
  t: ko,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('ko');
  return (
    <LangContext.Provider value={{ lang, setLang, t: MESSAGES[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
