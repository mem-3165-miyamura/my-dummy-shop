"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 追加
import { ShoppingCart, User, Search } from 'lucide-react';

const Header = () => {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  // 検索実行時の処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      // 検索ページへ遷移し、クエリパラメータを付与
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* 左側：ロゴとナビゲーション */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-blue-600">
            MY DUMMY SHOP
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <Link href="/category/men" className="hover:text-blue-600 transition">メンズ</Link>
            <Link href="/category/women" className="hover:text-blue-600 transition">レディース</Link>
            <Link href="/category/sale" className="text-red-500 hover:text-red-600 transition font-bold">SALE</Link>
          </nav>
        </div>
        
        {/* 右側：検索・ユーザー・カート */}
        <div className="flex items-center gap-4">
          {/* 検索バー：formタグで囲むことでEnterキーでの送信を可能にします */}
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="商品を検索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-10 w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </form>

          {/* アイコンボタン類 */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="マイページ">
              <User className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 relative" title="カート">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;