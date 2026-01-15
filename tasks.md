# 開発タスクリスト

## Phase 1: 環境セットアップ

- [ ] Monorepo 構成の初期化 (npm workspaces / turbo)
- [ ] CDK (TypeScript) の初期化
- [ ] React (Vite + TS) の初期化

## Phase 2: バックエンド開発 (TDD)

- [ ] S3 バケットおよび CORS 設定の定義
- [ ] 署名付き URL 発行 Lambda のテスト & 実装
- [ ] API Gateway (HTTP API) と API Key の設定
- [ ] 動的画像加工プロキシ (CloudFront + Lambda) の実装

## Phase 3: フロントエンド開発 (TDD)

- [ ] 画像圧縮ユーティリティのテスト & 実装
- [ ] クロップ機能コンポーネントのテスト & 実装
- [ ] S3 への PUT アップロードロジックの実装
- [ ] 汎用 `S3Uploader` コンポーネントの UI ブラッシュアップ

## Phase 4: 統合・ドキュメント

- [ ] ローカル環境でのエンドツーエンド動作確認
- [ ] 導入ガイド (README) の作成
