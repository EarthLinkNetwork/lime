# テスト設計書 & 受入れ条件

## 1. テスト方針

- 全ての機能は TDD サイクル（Red -> Green -> Refactor）で開発する。
- Backend: `Jest` を使用し、Lambda 単体テストおよび CDK の細粒度アサーションを実施。
- Fronte

# テスト設計書 & 受入れ条件

## 1. テスト方針

- 全ての機能は TDD サイクル（Red -> Green -> Refactor）で開発する。
- Backend: `Jest` を使用し、Lambda 単体テストおよび CDK の細粒度アサーションを実施。
- Frontend: `Vitest` + `React Testing Library` を使用。

## 2. 受入れ条件 (Acceptance Criteria)

- [ ] API に対し、有効な API Key がないリクエストは `403 Forbidden` を返すこと。
- [ ] Lambda は、S3 の `putObject` 権限を持つ署名付き URL を正常に発行すること。
- [ ] フロントエンドで 5MB 以上の画像を選択した際、設定された閾値（例: 2MB）以下に圧縮されること。
- [ ] クロップ UI で指定した範囲のみが、最終的な S3 上のファイルとして反映されること。
- [ ] CloudFront 経由で `?w=100` を付与してアクセスした際、元画像ではなくリサイズ画像が返ること。nd: `Vitest` + `React Testing Library` を使用。

## 2. 受入れ条件 (Acceptance Criteria)

- [ ] API に対し、有効な API Key がないリクエストは `403 Forbidden` を返すこと。
- [ ] Lambda は、S3 の `putObject` 権限を持つ署名付き URL を正常に発行すること。
- [ ] フロントエンドで 5MB 以上の画像を選択した際、設定された閾値（例: 2MB）以下に圧縮されること。
- [ ] クロップ UI で指定した範囲のみが、最終的な S3 上のファイルとして反映されること。
- [ ] CloudFront 経由で `?w=100` を付与してアクセスした際、元画像ではなくリサイズ画像が返ること。
