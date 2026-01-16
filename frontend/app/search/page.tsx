"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [products, setProducts] = useState<any[]>([]);
  const [aggs, setAggs] = useState<any[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [isTyping, setIsTyping] = useState(false);

  const fetchResults = async (q: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setProducts(data.products || []);
      setAggs(data.aggregations?.buckets || []);
    } catch (error) {
      console.error("Search fetch error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // 🟢 1. URLのパラメータ（initialQuery）が変わった時に同期する
  // これによりヘッダーからの検索が反映されます
  useEffect(() => {
    setQuery(initialQuery);
    fetchResults(initialQuery);
  }, [initialQuery]);

  // ✅ 2. 入力に対するデバウンス処理
  // ユーザーがページ内の入力欄で文字を打つのを止めてから300ms後に実行
  useEffect(() => {
    // URLと現在の入力が同じで、かつ既にデータがある場合はスキップ
    if (query === initialQuery && products.length > 0) return;

    const timer = setTimeout(() => {
      fetchResults(query);
      
      // URLのクエリパラメータも同期
      const params = new URLSearchParams(window.location.search);
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8">
      {/* 左：集計（アグリゲーション） */}
      <aside className="w-64">
        <h2 className="font-bold border-b pb-2 mb-4 text-gray-400 uppercase tracking-widest text-[10px]">Filter / Category</h2>
        <ul className="space-y-3">
          {aggs.length > 0 ? (
            aggs.map(b => (
              <li key={b.key} className="flex justify-between text-sm group cursor-pointer">
                <span className="text-gray-700 group-hover:text-blue-600 transition-colors font-medium">{b.key}</span>
                <span className="bg-gray-100 px-2 rounded-full text-gray-500 text-[10px] flex items-center">{b.doc_count}</span>
              </li>
            ))
          ) : (
            <p className="text-xs text-gray-300 italic">No categories</p>
          )}
        </ul>
      </aside>

      {/* 右：検索結果 */}
      <main className="flex-1">
        <div className="mb-12 relative">
          <input 
            type="text" 
            value={query}
            placeholder="Search products..."
            onChange={(e) => {
              setQuery(e.target.value);
              setIsTyping(true);
            }}
            className="w-full border-b-2 border-black p-2 text-4xl outline-none placeholder:text-gray-100 focus:border-blue-500 transition-all font-light"
          />
          <div className="flex items-center gap-2 mt-4">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'}`}></span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isTyping ? "Fetching..." : `${products.length} Results Found`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-16">
          {products.map(p => (
            <div key={p.id} className="group cursor-pointer">
              <div className="bg-gray-50 aspect-[3/4] mb-6 flex items-center justify-center text-gray-200 group-hover:bg-gray-100 transition-all duration-500 relative">
                <span className="text-[9px] tracking-[0.2em] uppercase font-bold">Preview</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-1 font-medium">{p.description}</p>
                <p className="font-black text-gray-900 pt-2 text-md italic tracking-tighter">¥{p.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {!isTyping && products.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl mt-12">
            <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No Items Found</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-300 font-bold animate-pulse text-xs uppercase tracking-[0.3em]">Loading View...</div>}>
      <SearchContent />
    </Suspense>
  );
}