"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// 📍 ポップアップを2.5秒後にふわっと表示する関数
const displayPopUpWithDelay = (popUpData: any) => {
  if (!popUpData) return;

  console.log("⏳ Insight detected. Waiting 2.5s for better UX...");

  setTimeout(() => {
    // 重複防止：古いポップアップがあれば削除
    const existing = document.getElementById('marketing-popup-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'marketing-popup-container';
    
    // 📍 スタイル設定：最初は透明（opacity: 0）で少し下に配置（translateY）
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      pointerEvents: 'auto'
    });

    container.innerHTML = `
      <div style="background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 20px; width: 320px; position: relative; border: 1px solid #f0f0f0; font-family: sans-serif;">
        <button id="close-popup" style="position: absolute; top: 12px; right: 12px; border: none; background: none; cursor: pointer; font-size: 22px; color: #ccc; line-height: 1;">&times;</button>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="background: #e7f3ff; color: #007bff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 20px; text-transform: uppercase;">Special Offer</span>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a; font-weight: 600;">${popUpData.name}</h3>
        <p style="font-size: 14px; color: #666; margin-bottom: 16px; line-height: 1.5;">${popUpData.content || 'あなたに合わせた特別なご案内があります。'}</p>
        <button style="background: #007bff; color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; font-size: 14px; transition: background 0.2s;">詳細を確認する</button>
      </div>
    `;

    document.body.appendChild(container);

    // 閉じるボタンのイベント
    document.getElementById('close-popup')?.addEventListener('click', () => {
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 600);
    });

    // 📍 次のフレームでアニメーションをトリガー（ふわっと浮き上がる）
    requestAnimationFrame(() => {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    });

  }, 2500); // 2.5秒待機
};

// マーケツール(3001番)へイベントを飛ばす共通関数
export const trackEvent = async (event: string, extraData = {}) => {
  const MARKETING_API_URL = "http://localhost:3001/api/v1/track";
  
  // デモ用：LocalStorage等を使用して継続性を確保
  let vid = typeof window !== "undefined" ? localStorage.getItem("browser_vid") : null;
  if (!vid) {
    vid = "vid_" + Math.random().toString(36).substring(2, 11);
    if (typeof window !== "undefined") localStorage.setItem("browser_vid", vid);
  }

  try {
    const res = await fetch(MARKETING_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vid: vid,
        event,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        ...extraData,
      }),
    });
    
    const data = await res.json();
    console.log(`📡 Tracking (${event}):`, data);

    // 💡 インサイト判定によってポップアップ指示（displayPopUp）が返ってきたら表示
    if (data.action && data.action.displayPopUp) {
      displayPopUpWithDelay(data.action.displayPopUp);
    }
    
    return data;
  } catch (err) {
    console.error("❌ Tracking failed:", err);
  }
};

export default function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 📍 検索キーワードがあればプロパティに含めて送信
    const q = searchParams.get("q");
    if (q) {
      trackEvent("search_view", { properties: { q } });
    } else {
      trackEvent("page_view");
    }
  }, [pathname, searchParams]);

  return null;
}