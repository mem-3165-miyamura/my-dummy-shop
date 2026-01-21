# 🛒 Demo EC Store (Client Site)

マーケティングツールの動作を検証・シミュレーションするためのデモ用ECサイトです。Elasticsearchによる高度な検索機能と、ブラウザ履歴を活用したリアルタイムなパーソナライズ機能を備えています。

## 🎯 役割
- **スニペットの実行**: 3001番サーバーから配信される計測タグ（`api/v1/snippet`）の読み込みと実行。
- **動的ポップアップ**: 配信条件（閲覧履歴、滞在時間等）にマッチした際の要素注入と表示。
- **高速商品検索**: Elasticsearchを使用した、ミリ秒単位の高度な検索・集計体験の提供。
- **イベント送信**: `Tracker.tsx` による行動データ送信、および `localStorage` を活用した自律型パーソナライズ。

## 🔍 検索・パーソナライズ仕様 (Elasticsearch)



- **リアルタイム検索**: デバウンス処理（500ms）による負荷軽減と、`dangerouslySetInnerHTML` を活用した検索ヒット箇所の**青色ハイライト表示**。
- **自律型パーソナライズ**: ユーザーのカテゴリ閲覧/クリック履歴を `localStorage` で管理。検索時に「推しカテゴリ」を `pref` パラメータとしてAPIに送信。
- **高度なスコアリング (`function_score`)**: 
    - **パーソナライズ・ブースト**: ユーザーの「推しカテゴリ」に合致する商品を最優先（+10,000点）。
    - **SALEブースト**: セール対象商品（`isSale: true`）への加算（+1,000点）。
    - **優先度調整**: 管理画面で設定された `priority` 値の重み付け加算。
- **動的ファセット (post_filter)**: 
    - `post_filter` を使用することで、特定カテゴリで絞り込んだ後も、サイドバーには「他のカテゴリに何件あるか」の母数を維持し続ける高度なUIを実現。

## 🔌 マーケティングツールとの連携
共通レイアウト（`layout.tsx`）にて `Tracker` コンポーネントを介し、以下の連携を行っています。

1. **スクリプト自動読み込み**: 
   `<script src="http://localhost:3001/api/v1/snippet"></script>`
2. **行動トラッキング**:
   `POST http://localhost:3001/api/v1/track` へページ遷移やクリックイベントを送信し、SaaS側のセグメント分析に活用。

## 🚀 起動方法
1. **インフラ起動**: `docker-compose up -d` (Elasticsearch / Kibana / Redis)
   - Elasticsearchは `Xmx512m` に制限し、ローカル環境のメモリ消費を最適化済み。
2. **依存関係のインストール**: `npm install`
3. **データセットアップ**: 
   - `GET /api/setup` を実行し、テストデータの投入とマッピングの初期化。
4. **開発サーバーの起動**: `npm run dev` (Port: 3000)

---
*Next.js Marketing SaaS Project - Frontend Demo Site*