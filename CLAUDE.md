# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: AWS Profile Requirement

```
╔══════════════════════════════════════════════════════════════════╗
║  このプロジェクトは必ず AWS Profile "berry" を使用すること       ║
║  他の profile や default への deploy は絶対禁止                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**安全装置（物理的に強制）:**
1. `cdk.json` に `"profile": "berry"` を設定済み
2. `package.json` の全 CDK コマンドに `--profile berry` を付与済み
3. `bin/app.ts` に起動時 profile チェックを実装済み
4. `.env` ファイルで `AWS_PROFILE=berry` を設定済み

**絶対にやってはいけないこと:**
- `cdk deploy` を直接実行（必ず `npm run deploy` を使う）
- `--profile` オプションを変更・削除
- 環境変数 `AWS_PROFILE` を berry 以外に設定

## Project Overview

S3 Upload Utility (UTT) - A universal file upload infrastructure with image processing capabilities.

## Architecture

```
Frontend (React)                    Backend (AWS CDK)
┌─────────────────────┐            ┌─────────────────────┐
│ S3Uploader          │            │ HTTP API            │
│ - Image Compression │──────────▶│ + API Key Auth      │
│ - Image Cropping    │            └─────────┬───────────┘
│ - Presigned Upload  │                      │
└─────────────────────┘                      ▼
                                   ┌─────────────────────┐
                                   │ Lambda              │
                                   │ - Presigned URL Gen │
                                   │ - Image Resize      │
                                   └─────────┬───────────┘
                                             │
                                             ▼
                                   ┌─────────────────────┐
                                   │ S3 (CORS enabled)   │
                                   └─────────┬───────────┘
                                             │
                                             ▼
                                   ┌─────────────────────┐
                                   │ CloudFront          │
                                   │ ?w=300&h=300&r=10   │
                                   └─────────────────────┘
```

## Commands

```bash
# Install all dependencies
npm install

# Run all tests
npm test

# Build all packages
npm run build

# Run single package tests
npm test --workspace=packages/backend
npm test --workspace=packages/frontend

# CDK commands (from packages/backend) - 自動的に berry profile を使用
cd packages/backend
npm run synth     # Synthesize (--profile berry)
npm run deploy    # Deploy (--profile berry + profile check)
npm run diff      # Diff (--profile berry)

# Frontend dev server (from packages/frontend)
cd packages/frontend
npm run dev       # Start Vite dev server
```

**注意**: CDK コマンドは必ず `npm run` 経由で実行すること。直接 `cdk` コマンドを実行しないこと。

## Directory Structure

```
lime/
├── packages/
│   ├── backend/           # AWS CDK infrastructure
│   │   ├── bin/app.ts     # CDK app entry point
│   │   ├── lib/           # CDK stack definitions
│   │   │   └── s3-upload-stack.ts
│   │   ├── lambda/        # Lambda function handlers
│   │   │   ├── presigned-url/index.ts
│   │   │   └── image-resize/index.ts
│   │   └── test/          # Jest tests
│   └── frontend/          # React component library
│       ├── src/
│       │   ├── components/
│       │   │   ├── S3Uploader.tsx
│       │   │   └── ImageCropper.tsx
│       │   ├── utils/
│       │   │   └── imageCompression.ts
│       │   ├── types.ts
│       │   └── index.ts   # Package exports
│       └── vite.config.ts
├── package.json           # Monorepo root (npm workspaces)
├── turbo.json             # Turborepo config
└── CLAUDE.md
```

## Development Rules

- **TDD Mandatory**: Write tests first (`*.test.ts`) before implementation
- **Backend Tests**: Jest with CDK fine-grained assertions
- **Frontend Tests**: Vitest + React Testing Library
- **Cost Conscious**: HTTP API (not REST API), CloudFront caching
- **Strict Typing**: No `any` types, define interfaces for all API responses

## Key Components

### Backend (`packages/backend`)
- `S3UploadStack`: Main CDK stack with S3, Lambda, API Gateway, CloudFront
- `presigned-url`: Lambda for generating S3 presigned URLs
- `image-resize`: Lambda for dynamic image processing with sharp

### Frontend (`packages/frontend`)
- `S3Uploader`: Main upload component with compression and crop support
- `ImageCropper`: Standalone image cropping component
- `compressImage`: Image compression utility using browser-image-compression

## Test Results

- Backend: 11 tests (CDK stack assertions)
- Frontend: 17 tests (React components + utilities)
- Total: 28 tests passing
