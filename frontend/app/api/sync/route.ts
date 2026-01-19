import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

/**
 * 🟢 Redis接続の動的切り替え
 */
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
    while (true) {
      const data = await redis.rpop('product-sync-queue');
      
      if (!data) break;

      const product = JSON.parse(data);

      // 🟢 Elasticsearchへ反映
      await esClient.index({
        index: 'products',
        id: product.id, // ES上の管理ID
        document: {
          id: product.id, // 👈 修正ポイント: ドキュメント内部にも id を保持させる（Reactのkey用）
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          imageUrl: product.imageUrl,
          isSale: product.isSale,
          priority: product.priority
        },
        refresh: true,
      });

      synced.push(product.name);
      console.log(`🚀 [3000] Synced from Redis: ${product.name}`);
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