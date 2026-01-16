import { esClient } from '@/lib/elasticsearch';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  try {
    const response = await esClient.search({
      index: 'products',
      // 🟢 queryがある場合、部分一致（wildcard）で検索するように変更
      query: query 
        ? {
            bool: {
              should: [
                { wildcard: { name: `*${query}*` } },        // 名前の一部に含まれる
                { wildcard: { description: `*${query}*` } }, // 説明の一部に含まれる
                { match: { name: { query, boost: 2 } } }      // 完全一致に近いものはスコアを高く
              ]
            }
          }
        : { match_all: {} },
      
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
        took: response.took,
        max_score: response.hits.max_score,
        total_hits: response.hits.total
      }
    });
  } catch (error) {
    console.error('Elasticsearch Search Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}