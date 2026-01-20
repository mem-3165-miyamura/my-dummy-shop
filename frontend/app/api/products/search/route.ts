import { Client } from "@elastic/elasticsearch";
import { NextResponse } from "next/server";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  // localStorage由来の「推しカテゴリ」
  const preferredCategory = searchParams.get("pref");

  try {
    const scoreFunctions: any[] = [
      // SALEボーナス
      { filter: { term: { isSale: true } }, weight: 1000 },
      // 優先度ボーナス
      { field_value_factor: { field: "priority", factor: 1.0, missing: 0 } },
    ];

    // 推しカテゴリブースト
    if (preferredCategory) {
      scoreFunctions.push({
        filter: { term: { category: String(preferredCategory) } },
        weight: 10000,
      });
    }

    // 選択中カテゴリブースト（これがなかったためスコア変化がなかった）
    if (category) {
      scoreFunctions.push({
        filter: { term: { category: String(category) } },
        weight: 1000,
      });
    }

    // ジオブースト
    if (lat && lon) {
      scoreFunctions.push({
        gauss: {
          location: {
            origin: { lat: parseFloat(lat), lon: parseFloat(lon) },
            offset: "1km",
            scale: "5km",
          },
        },
        weight: 5000,
      });
    }

    const esQuery: any = {
      index: "products",
      body: {
        query: {
          function_score: {
            query: {
              bool: {
                must: query
                  ? [
                      {
                        multi_match: {
                          query,
                          fields: ["name^10", "description", "descriptionLong", "brand", "tags"],
                          fuzziness: "AUTO",
                        },
                      },
                    ]
                  : [{ match_all: {} }],
                // filterはスコアに影響しないため、カテゴリブーストはfunction_score側で対応
                filter: [],
              },
            },
            functions: scoreFunctions,
            score_mode: "sum",
            boost_mode: "sum",
          },
        },
        highlight: {
          fields: {
            name: {},
            description: {},
          },
          pre_tags: ["<b class='text-blue-600 font-bold'>"],
          post_tags: ["</b>"],
        },
        aggs: {
          categories: {
            terms: { field: "category", size: 50 },
          },
        },
      },
    };

    console.log("[ES Query]", JSON.stringify(esQuery, null, 2)); // デバッグ用

    const response = await client.search(esQuery);

    const products = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
      _score: hit._score,
      name: hit.highlight?.name ? hit.highlight.name[0] : hit._source.name,
      description: hit.highlight?.description ? hit.highlight.description[0] : hit._source.description,
    }));

    const categories = (response.aggregations?.categories as any)?.buckets.map((b: any) => ({
      name: b.key,
      count: b.doc_count,
    }));

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Elasticsearch Search Error:", error);
    return NextResponse.json(
      { error: "検索に失敗しました", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
