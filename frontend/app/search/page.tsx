"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>({ products: [], aggregations: [] });
  const [loading, setLoading] = useState(true);
  
  const query = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";

  const [inputValue, setInputValue] = useState(query);

  // 📍 お気に入りカテゴリを取得する関数（localStorageから計算）
  const getPreferredCategory = () => {
    if (typeof window === "undefined") return null;
    const history = JSON.parse(localStorage.getItem("search_history") || "{}");
    // カウントが最大のもの（かつ1回以上クリックされているもの）を抽出
    const sorted = Object.entries(history).sort((a: any, b: any) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  // 📍 クリックを追跡して好みを保存する関数
  const trackClick = (category: string) => {
    const history = JSON.parse(localStorage.getItem("search_history") || "{}");
    history[category] = (history[category] || 0) + 1;
    localStorage.setItem("search_history", JSON.stringify(history));
    console.log("Preference updated:", category, history[category]);
  };

  useEffect(() => {
    if (inputValue === query) return;
    const timer = setTimeout(() => {
      updateSearch(inputValue, currentCategory);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, query, currentCategory]);

  useEffect(() => {
    setInputValue(query); 
    setLoading(true);
    
    // 📍 検索パラメータの構築
    const params = new URLSearchParams(searchParams.toString());
    
    // 📍 パーソナライズ用パラメータ 'pref' を付与
    const pref = getPreferredCategory();
    if (pref) params.set("pref", pref);
    
    fetch(`/api/products/search?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setData({
          products: json.products || [],
          aggregations: json.categories || [] 
        });
        setLoading(false);
      });
  }, [searchParams, query]);

  const updateSearch = (newQ: string | null, newCat: string | null) => {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newCat) params.set("category", newCat);
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  };

  const toggleCategory = (categoryKey: string) => {
    // カテゴリ選択時も「好み」としてカウント
    trackClick(categoryKey);
    if (currentCategory === categoryKey) {
      updateSearch(inputValue, null);
    } else {
      updateSearch(inputValue, categoryKey);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(inputValue, currentCategory);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="検索..."
          className="border p-2 flex-1 rounded shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors">
          検索
        </button>
      </form>

      <div className="flex flex-col md:flex-row gap-8">
        {/* サイドバー: カテゴリ集計 */}
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="font-bold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
            カテゴリ
            {currentCategory && (
              <button onClick={() => updateSearch(inputValue, null)} className="text-[10px] text-red-500 hover:underline">クリア</button>
            )}
          </h2>
          <ul className="space-y-1">
            {data.aggregations?.map((cat: any) => (
              <li key={cat.name}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded transition-all flex justify-between items-center ${
                    currentCategory === cat.name 
                      ? "bg-blue-600 text-white shadow-md font-bold" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-sm">{cat.name}</span>
                  <span className={`text-xs ${currentCategory === cat.name ? "text-blue-100" : "text-gray-400"}`}>
                    ({cat.count})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* メイン: 検索結果 */}
        <main className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-gray-400 animate-pulse">読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.products.map((p: any) => (
                <div 
                  key={p.id} 
                  // 📍 商品カードクリック時に履歴を保存
                  onClick={() => trackClick(p.category)}
                  className="cursor-pointer border p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow relative active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                      {p.category}
                    </span>
                    <span className="text-[8px] text-gray-300">Score: {p._score?.toFixed(2)}</span>
                  </div>

                  <h3 
                    className="font-bold mt-1 text-lg leading-tight"
                    dangerouslySetInnerHTML={{ __html: p.name }}
                  />
                  
                  <p 
                    className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: p.description }}
                  />
                  
                  <div className="flex items-baseline gap-2 mt-4">
                    <p className="font-black text-xl text-gray-900">¥{Number(p.price).toLocaleString()}</p>
                    {p.isSale && (
                      <span className="text-xs font-bold text-red-500 px-1.5 py-0.5 border border-red-500 rounded">SALE</span>
                    )}
                  </div>
                </div>
              ))}
              {data.products.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                   該当する商品は見つかりませんでした。
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading search interface...</div>}>
      <SearchContent />
    </Suspense>
  );
}