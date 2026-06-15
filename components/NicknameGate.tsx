'use client';

import { useAuth } from '@/contexts/AuthContext';
import NicknameModal from './NicknameModal';

// ニックネーム未設定のログインユーザーにのみモーダルを表示（必要な時だけマウント）。
export default function NicknameGate() {
  const { needsNickname } = useAuth();
  if (!needsNickname) return null;
  return <NicknameModal />;
}
