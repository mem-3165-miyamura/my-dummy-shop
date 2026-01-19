import { esClient } from "@/lib/elasticsearch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const product = await req.json();

    // 1. バリデーション（最低限IDと名前があるかチェック）
    if (!product.id || !product.name) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // 2. Elasticsearchのデータを更新（または新規作成）
    // .index() は、指定したIDがすでにあれば上書き、なければ新規作成します
    const result = await esClient.index({
      index: "products",
      id: product.id.toString(), // IDを文字列で指定
      document: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl, // S3のURLなどがあれば
        updatedAt: new Date(),
      },
    });

    console.log(`Elasticsearch updated: ${product.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "Reindex successful",
      result: result.result // 'created' または 'updated' が返ります
    });

  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}