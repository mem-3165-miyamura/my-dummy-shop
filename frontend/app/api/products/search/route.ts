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
  const sort = searchParams.get("sort");
  // 📍 3001番（SaaS）側の解析結果を受け取る
  const priceSensitivity = searchParams.get("price_sensitivity"); 

  try {
    const scoreFunctions: any[] = [
      { filter: { term: { isSale: true } }, weight: 1000 },
      { field_value_factor: { field: "priority", factor: 1.0, missing: 0 } },
    ];

    // 1. カテゴリ好みの反映
    if (preferredCategory) {
      scoreFunctions.push({
        filter: { term: { category: String(preferredCategory) } },
        weight: 10000,
      });
    }

    // 📍 2. SaaS連携：予算感（価格感度）の反映
    // sensitivityが高い（正）＝ 安いもの好き / 低い（負）＝ 高いもの好き
    if (priceSensitivity) {
      const sensitivity = parseFloat(priceSensitivity);
      if (sensitivity > 50) {
        // 【節約家向け】価格が低いほどスコアを加算 (逆数を利用)
        scoreFunctions.push({
          field_value_factor: {
            field: "price",
            factor: 1.0,
            modifier: "reciprocal", 
            missing: 1
          },
          weight: 5000,
        });
      } else if (sensitivity < -50) {
        // 【高級志向向け】価格が高いほどスコアを加算 (対数を利用)
        scoreFunctions.push({
          field_value_factor: {
            field: "price",
            factor: 0.0001,
            modifier: "log1p", 
            missing: 1
          },
          weight: 5000,
        });
      }
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
                filter: [], 
              },
            },
            functions: scoreFunctions,
            score_mode: "sum",
            boost_mode: "sum",
          },
        },
        post_filter: {
          bool: {
            filter: filterClauses
          }
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

    if (sort === "price_asc") {
      esQuery.body.sort = [{ price: { order: "asc" } }, "_score"];
    } else if (sort === "price_desc") {
      esQuery.body.sort = [{ price: { order: "desc" } }, "_score"];
    }

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