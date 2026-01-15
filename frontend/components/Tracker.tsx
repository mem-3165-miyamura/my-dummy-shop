"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// マーケツール(3001番)へイベントを飛ばす共通関数
export const trackEvent = async (event: string, extraData = {}) => {
  const MARKETING_API_URL = "http://localhost:3001/api/v1/track";
  
  // デモ用：実際はログイン情報等から取得しますが、今回は固定or生成
  const userId = "demo_user_123"; 
  const vid = "browser_vid_001"; 

  try {
    const res = await fetch(MARKETING_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        vid,
        event,
        pageUrl: window.location.href,
        ...extraData,
      }),
    });
    const data = await res.json();
    console.log(`📡 Tracking (${event}):`, data);
  } catch (err) {
    console.error("❌ Tracking failed:", err);
  }
};

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // ページ遷移のたびに page_view イベントを送信
    trackEvent("page_view");
  }, [pathname, searchParams]);

  return null; // 画面には何も出さない
}