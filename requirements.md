# プロジェクト仕様書: S3 Upload Utility (UTT)

## 1. 目的

あらゆるプロジェクトで即座に導入可能な、汎用的なファイルアップロード基盤の提供。

## 2. システム構成

- **Frontend**: React コンポーネント (npm ライブラリ形式)
- **Backend**: AWS CDK によるサーバーレスインフラ

## 3. 機能要件

### フロントエンド

- **画像圧縮 (Reduce)**: アップロード前にブラウザ側で指定サイズ以下にリサイズ。
- **クロップ (Crop)**: UI 上での自由な切り抜き機能。
- **署名付き URL アップロード**: Lambda から発行された URL を用いて S3 へ直接 PUT。
- **ステータス管理**: プログレスバー、成功・失敗のコールバック。

### バックエンド

- **署名付き URL 発行**: API Gateway (HTTP API) + Lambda。
- **API Key 認証**: 簡易的な認可プロトコル。
- **動的画像処理**:
  - CloudFront + Lambda@Edge/Function を利用。
  - クエリパラメータ（`?w=300&h=300&r=10` 等）によるリサイズ、角丸加工。
- **S3 ストレージ**: CORS 設定済みバケット。

## 4. 非機能要件

- **TDD (Test Driven Development)**: 全ロジックに対してテストコードを先行実装する。
- **低コスト**: API Gateway REST ではなく HTTP API を使用し、CloudFront キャッシュを最大活用する。
