// components/ProductCard.tsx (例)
"use client";
import { trackEvent } from "@/components/Tracker";

export default function ProductCard({ product }: { product: any }) {
  const handleAddToCart = async () => {
    // 1. カート追加の処理（既存のロジック）
    console.log("Cart added:", product.name);

    // 2. マーケツールへ「この人がこの商品をカートに入れた」と報告
    await trackEvent("add_to_cart", {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category
    });
    
    alert("カートに追加しました！");
  };

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-bold">{product.name}</h3>
      <p className="text-gray-600">{product.price}円</p>
      <button 
        onClick={handleAddToCart}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
      >
        カートに入れる
      </button>
    </div>
  );
}