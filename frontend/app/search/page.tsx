"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [products, setProducts] = useState<any[]>([]);
  const [aggs, setAggs] = useState<any[]>([]);
  const [query, setQuery] = useState(initialQuery);

  const fetchResults = async (q: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setProducts(data.products || []);
    setAggs(data.aggregations?.buckets || []);
  };

  useEffect(() => {
    fetchResults(initialQuery);
  }, [initialQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8">
      {/* 左：集計（アグリゲーション） */}
      <aside className="w-64">
        <h2 className="font-bold border-b pb-2 mb-4 text-gray-500">FILTER</h2>
        <ul className="space-y-2">
          {aggs.map(b => (
            <li key={b.key} className="flex justify-between text-sm">
              <span>{b.key}</span>
              <span className="bg-gray-100 px-2 rounded">{b.doc_count}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* 右：検索結果 */}
      <main className="flex-1">
        <div className="mb-8">
          <input 
            type="text" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              fetchResults(e.target.value);
            }}
            className="w-full border-b-2 border-black p-2 text-2xl outline-none"
          />
          <p className="text-sm text-gray-400 mt-2">{products.length} items found</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {products.map(p => (
            <div key={p.id} className="group">
              <div className="bg-gray-100 aspect-[3/4] mb-4 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition">Image</div>
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{p.description}</p>
              <p className="font-medium">¥{p.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Next.jsのSuspense境界が必要なため
export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}