// frontend/src/lib/elasticsearch.ts

import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

/**
 * products index を作成する
 * - mapping は必ずここで定義
 * - kuromoji は使わない（standard analyzer）
 * - filter / function_score / geo が壊れない構成
 */
export async function setupElasticsearch() {
  const indexName = "products";

  try {
    const exists = await esClient.indices.exists({ index: indexName });

    if (exists) {
      console.log(`ℹ️ [3000-ES] Index "${indexName}" already exists.`);
      return;
    }

    console.log(`🚀 [3000-ES] Creating index "${indexName}"`);

    await esClient.indices.create({
      index: indexName,
      mappings: {
        properties: {
          /** IDs */
          id: { type: "keyword" },

          /** Searchable text fields */
          name: { type: "text" },
          description: { type: "text" },
          descriptionLong: { type: "text" },
          searchKeywords: { type: "text" },

          /** Filter / Facet fields */
          category: { type: "keyword" },
          brand: { type: "keyword" },
          tags: { type: "keyword" },

          /** Numeric / business fields */
          price: { type: "integer" },
          stock: { type: "integer" },
          priority: { type: "integer" },
          isSale: { type: "boolean" },

          /** Geo search (必須) */
          location: { type: "geo_point" },

          /** Metadata */
          createdAt: { type: "date" },
        },
      },
    });

    console.log("✅ [3000-ES] Index & mapping created successfully.");
  } catch (error) {
    console.error("❌ [3000-ES] Setup failed:", error);
    throw error; // 呼び出し元で検知できるようにする
  }
}
