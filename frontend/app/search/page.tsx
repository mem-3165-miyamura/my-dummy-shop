"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>({ products: [], aggregations: [] });
  const [loading, setLoading] = useState(true);
  const [activePromo, setActivePromo] = useState<any>(null);
  
  const query = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "recommended";

  const [inputValue, setInputValue] = useState(query);

  const searchParamsKey = searchParams.toString();

  const getPreferredCategory = () => {
    if (typeof window === "undefined") return null;
    const history = JSON.parse(localStorage.getItem("search_history") || "{}");
    const sorted = Object.entries(history).sort((a: any, b: any) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  const trackAndSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParamsKey);
    const pref = getPreferredCategory();
    if (pref) params.set("pref", pref);

    try {
      // SaaSへの問い合わせ
      const trackRes = await fetch("http://localhost:3001/api/v1/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "search_view",
          vid: "browser_vid_001",
          userId: "admin_1",
          properties: { q: query, sort: currentSort, category: currentCategory }
        })
      });
      const trackData = await trackRes.json();

      if (trackData.action?.displayPopUp) {
        setActivePromo({
          ...trackData.action.displayPopUp,
          isInsight: trackData.action.isInsightTriggered
        });
      } else {
        setActivePromo(null);
      }

      if (trackData.insights?.price_sensitivity) {
        params.set("price_sensitivity", trackData.insights.price_sensitivity);
      }

      const res = await fetch(`/api/products/search?${params.toString()}`);
      const json = await res.json();
      setData({ products: json.products || [], aggregations: json.categories || [] });
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParamsKey, query, currentSort, currentCategory]);

  useEffect(() => {
    setInputValue(query);
    trackAndSearch();
  }, [trackAndSearch, query]);

  const updateSearch = (newQ: string | null, newCat: string | null, newSort: string | null) => {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ || "");
    if (newCat) params.set("category", newCat);
    if (newSort && newSort !== "recommended") params.set("sort", newSort);

    // 📍 修正点：カテゴリ変更時も明示的にイベント送信
    const isSortChanged = newSort !== currentSort;
    const isCategoryChanged = newCat !== currentCategory;

    if (isSortChanged || isCategoryChanged) {
      fetch("http://localhost:3001/api/v1/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: isSortChanged ? "change_sort" : "change_category",
          vid: "browser_vid_001",
          userId: "admin_1",
          properties: { 
            sort_type: newSort,
            category: newCat // SaaS側はこの値を見て +10 点する
          }
        })
      });
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto relative">
      {activePromo && (
        <div className="fixed bottom-10 right-10 z-50 transform transition-all hover:scale-105">
          <div className={`p-6 rounded-3xl shadow-2xl max-w-sm border-4 ${
            activePromo.isInsight 
              ? "border-orange-500 bg-white ring-8 ring-orange-500/10" 
              : "border-gray-100 bg-white"
          }`}>
            <button onClick={() => setActivePromo(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            {activePromo.isInsight && (
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">INSIGHT MATCH</span>
                <span className="text-[10px] text-orange-600 font-bold">検索傾向から提案</span>
              </div>
            )}
            <h4 className="font-black text-xl mb-1 text-gray-800">{activePromo.title}</h4>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">{activePromo.description}</p>
            <button className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 ${
              activePromo.isInsight ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}>{activePromo.buttonText || "今すぐチェック"}</button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); updateSearch(inputValue, currentCategory, currentSort); }} className="flex gap-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="検索..." className="border p-3 flex-1 rounded-2xl shadow-inner outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50" />
        <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg">検索</button>
      </form>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <h2 className="font-bold mb-4 text-gray-800 border-b pb-2">カテゴリ</h2>
          <ul className="space-y-1">
            {data.aggregations?.map((cat: any) => (
              <li key={cat.name}>
                <button
                  onClick={() => updateSearch(inputValue, cat.name, currentSort)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${currentCategory === cat.name ? "bg-gray-900 text-white font-bold shadow-md" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  {cat.name} <span className="text-[10px] opacity-50 ml-1">({cat.count})</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">{data.products.length} Results</p>
            <select value={currentSort} onChange={(e) => updateSearch(inputValue, currentCategory, e.target.value)} className="border bg-white text-xs font-bold p-2 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="recommended">おすすめ順</option>
              <option value="price_asc">価格の安い順</option>
              <option value="price_desc">価格の高い順</option>
            </select>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-6 opacity-20 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-300 rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.products.map((p: any) => (
                <div key={p.id} className="group border-2 border-gray-50 p-6 rounded-3xl bg-white hover:border-blue-500 transition-all relative">
                  <div className="flex justify-between mb-4">
                    <span className="text-[9px] uppercase bg-blue-50 px-2 py-1 rounded-md font-black text-blue-600">{p.category}</span>
                    {currentSort === "recommended" && <span className="text-[10px] text-gray-300 font-mono">Score: {p._score?.toFixed(1)}</span>}
                  </div>
                  <h3 className="font-bold text-xl mb-2" dangerouslySetInnerHTML={{ __html: p.name }} />
                  <p className="text-gray-400 text-sm line-clamp-2 mb-6" dangerouslySetInnerHTML={{ __html: p.description }} />
                  <div className="flex items-end justify-between">
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase">Price</p><p className="font-black text-2xl text-gray-900">¥{Number(p.price).toLocaleString()}</p></div>
                    {p.isSale && <span className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-black shadow-lg shadow-red-200">SALE</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Neural Search Initializing...</div>}>
      <SearchContent />
    </Suspense>
  );
}