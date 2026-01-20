import { esClient, setupElasticsearch } from '@/lib/elasticsearch'; // 🆕 setupElasticsearchを追加
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  return process.env.NODE_ENV === 'production' 
    ? "redis://shop-redis:6379" 
    : "redis://localhost:6379";
};

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 1,
});

redis.on("error", (err) => {
  console.warn("⚠️ [3000-Sync] Redis Connection Warning:", err.message);
});

export async function GET() {
  const synced = [];

  try {
    // 1. 🟢 同期の前にインデックスとマッピング(geo_point等)を自動作成
    await setupElasticsearch();

    while (true) {
      const data = await redis.rpop('product-sync-queue');
      if (!data) break;

      const product = JSON.parse(data);

      // 2. 🟢 Elasticsearchへインデックス（全拡張フィールドを網羅）
      await esClient.index({
        index: 'products',
        id: product.id,
        document: {
          id: product.id,
          name: product.name,
          description: product.description,
          descriptionLong: product.descriptionLong,
          price: product.price,
          category: product.category,
          brand: product.brand,
          tags: product.tags,
          imageUrl: product.imageUrl,
          stock: product.stock,
          isSale: product.isSale,
          isPublished: product.isPublished,
          priority: product.priority,
          searchKeywords: product.searchKeywords,
          // 📍 緯度経度をES専用の geo_point 形式に変換
          location: (product.lat && product.lon) 
            ? { lat: Number(product.lat), lon: Number(product.lon) } 
            : null,
          createdAt: product.createdAt
        },
        refresh: true,
      });

      synced.push(product.name);
      console.log(`🚀 [3000] Indexed: ${product.name} (Geo: ${!!product.lat})`);
    }

    return NextResponse.json({ 
      success: true, 
      syncedCount: synced.length,
      syncedList: synced 
    });

  } catch (error) {
    console.error("3000 Sync Error:", error);
    return NextResponse.json({ 
      error: "同期エラーが発生しました",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}