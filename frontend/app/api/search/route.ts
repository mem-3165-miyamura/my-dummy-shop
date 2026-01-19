import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  try {
    const searchQuery: any = {
      function_score: {
        // 1. ベースとなる検索（キーワードの適合度）
        query: {
          bool: {
            must: query 
              ? [
                  {
                    bool: {
                      should: [
                        { match: { name: { query, boost: 5 } } },
                        { match: { description: { query, boost: 1 } } },
                        { wildcard: { name: `*${query}*` } }
                      ]
                    }
                  }
                ]
              : [{ match_all: {} }],
            
            filter: category 
              ? [{ term: { "category.keyword": category } }] 
              : []
          }
        },
        // 2. ビジネスロジック：フラグや数値によるスコア調整
        functions: [
          {
            // 🟢 カテゴリ名だけでなく、isSaleフラグ(boolean)がtrueなら2倍
            filter: { term: { isSale: true } },
            weight: 2
          },
          {
            // 🟢 priorityフィールドの値を直接スコアに反映（missing: 1 で未設定時をカバー）
            field_value_factor: {
              field: "priority",
              factor: 1.0,
              missing: 1
            }
          },
          {
            // 価格が高いものを少しだけ優遇
            field_value_factor: {
              field: "price",
              factor: 0.0001,
              modifier: "log1p",
              missing: 1
            }
          }
        ],
        score_mode: "multiply", 
        boost_mode: "multiply"
      }
    };

    const response = await esClient.search({
      index: 'products',
      query: searchQuery,
      aggs: {
        category_counts: {
          terms: { field: "category.keyword" } 
        }
      }
    });

    const products = response.hits.hits.map((hit) => ({
      ...(hit._source as object),
      _score: hit._score
    }));
    
    const aggregations = response.aggregations?.category_counts;

    return NextResponse.json({ 
      products, 
      aggregations,
      debug: {
        total: response.hits.total,
        max_score: response.hits.max_score
      }
    });
  } catch (error) {
    console.error('Elasticsearch Search Error:', error);
    // エラー時は500を返し、詳細を文字列化して返す
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}