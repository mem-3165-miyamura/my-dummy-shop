# 🛒 Demo EC Store (Client Site)

マーケティングツールの動作を検証・シミュレーションするためのデモ用ECサイトです。Elasticsearchによる高度な検索機能と、リアルタイムなパーソナライズ機能を備えています。

## 🎯 役割
- **スニペットの実行**: 3001番サーバーから配信される計測タグ（`api/v1/snippet`）の読み込み。
- **ポップアップのレンダリング**: 配信条件にマッチした際の動的な要素注入と表示。
- **高速商品検索**: Elasticsearchを使用した、高度な検索体験の提供。
- **イベント送信**: `Tracker.tsx` による行動データ送信、および `localStorage` を活用した自律型パーソナライズ。

## 🔍 検索・パーソナライズ仕様 (Elasticsearch)
- **リアルタイム検索**: デバウンス処理と `dangerouslySetInnerHTML` による検索ヒット箇所の**青色ハイライト表示**。
- **自律型パーソナライズ**: ユーザーのカテゴリ閲覧履歴を `localStorage` で管理し、検索クエリに `pref` パラメータとして付与。
- **高度なスコアリング (function_score)**: 
    - **パーソナライズ・ブースト**: ユーザーの「推しカテゴリ」に合致する商品を最優先（+10,000点）。
    - **SALEブースト**: セール対象商品への加算（+1,000点）。
    - **Geo Location**: 緯度経度ベースの距離減衰（ガウス関数）による地域最適化。
    - **優先度調整**: 管理画面で設定された `priority` 値の加算。
- **動的ファセット**: カテゴリ別件数のリアルタイム集計。

## 🔌 マーケティングツールとの連携
共通レイアウト（`layout.tsx`）にて `Tracker` コンポーネントを介し、以下の連携を行っています。

1. **スクリプト読み込み**: 
   `<script src="http://localhost:3001/api/v1/snippet"></script>`
2. **行動トラッキング**:
   `POST http://localhost:3001/api/v1/track` へページ遷移やクリックイベントを送信。

## 🚀 起動方法
1. **インフラ起動**: `docker-compose up -d` (Elasticsearch / Redis)
2. **依存関係のインストール**: `npm install`
3. **開発サーバーの起動**: `npm run dev` (Port: 3000)

---
*Next.js Marketing SaaS Project - Frontend Demo Site*