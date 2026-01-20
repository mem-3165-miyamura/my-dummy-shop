import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  try {
    const scoreFunctions: any[] = [
      {
        filter: { term: { isSale: true } },
        weight: 2
      },
      {
        field_value_factor: {
          field: "priority",
          factor: 1.0,
          missing: 1
        }
      }
    ];

    if (lat && lon) {
      scoreFunctions.push({
        gauss: {
          location: {
            origin: { lat: parseFloat(lat), lon: parseFloat(lon) },
            offset: "2km",
            scale: "10km"
          }
        },
        weight: 3
      });
    }

    // 🟢 検索クエリの構築
    const searchQuery: any = {
      function_score: {
        query: {
          bool: {
            must: query 
              ? [
                  {
                    bool: {
                      should: [
                        { match: { name: { query, boost: 5 } } },
                        { match: { description: { query, boost: 1 } } }
                      ]
                    }
                  }
                ]
              : [{ match_all: {} }],
            
            filter: category 
              ? [{ term: { category: category } }] 
              : []
          }
        },
        functions: scoreFunctions,
        score_mode: "multiply", 
        boost_mode: "multiply"
      }
    };

    // 🟢 Elasticsearch実行 (body プロパティの中に query と aggs を入れる)
    const response = await esClient.search({
      index: 'products',
      body: {
        query: searchQuery,
        aggs: {
          category_counts: {
            terms: { 
              field: "category",
              size: 50 
            } 
          }
        }
      }
    });

    const products = response.hits.hits.map((hit) => ({
      ...(hit._source as object),
      _score: hit._score
    }));
    
    // 🟢 アグリゲーション結果の整形
    const categoryBuckets = (response.aggregations?.category_counts as any)?.buckets || [];
    const formattedCategories = categoryBuckets.map((b: any) => ({
      name: b.key,
      count: b.doc_count
    }));

    // フロントエンドが "categories" だけでなく "aggregations" という名前も期待している可能性があるため両方返します
    return NextResponse.json({ 
      products, 
      categories: formattedCategories,
      aggregations: formattedCategories, 
      debug: {
        total: response.hits.total,
        max_score: response.hits.max_score
      }
    });
  } catch (error) {
    console.error('Elasticsearch Search Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}