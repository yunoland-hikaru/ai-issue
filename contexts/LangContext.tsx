'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Language } from '@/types';
import ja from '@/messages/ja';
import ko from '@/messages/ko';
import en from '@/messages/en';
import type { Messages } from '@/messages/ja';

const MESSAGES: Record<Language, Messages> = { ja, ko, en };
const LANGS: Language[] = ['ja', 'ko', 'en'];

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

// アクセス国（ブラウザ言語）から既定言語を決定: 韓国→ko / 日本→ja / それ以外→en。
// 手動で切り替えた場合は localStorage の選択を優先する。
function detectLang(): Language {
  try {
    const saved = localStorage.getItem('lang');
    if (saved && (LANGS as string[]).includes(saved)) return saved as Language;
  } catch { /* ignore */ }
  const pref = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
  if (pref.startsWith('ko')) return 'ko';
  if (pref.startsWith('ja')) return 'ja';
  return 'en';
}

// 外部ストア（useSyncExternalStoreで購読）。effect内setStateを避ける。
let currentLang: Language = 'ja';
let detected = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  // 初回購読時（ハイドレーション後）にアクセス国/保存値を確定する。
  if (!detected) {
    detected = true;
    const next = detectLang();
    if (next !== currentLang) { currentLang = next; emit(); }
  }
  return () => listeners.delete(cb);
}

function setLangStore(next: Language) {
  detected = true;
  currentLang = next;
  try { localStorage.setItem('lang', next); } catch { /* ignore */ }
  emit();
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  // SSRと初回クライアント描画は 'ja' で一致させ、購読後に確定言語へ切り替える。
  const lang = useSyncExternalStore(subscribe, () => currentLang, () => 'ja' as Language);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangStore, t: MESSAGES[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
