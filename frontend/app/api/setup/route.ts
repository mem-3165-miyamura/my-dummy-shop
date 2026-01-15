// frontend/src/app/api/setup/route.ts

import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = [
    { id: 101, name: "オーバーサイズ ヘビーウェイトTシャツ", category: "トップス", price: 3900, description: "綿100%の厚手生地。ストリートスタイルに最適なシルエット。" },
    { id: 102, name: "リネンブレンド リラックスパンツ", category: "パンツ", price: 5800, description: "清涼感のある麻混素材。夏場でも快適に過ごせるワイドパンツ。" },
    { id: 103, name: "撥水加工 マウンテンパーカー", category: "アウター", price: 12800, description: "急な雨でも安心の防風・撥水機能。キャンプやフェスに最適。" },
    { id: 104, name: "ヴィンテージウォッシュ デニムジャケット", category: "アウター", price: 8900, description: "着古したような風合いのGジャン。どんな服にも合わせやすい一着。" },
    { id: 105, name: "カシミヤタッチ Vネックセーター", category: "トップス", price: 4500, description: "柔らかく肌触りの良いニット。オフィスカジュアルにも使えます。" }
  ];

  try {
    // 【重要】既存の 'products' インデックスを削除して、完全にまっさらな状態にする
    await esClient.indices.delete({ 
      index: 'products', 
      ignore_unavailable: true // インデックスが存在しなくてもエラーにしない
    });
    
    // 新しいアパレルデータを1件ずつ登録
    for (const product of products) {
      await esClient.index({
        index: 'products',
        id: product.id.toString(),
        document: product,
      });
    }

    return NextResponse.json({ message: "Old data cleared. 5 Apparel products indexed!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}