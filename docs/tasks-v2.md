# Lime v2 タスク管理

## ゴール

Lime を複数プロジェクトから利用可能な汎用ファイル管理基盤にする。
全タスクを TDD で実施し、テスト → 実装 → テスト通過 の順で進める。

---

## タスク一覧

### Task 1: S3 キー構造の変更（Backend Lambda）

**状態**: [x] 完了

**内容**:
- presigned-url Lambda の `RequestBody` に `projectCode`（必須）, `ownerKey`（必須）を追加
- キー生成ロジックを `{projectCode}/{ownerKey}/{folder}/{UUID}.{ext}` に変更
- `projectCode`, `ownerKey` が未指定の場合は 400 エラーを返す

**受け入れ条件**:
- [ ] テスト: `projectCode` 未指定で 400 が返る
- [ ] テスト: `ownerKey` 未指定で 400 が返る
- [ ] テスト: 正常リクエストで `{projectCode}/{ownerKey}/{folder}/{UUID}.{ext}` 形式のキーが生成される
- [ ] テスト: `folder` 未指定時はデフォルト `uploads` が使われる
- [ ] テスト: カスタム `folder` 指定時にそのフォルダが使われる
- [ ] 既存テストが全て通る（修正が必要なものは修正する）
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] presigned-url.test.ts 全テスト PASS

---

### Task 2: S3 Object Tagging 対応（Backend Lambda）

**状態**: [x] 完了

**内容**:
- presigned-url Lambda の `RequestBody` に `tags`（任意）を追加
- `PutObjectCommand` に `Tagging` パラメータを追加
- タグは URL エンコードされた key=value&key=value 形式で渡す

**受け入れ条件**:
- [ ] テスト: `tags` 未指定でもアップロードが成功する
- [ ] テスト: `tags` 指定時に PutObjectCommand の Tagging パラメータにタグが含まれる
- [ ] テスト: 複数タグが正しくエンコードされる
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] presigned-url.test.ts 全テスト PASS

---

### Task 3: 削除 API（Backend Lambda + CDK）

**状態**: [x] 完了

**内容**:
- 新規 Lambda `lambda/delete-object/index.ts` を作成
- API Key 検証（presigned-url と同じ仕組み）
- S3 `DeleteObjectCommand` を実行
- キーに最低2階層（`projectCode/ownerKey/...`）が含まれることを検証
- CDK スタックに Lambda, ルート, 権限を追加

**受け入れ条件**:
- [ ] テスト: API Key なしで 403 が返る
- [ ] テスト: API Key が無効で 403 が返る
- [ ] テスト: key 未指定で 400 が返る
- [ ] テスト: key が不正な形式（階層不足）で 400 が返る
- [ ] テスト: 正常リクエストで DeleteObjectCommand が呼ばれ 200 が返る
- [ ] CDK テスト: delete-object Lambda が作成される
- [ ] CDK テスト: DELETE /objects ルートが存在する
- [ ] CDK テスト: Lambda に s3:DeleteObject 権限がある
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] delete-object.test.ts 全テスト PASS
- [ ] s3-upload-stack.test.ts 全テスト PASS

---

### Task 4: 一覧取得 API（Backend Lambda + CDK）

**状態**: [x] 完了

**内容**:
- 新規 Lambda `lambda/list-objects/index.ts` を作成
- API Key 検証
- S3 `ListObjectsV2Command` で Prefix フィルタ
- ページネーション対応（ContinuationToken）
- `includeTags=true` 時に各オブジェクトの tags を取得
- CDK スタックに Lambda, ルート, 権限を追加

**受け入れ条件**:
- [ ] テスト: API Key なしで 403 が返る
- [ ] テスト: projectCode 未指定で 400 が返る
- [ ] テスト: 正常リクエストで ListObjectsV2Command が projectCode prefix で呼ばれる
- [ ] テスト: ownerKey 指定で prefix が `{projectCode}/{ownerKey}/` になる
- [ ] テスト: folder 指定で prefix が `{projectCode}/{ownerKey}/{folder}/` になる
- [ ] テスト: limit パラメータが MaxKeys に渡される
- [ ] テスト: cursor パラメータが ContinuationToken に渡される
- [ ] テスト: レスポンスに objects 配列と nextCursor が含まれる
- [ ] テスト: includeTags=true 時にタグが取得される
- [ ] CDK テスト: list-objects Lambda が作成される
- [ ] CDK テスト: GET /objects ルートが存在する
- [ ] CDK テスト: Lambda に s3:GetObject, s3:ListBucket 権限がある
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] list-objects.test.ts 全テスト PASS
- [ ] s3-upload-stack.test.ts 全テスト PASS

---

### Task 5: S3 ライフサイクルルール（CDK）

**状態**: [x] 完了

**内容**:
- S3 バケットにライフサイクルルールを追加
- `_tmp/` プレフィックスのオブジェクトは 1 日で自動削除

**受け入れ条件**:
- [ ] CDK テスト: ライフサイクルルールが設定されている
- [ ] CDK テスト: `_tmp/` プレフィックスに 1 日の有効期限が設定されている
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] s3-upload-stack.test.ts 全テスト PASS

---

### Task 6: CORS 更新（CDK）

**状態**: [x] 完了

**内容**:
- HTTP API の CORS に DELETE, GET メソッドを追加
- S3 バケットの CORS に DELETE メソッドを追加

**受け入れ条件**:
- [ ] CDK テスト: HTTP API の CORS に DELETE, GET が含まれる
- [ ] `npm test --workspace=packages/backend` が全て PASS

**テスト確認**:
- [ ] s3-upload-stack.test.ts 全テスト PASS

---

### Task 7: フロントエンド Props 変更 + presigned-url 連携

**状態**: [x] 完了

**内容**:
- `S3UploaderProps` に `projectCode`（必須）, `ownerKey`（必須）, `folder`（任意）, `tags`（任意）を追加
- `getPresignedUrl` の body に新パラメータを含める
- 既存テストを新 Props に合わせて修正

**受け入れ条件**:
- [ ] テスト: `projectCode`, `ownerKey` が presigned-url リクエストに含まれる
- [ ] テスト: `folder` 指定時にリクエストに含まれる
- [ ] テスト: `tags` 指定時にリクエストに含まれる
- [ ] テスト: `projectCode`, `ownerKey` 未指定でコンパイルエラーになる（型チェック）
- [ ] 既存テスト全て PASS（修正後）
- [ ] `npm test --workspace=packages/frontend` が全て PASS

**テスト確認**:
- [ ] S3Uploader.test.tsx 全テスト PASS

---

### Task 8: Drag & Drop 対応（Frontend）

**状態**: [x] 完了

**内容**:
- S3Uploader にドロップゾーンを追加
- `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` イベントハンドラ
- ドラッグ中の視覚的フィードバック（CSS クラス）
- `enableDragDrop` prop（デフォルト: true）
- ドロップされたファイルを既存のバリデーション・処理ロジックで処理

**受け入れ条件**:
- [ ] テスト: ドロップゾーンが表示される
- [ ] テスト: ファイルをドロップするとファイルが選択される
- [ ] テスト: ドラッグ中に視覚的フィードバックが表示される（CSS クラス付与）
- [ ] テスト: `enableDragDrop=false` でドロップゾーンが表示されない
- [ ] テスト: 不正なファイルタイプのドロップでエラーが表示される
- [ ] テスト: ファイルサイズ超過のドロップでエラーが表示される
- [ ] `npm test --workspace=packages/frontend` が全て PASS

**テスト確認**:
- [ ] S3Uploader.test.tsx 全テスト PASS

---

### Task 9: フロントエンド API クライアント（削除・一覧）

**状態**: [x] 完了

**内容**:
- `utils/api.ts` に `deleteObject`, `listObjects` 関数を作成
- 型定義を `types.ts` に追加
- `index.ts` からエクスポート

**受け入れ条件**:
- [ ] テスト: `deleteObject` が正しい endpoint, method, headers, body でリクエストする
- [ ] テスト: `deleteObject` がエラー時に例外を投げる
- [ ] テスト: `listObjects` が正しい endpoint, query params, headers でリクエストする
- [ ] テスト: `listObjects` のレスポンスが正しい型で返る
- [ ] テスト: `listObjects` がエラー時に例外を投げる
- [ ] `index.ts` から `deleteObject`, `listObjects` がエクスポートされている
- [ ] `npm test --workspace=packages/frontend` が全て PASS

**テスト確認**:
- [ ] api.test.ts 全テスト PASS

---

### Task 10: 全体統合テスト・ビルド確認

**状態**: [x] 完了

**内容**:
- 全テスト通過確認
- ビルド成功確認
- README 更新

**受け入れ条件**:
- [ ] `npm test` (root) が全て PASS
- [ ] `npm run build` (root) が成功
- [ ] README.md に v2 の新機能（キー構造, 削除, 一覧, Drag & Drop, タグ）が記載されている
- [ ] docs/usage-example.tsx に新機能の使用例が追加されている

**テスト確認**:
- [ ] Backend: 全テスト PASS
- [ ] Frontend: 全テスト PASS
- [ ] Build: 全パッケージ成功

---

## 実施順序

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10
```

Task 1-6 は Backend、Task 7-9 は Frontend、Task 10 は統合。
各タスクは TDD: テスト作成 → テスト失敗確認 → 実装 → テスト通過 の順で進める。

---

## 進捗ログ

| 日時 | タスク | 状態 | 備考 |
|------|--------|------|------|
| (開始前) | - | - | 仕様書・タスク管理ファイル作成完了 |
| 実装中 | Task 1 | 完了 | presigned-url Lambda: projectCode/ownerKey 追加, 17/17 PASS |
| 実装中 | Task 2 | 完了 | presigned-url Lambda: tags 対応追加（Task 1 と同時実施）, 17/17 PASS |
| 実装中 | Task 3 | 完了 | delete-object Lambda 新規作成, 6/6 PASS. CDK: Lambda + ルート + 権限追加 |
| 実装中 | Task 4 | 完了 | list-objects Lambda 新規作成, 10/10 PASS. CDK: Lambda + ルート + 権限追加 |
| 実装中 | Task 5 | 完了 | S3 ライフサイクルルール追加 (_tmp/ 1日), CDK テスト PASS |
| 実装中 | Task 6 | 完了 | HTTP API CORS に DELETE/GET 追加, CDK テスト PASS |
| 実装中 | - | 確認 | Backend 全体: 5 suites, 64 tests, 全て PASS |
| 実装中 | Task 7 | 完了 | S3UploaderProps に projectCode/ownerKey/folder/tags 追加, 既存テスト修正 |
| 実装中 | Task 8 | 完了 | Drag & Drop 実装 (enableDragDrop prop, drop zone, drag feedback), 6 新テスト PASS |
| 実装中 | Task 9 | 完了 | deleteObject/listObjects API クライアント作成, 7 新テスト PASS |
| 実装中 | Task 10 | 完了 | 全テスト PASS (Backend 64, Frontend 53), ビルド成功, README/docs 更新 |
