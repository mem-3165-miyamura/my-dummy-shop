import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  try {
    const response = await esClient.search({
      index: 'products',
      query: query 
        ? { 
            multi_match: { 
              query, 
              fields: ['name', 'description'],
              fuzziness: "AUTO",
              operator: "and" 
            } 
          } 
        : { match_all: {} },
      
      aggs: {
        category_counts: {
          terms: { field: "category.keyword" } 
        }
      }
    });

    // ポイント：商品データに「スコア」を合体させて返します
    const products = response.hits.hits.map((hit) => ({
      ...(hit._source as object),
      _score: hit._score // Elasticsearchが算出した「近さ」の点数
    }));
    
    const aggregations = response.aggregations?.category_counts;

    // フロントエンドのデバッグパネル用に、検索にかかった時間等も返します
    return NextResponse.json({ 
      products, 
      aggregations,
      debug: {
        took: response.took,           // Elasticsearch内での処理ミリ秒
        max_score: response.hits.max_score,
        total_hits: response.hits.total
      }
    });
  } catch (error) {
    console.error('Elasticsearch Search Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}