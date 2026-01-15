/**
 * S3 Upload Utility - Usage Example
 *
 * このファイルは、他のプロジェクトでS3 Upload Utilityを使用する際の
 * 最小限の実装例を示しています。
 *
 * インストール方法:
 * ```bash
 * npm install @s3-upload-utility/frontend
 * ```
 *
 * または、このmonorepoからビルドした dist/ を使用:
 * ```bash
 * cd packages/frontend && npm run build
 * ```
 */

import React, { useState } from 'react';

// ビルド後のパッケージからインポート
import {
  S3Uploader,
  ImageCropper,
  compressImage,
} from '@s3-upload-utility/frontend';

// 型定義もエクスポートされています
import type {
  S3UploaderProps,
  CompressionOptions,
} from '@s3-upload-utility/frontend';

/**
 * 基本的な使用例 - S3Uploaderコンポーネント
 */
export function BasicUploadExample() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  return (
    <div>
      <h2>File Upload</h2>

      <S3Uploader
        // 必須: API エンドポイント（CDKデプロイ後に取得）
        apiEndpoint="https://your-api-id.execute-api.ap-northeast-1.amazonaws.com"
        // 必須: API Key
        apiKey="your-api-key"
        // オプション: アップロード完了時のコールバック
        onUploadComplete={(url) => {
          console.log('Uploaded:', url);
          setUploadedUrl(url);
        }}
        // オプション: エラー時のコールバック
        onUploadError={(error) => {
          console.error('Upload failed:', error);
        }}
        // オプション: 進捗コールバック (0-100)
        onProgress={(progress) => {
          console.log(`Progress: ${progress}%`);
        }}
        // オプション: 圧縮を有効化（デフォルト: true）
        enableCompression={true}
        // オプション: 圧縮オプション
        compressionOptions={{
          maxSizeMB: 2,          // 最大ファイルサイズ (MB)
          maxWidthOrHeight: 1920, // 最大幅/高さ (px)
          useWebWorker: true,    // Web Worker使用
        }}
        // オプション: クロップを有効化（デフォルト: false）
        enableCrop={false}
        // オプション: 最大ファイルサイズ (MB)
        maxFileSizeMB={10}
        // オプション: 許可するファイルタイプ
        allowedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
      />

      {uploadedUrl && (
        <div>
          <p>Uploaded successfully!</p>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: 300 }} />
        </div>
      )}
    </div>
  );
}

/**
 * クロップ機能付きの使用例
 */
export function CropEnabledExample() {
  return (
    <S3Uploader
      apiEndpoint="https://your-api-id.execute-api.ap-northeast-1.amazonaws.com"
      apiKey="your-api-key"
      // クロップを有効化
      enableCrop={true}
      onUploadComplete={(url) => {
        console.log('Cropped and uploaded:', url);
      }}
    />
  );
}

/**
 * ImageCropperを単体で使用する例
 */
export function StandaloneCropperExample() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <h2>Standalone Cropper</h2>

      <input type="file" accept="image/*" onChange={handleFileSelect} />

      {imageSrc && (
        <ImageCropper
          src={imageSrc}
          // オプション: アスペクト比を固定 (例: 16:9)
          aspectRatio={16 / 9}
          // クロップ完了時のコールバック
          onCropComplete={(blob) => {
            setCroppedBlob(blob);
            console.log('Cropped:', blob);
          }}
          // キャンセル時のコールバック
          onCancel={() => {
            setImageSrc(null);
          }}
        />
      )}

      {croppedBlob && (
        <div>
          <p>Cropped image ready!</p>
          <img
            src={URL.createObjectURL(croppedBlob)}
            alt="Cropped"
            style={{ maxWidth: 300 }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 画像圧縮ユーティリティを単体で使用する例
 */
export function CompressionUtilityExample() {
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);

    // 圧縮オプション
    const options: CompressionOptions = {
      maxSizeMB: 1,           // 1MB以下に圧縮
      maxWidthOrHeight: 1280,  // 最大1280px
      useWebWorker: true,
    };

    try {
      const compressedFile = await compressImage(file, options);
      setCompressedSize(compressedFile.size);
      console.log('Compression complete:', {
        original: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
        ratio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction`,
      });
    } catch (error) {
      console.error('Compression failed:', error);
    }
  };

  return (
    <div>
      <h2>Image Compression Utility</h2>

      <input type="file" accept="image/*" onChange={handleFileSelect} />

      {originalSize > 0 && (
        <div>
          <p>Original: {(originalSize / 1024 / 1024).toFixed(2)} MB</p>
          <p>Compressed: {(compressedSize / 1024 / 1024).toFixed(2)} MB</p>
          <p>
            Reduction: {((1 - compressedSize / originalSize) * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * CloudFront経由の画像表示例（動的リサイズ）
 */
export function CloudFrontImageExample() {
  // CloudFront ドメイン（CDKデプロイ後に取得）
  const cloudFrontDomain = 'd1hwvl0nfb5wlx.cloudfront.net';
  const imageKey = 'uploads/sample.jpg';

  return (
    <div>
      <h2>Dynamic Image Resizing via CloudFront</h2>

      {/* オリジナル画像 */}
      <div>
        <h3>Original</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}`}
          alt="Original"
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* リサイズ: 幅100px */}
      <div>
        <h3>Resized (w=100)</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}?w=100`}
          alt="Width 100"
        />
      </div>

      {/* リサイズ + 品質指定 */}
      <div>
        <h3>Resized with Quality (w=200&q=80)</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}?w=200&q=80`}
          alt="Width 200, Quality 80"
        />
      </div>

      {/* 角丸 */}
      <div>
        <h3>Rounded Corners (w=150&r=20)</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}?w=150&r=20`}
          alt="Rounded"
        />
      </div>

      {/* フォーマット指定 */}
      <div>
        <h3>Format Conversion (w=200&f=webp)</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}?w=200&f=webp`}
          alt="WebP format"
        />
      </div>

      {/* 複合指定 */}
      <div>
        <h3>Combined (w=180&h=180&r=10&q=90&f=png)</h3>
        <img
          src={`https://${cloudFrontDomain}/${imageKey}?w=180&h=180&r=10&q=90&f=png`}
          alt="Combined options"
        />
      </div>
    </div>
  );
}

/**
 * メインAppコンポーネント
 */
export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>S3 Upload Utility - Usage Examples</h1>

      <hr />
      <BasicUploadExample />

      <hr />
      <CropEnabledExample />

      <hr />
      <StandaloneCropperExample />

      <hr />
      <CompressionUtilityExample />

      <hr />
      <CloudFrontImageExample />
    </div>
  );
}
