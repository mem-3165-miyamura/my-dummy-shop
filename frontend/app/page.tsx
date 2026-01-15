"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <div className="relative h-[60vh] flex items-center justify-center bg-gray-900 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl font-bold mb-4 italic">NEW COLLECTION 2026</h1>
          <p className="text-xl mb-8">あなたのスタイルを、Elasticsearchで見つける。</p>
          
          {/* 検索フォーム */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="アイテムを探す (例: パーカー, Tシャツ)"
              className="flex-1 p-4 rounded-full text-black outline-none"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition">
              SEARCH
            </button>
          </form>
        </div>
      </div>

      {/* おすすめカテゴリなど */}
      <div className="p-16 text-center">
        <h2 className="text-2xl font-bold mb-8 underline decoration-double">FEATURED CATEGORIES</h2>
        <div className="grid grid-cols-3 gap-8">
          {['Tops', 'Pants', 'Outer'].map(cat => (
            <div key={cat} className="border p-12 hover:bg-gray-50 cursor-pointer transition">
              <span className="text-lg font-medium">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}