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
  const preferredCategory = searchParams.get("pref");

  try {
    const scoreFunctions: any[] = [
      { filter: { term: { isSale: true } }, weight: 1000 },
      { field_value_factor: { field: "priority", factor: 1.0, missing: 0 } },
    ];

    if (preferredCategory) {
      scoreFunctions.push({
        filter: { term: { category: String(preferredCategory) } },
        weight: 10000,
      });
    }

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

    // 📍 物理的なフィルタリング条件（post_filter用）
    const filterClauses: any[] = [];
    if (category) {
      if (category === "SALE") {
        filterClauses.push({ term: { isSale: true } });
      } else {
        filterClauses.push({ term: { category: String(category) } });
      }
    }

    const esQuery: any = {
      index: "products",
      body: {
        // 1. 検索ワードによる基本クエリとスコアリング
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
                // 📍 ここではフィルタをかけない（集計対象を減らさないため）
                filter: [], 
              },
            },
            functions: scoreFunctions,
            score_mode: "sum",
            boost_mode: "sum",
          },
        },
        // 📍 2. 【重要】商品の「表示」だけを最後に絞り込む
        // これにより、aggs（集計）には影響を与えず、商品一覧だけが変わります。
        post_filter: {
          bool: {
            filter: filterClauses
          }
        },
        // 3. ハイライト設定
        highlight: {
          fields: {
            name: {},
            description: {},
          },
          pre_tags: ["<b class='text-blue-600 font-bold'>"],
          post_tags: ["</b>"],
        },
        // 4. カテゴリ集計
        // post_filterのおかげで、ここには「絞り込み前」の母数が届きます。
        aggs: {
          categories: {
            terms: { field: "category", size: 50 },
          },
        },
      },
    };

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
      { 
        error: "検索に失敗しました", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}