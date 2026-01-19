"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>({ products: [], aggregations: { buckets: [] } });
  const [loading, setLoading] = useState(true);
  
  const query = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";

  // 1. 入力欄の即時反映用ステート
  const [inputValue, setInputValue] = useState(query);

  // 🟢 2. デバウンス処理の実装
  useEffect(() => {
    // 初回レンダリング時や、URLのqueryとinputValueが同じ時は何もしない
    if (inputValue === query) return;

    // タイマーを設定（500ms）
    const timer = setTimeout(() => {
      updateSearch(inputValue, currentCategory);
    }, 500);

    // 次の入力があったら前のタイマーをキャンセルする
    return () => clearTimeout(timer);
  }, [inputValue]); // inputValueが変わるたびに実行

  // URLが変わるたびにデータを再取得（ここは変更なし）
  useEffect(() => {
    setInputValue(query); 
    setLoading(true);
    fetch(`/api/search?${searchParams.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setData({
          products: json.products || [],
          aggregations: json.aggregations || { buckets: [] }
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
    if (currentCategory === categoryKey) {
      updateSearch(inputValue, null);
    } else {
      updateSearch(inputValue, categoryKey);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // エンター時も即座に反映させる（タイマーを待たない）
    updateSearch(inputValue, currentCategory);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="タイピングして自動検索..."
          className="border p-2 flex-1 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors">
          検索
        </button>
      </form>

      {/* 以下、サイドバーとメイン結果部分は変更なし */}
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64">
          <h2 className="font-bold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
            カテゴリ
            {currentCategory && (
              <button 
                onClick={() => updateSearch(inputValue, null)}
                className="text-[10px] text-red-500 font-normal hover:underline"
              >
                クリア
              </button>
            )}
          </h2>
          <ul className="space-y-1">
            {data.aggregations.buckets?.map((bucket: any) => (
              <li key={bucket.key}>
                <button
                  type="button"
                  onClick={() => toggleCategory(bucket.key)}
                  className={`w-full text-left px-3 py-2 rounded transition-all flex justify-between items-center ${
                    currentCategory === bucket.key 
                      ? "bg-blue-600 text-white shadow-md font-bold" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-sm">{bucket.key}</span>
                  <span className={`text-xs ${currentCategory === bucket.key ? "text-blue-100" : "text-gray-400"}`}>
                    ({bucket.doc_count})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-gray-400 animate-pulse">
              {inputValue ? `「${inputValue}」を検索中...` : "読み込み中..."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.products.map((p: any) => (
                <div key={p.id} className="border p-5 rounded-xl bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow">
                  <span className="text-[10px] uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                    {p.category}
                  </span>
                  <h3 className="font-bold mt-3 text-lg">{p.name}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{p.description}</p>
                  <p className="font-black text-xl mt-4 text-gray-900">¥{Number(p.price).toLocaleString()}</p>
                </div>
              ))}
              {data.products.length === 0 && (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl">
                  <p className="text-gray-400">「{query}」に一致する商品は見つかりませんでした。</p>
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
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}