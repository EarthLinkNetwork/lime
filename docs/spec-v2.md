# Lime v2 仕様書

## 変更概要

Lime v1 はアップロードと画像リサイズのみの最小構成だった。
v2 では以下を追加し、複数プロジェクトから利用可能な汎用ファイル管理基盤にする。

---

## 1. S3 キー構造の変更

### v1 (現状)

```
{folder}/{UUID}.{ext}
例: uploads/550e8400.jpg
```

- フラット構造。プロジェクト分離なし。

### v2 (変更後)

```
{projectCode}/{ownerKey}/{folder}/{UUID}.{ext}
```

| 階層 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| `projectCode` | Yes | なし | プロジェクト識別子。利用側が指定。 |
| `ownerKey` | Yes | なし | データ分離キー。userId, teamId, tenantId 等、利用側が自由に決める。 |
| `folder` | No | `uploads` | 論理分類。利用側がサブフォルダとして自由に使う。 |

```
例:
  berry/user-123/avatars/550e8400.jpg
  berry/team-abc/documents/6ba7b810.pdf
  sakura/tenant-1/uploads/f47ac10b.webp
```

### 破壊的変更

- presigned-url Lambda の `RequestBody` に `projectCode`, `ownerKey` を追加（必須）
- `folder` のデフォルト値は `uploads` のまま維持
- フロントエンド `S3UploaderProps` に `projectCode`, `ownerKey` を追加（必須）

---

## 2. S3 Object Tagging

アップロード時に S3 オブジェクトタグを付与可能にする。

### API

presigned-url Lambda の `RequestBody` に `tags` フィールドを追加:

```typescript
interface RequestBody {
  fileName: string;
  contentType: string;
  projectCode: string;    // 新規・必須
  ownerKey: string;        // 新規・必須
  folder?: string;         // 既存・任意（デフォルト: 'uploads'）
  tags?: Record<string, string>;  // 新規・任意
}
```

タグは PutObjectCommand の `Tagging` パラメータで設定する。

```
例:
  tags: { category: "avatar", status: "active", favorite: "true" }
```

### フロントエンド

`S3UploaderProps` に `tags` を追加:

```typescript
tags?: Record<string, string>;
```

---

## 3. 削除 API

### エンドポイント

```
DELETE /objects
  Headers: X-Api-Key: ...
  Body: { "key": "berry/user-123/avatars/550e8400.jpg" }
  Response: 200 { "deleted": true, "key": "..." }
```

### Lambda: delete-object

- S3 `DeleteObjectCommand` を実行
- API Key 検証（presigned-url と同じ仕組み）
- キーに `projectCode` が含まれていることを検証（空パスでの誤削除防止）

### CDK 変更

- 新規 Lambda `delete-object/index.ts` を作成
- S3 バケットに `grantDelete` を付与
- HTTP API に `DELETE /objects` ルートを追加

---

## 4. 一覧取得 API

### エンドポイント

```
GET /objects?projectCode=berry&ownerKey=user-123&folder=avatars&limit=50&cursor=xxx
  Headers: X-Api-Key: ...
  Response: 200 {
    "objects": [
      {
        "key": "berry/user-123/avatars/550e8400.jpg",
        "size": 12345,
        "lastModified": "2025-01-01T00:00:00Z",
        "url": "https://d1xxx.cloudfront.net/berry/user-123/avatars/550e8400.jpg",
        "tags": { "category": "avatar" }
      }
    ],
    "nextCursor": "..." | null
  }
```

### Lambda: list-objects

- S3 `ListObjectsV2Command` を使用
- `Prefix` で `{projectCode}/{ownerKey}/{folder}` を指定してフィルタ
- `projectCode` 必須、`ownerKey` 任意、`folder` 任意
- ページネーション: `ContinuationToken` ベース
- 各オブジェクトの tags を `GetObjectTaggingCommand` で取得（オプション: `includeTags=true`）

### CDK 変更

- 新規 Lambda `list-objects/index.ts` を作成
- S3 バケットに `grantRead` を付与（既に image-resize に付与済みのパターンを踏襲）
- HTTP API に `GET /objects` ルートを追加

---

## 5. Drag & Drop 対応

### 現状

- `<input type="file">` のみ。Drag & Drop 未実装。

### 変更

S3Uploader コンポーネントにドロップゾーンを追加:

- `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` イベントハンドラ
- ドラッグ中の視覚的フィードバック（CSS クラス `s3-uploader--drag-over`）
- ドロップされたファイルを既存の `handleFileSelect` ロジックで処理
- 複数ファイルドロップ時は最初のファイルのみ処理（現状の単一ファイルアップロードを維持）

### Props 追加

```typescript
enableDragDrop?: boolean;  // デフォルト: true
```

---

## 6. S3 ライフサイクルルール

### CDK 変更

S3 バケットにライフサイクルルールを追加:

```typescript
lifecycleRules: [
  {
    prefix: '_tmp/',
    expiration: cdk.Duration.days(1),
  },
]
```

- `_tmp/` プレフィックスのオブジェクトは 24 時間で自動削除
- 一時ファイル用途（プレビュー、下書き等）に利用可能

---

## 7. API 変更まとめ

### エンドポイント一覧（v2）

| Method | Path | 説明 | 状態 |
|--------|------|------|------|
| POST | `/presigned-url` | アップロード URL 生成 | 変更（パラメータ追加） |
| DELETE | `/objects` | オブジェクト削除 | 新規 |
| GET | `/objects` | オブジェクト一覧取得 | 新規 |

### CORS 変更

HTTP API の CORS に `DELETE`, `GET` メソッドを追加。

---

## 8. フロントエンド Props 変更まとめ

### S3UploaderProps (v2)

```typescript
export interface S3UploaderProps {
  // 既存（変更なし）
  apiEndpoint: string;
  apiKey: string;
  cloudfrontDomain?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  enableCrop?: boolean;
  enableCompression?: boolean;
  compressionOptions?: CompressionOptions;

  // 新規
  projectCode: string;              // 必須
  ownerKey: string;                  // 必須
  folder?: string;                   // 任意（デフォルト: 'uploads'）
  tags?: Record<string, string>;     // 任意
  enableDragDrop?: boolean;          // 任意（デフォルト: true）
}
```

### 新規エクスポート

```typescript
// API クライアント関数（コンポーネント外からも利用可能に）
export { deleteObject } from './utils/api';
export { listObjects } from './utils/api';
export type { DeleteObjectResponse, ListObjectsResponse, ObjectInfo } from './types';
```
