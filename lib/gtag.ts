// Google Analytics(GA4) のイベント送信ヘルパー（クライアント専用）。
// gtag.js は app/[lang]/layout.tsx の <head> で全ページにロード済み（window.gtag）。
// 未ロード・SSR 時は安全に no-op になるので、呼び出し側はガード不要。
//
// 計測している「重要イベント（Key event 候補）」:
//   - sign_up      … ニュースレター購読完了（newsletter/page.tsx）
//   - article_read … 記事本文を75%までスクロール＝精読（ArticleView.tsx）
//   - share        … 記事のシェア/URLコピー成功（ArticleView.tsx）
// GA側で上記イベントを「キーイベント」に指定すると転換として集計できる。

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Record<string, unknown>) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params ?? {});
}
