# @earthlinknetwork/lime

Universal S3 file upload utility with image processing for React applications.

## Features

- **S3Uploader**: Drag-and-drop upload with progress tracking
- **ImageEditor**: Full-featured image editor (crop, rotate, filters, resize, annotate)
- **ImageCropper**: Simple cropping with aspect ratio support (legacy)
- **Image Compression**: Client-side compression (browser-image-compression)
- **Dynamic Image Processing**: CloudFront + Lambda for on-the-fly resizing
- **AWS CDK Backend**: Ready-to-deploy infrastructure
- **Multi-project Support**: Hierarchical S3 key structure (`{projectCode}/{ownerKey}/{folder}/`)
- **Object Tagging**: S3 Object Tags for flexible metadata
- **Delete API**: Delete uploaded objects via API
- **List API**: List and filter objects with pagination and tag retrieval
- **Lifecycle Rules**: Auto-cleanup of temporary files (`_tmp/` prefix)

## Installation

```bash
# Install from GitHub (no PAT required for public repos)
npm install github:EarthLinkNetwork/lime

# Or add to package.json
{
  "dependencies": {
    "@earthlinknetwork/lime": "github:EarthLinkNetwork/lime"
  }
}

# SSH alternative
npm install git+ssh://git@github.com:EarthLinkNetwork/lime.git
```

> **Note**: The `prepare` script automatically builds packages on install.

## Quick Start

### 1. Deploy Backend

```bash
cd node_modules/@earthlinknetwork/lime/packages/backend
export AWS_PROFILE=your-profile

# Generate and set API key
export VALID_API_KEYS=$(openssl rand -hex 32)
echo "Your API Key: $VALID_API_KEYS"  # Save this!

npm run deploy
```

Note the outputs:
- `ApiEndpoint`: HTTP API URL
- `DistributionDomain`: CloudFront domain
- `BucketName`: S3 bucket name

### 2. Use Frontend Components

```tsx
import { S3Uploader, ImageEditor, compressImage, deleteObject, listObjects } from '@earthlinknetwork/lime/packages/frontend/dist';

function MyUploadPage() {
  return (
    <S3Uploader
      apiEndpoint="https://xxx.execute-api.region.amazonaws.com"
      apiKey="your-api-key"
      projectCode="my-app"                     // Required: project identifier
      ownerKey="user-123"                      // Required: data isolation key
      folder="avatars"                         // Optional: logical folder (default: 'uploads')
      tags={{ category: 'profile' }}           // Optional: S3 Object Tags
      cloudfrontDomain="d1xxx.cloudfront.net"  // Optional: returns CloudFront URL
      onUploadComplete={(url) => console.log('Uploaded:', url)}
      onUploadError={(error) => console.error('Failed:', error)}
      enableCompression={true}
      enableEditor={true}                      // Optional: full image editor
      enableDragDrop={true}                    // Optional: drag & drop (default: true)
      maxFileSizeMB={10}
      allowedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
      editorConfig={{                          // Optional: editor customization
        enabledTabs: ['Adjust', 'Filters', 'Resize'],
        defaultTab: 'Adjust',
        cropPresets: [
          { label: '1:1', ratio: 1 },
          { label: '16:9', ratio: 16/9 },
        ],
      }}
    />
  );
}
```

### 3. Delete & List Objects

```tsx
import { deleteObject, listObjects } from '@earthlinknetwork/lime/packages/frontend/dist';

// Delete an object
await deleteObject({
  apiEndpoint: 'https://xxx.execute-api.region.amazonaws.com',
  apiKey: 'your-api-key',
  key: 'my-app/user-123/avatars/abc123.jpg',
});

// List objects
const result = await listObjects({
  apiEndpoint: 'https://xxx.execute-api.region.amazonaws.com',
  apiKey: 'your-api-key',
  projectCode: 'my-app',
  ownerKey: 'user-123',          // Optional: filter by owner
  folder: 'avatars',              // Optional: filter by folder
  limit: 50,                      // Optional: max results (default: 50)
  cursor: result.nextCursor,      // Optional: pagination
  includeTags: true,               // Optional: fetch S3 tags
});
// result.objects: [{ key, size, lastModified, tags? }]
// result.nextCursor: string | null
```

### 4. Image Compression

```tsx
import { compressImage } from '@earthlinknetwork/lime/packages/frontend/dist';

async function handleFile(file: File) {
  const compressed = await compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  // Use compressed file
}
```

### 5. S3 Key Structure

Objects are stored with a hierarchical key structure:

```
{projectCode}/{ownerKey}/{folder}/{UUID}.{ext}

Examples:
  my-app/user-123/avatars/550e8400.jpg
  my-app/team-abc/documents/6ba7b810.pdf
  other-app/tenant-1/uploads/f47ac10b.webp
```

- **projectCode**: Project identifier (required)
- **ownerKey**: Data isolation key - userId, teamId, tenantId, etc. (required)
- **folder**: Logical category (optional, default: `uploads`)

Temporary files stored under `_tmp/` prefix are auto-deleted after 24 hours.

### 6. CloudFront Dynamic Images

```
https://{cloudfront-domain}/uploads/image.jpg?w=200        # Width
https://{cloudfront-domain}/uploads/image.jpg?w=300&q=85   # Width + Quality
https://{cloudfront-domain}/uploads/image.jpg?w=150&r=20   # Rounded corners
https://{cloudfront-domain}/uploads/image.jpg?f=webp       # Format conversion
```

**Parameters:**
| Param | Description |
|-------|-------------|
| `w` | Width (px) |
| `h` | Height (px) |
| `q` | Quality (1-100) |
| `r` | Border radius (px) |
| `f` | Format (webp/png/jpeg) |

## Package Structure

```
lime/
├── packages/
│   ├── frontend/          # React components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── S3Uploader.tsx    # Main upload component
│   │   │   │   ├── ImageEditor.tsx   # Full-featured image editor
│   │   │   │   └── ImageCropper.tsx  # Simple cropper (legacy)
│   │   │   └── utils/
│   │   │       ├── imageCompression.ts
│   │   │       └── api.ts            # deleteObject, listObjects
│   │   └── dist/          # Built output
│   │
│   └── backend/           # AWS CDK infrastructure
│       ├── lib/           # CDK Stack
│       └── lambda/        # Lambda functions
│           ├── presigned-url/   # Upload URL generation
│           ├── delete-object/   # Object deletion
│           ├── list-objects/    # Object listing
│           └── image-resize/    # Dynamic image processing
│
├── .ai-integration-guide.md  # AI agent instructions
└── .npmrc.example            # CI/CD configuration
```

## API Reference

### S3Uploader Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiEndpoint` | `string` | Yes | API Gateway endpoint |
| `apiKey` | `string` | Yes | API key for authentication |
| `projectCode` | `string` | Yes | Project identifier for S3 key hierarchy |
| `ownerKey` | `string` | Yes | Data isolation key (userId, teamId, etc.) |
| `folder` | `string` | No | Logical folder (default: 'uploads') |
| `tags` | `Record<string, string>` | No | S3 Object Tags |
| `cloudfrontDomain` | `string` | No | CloudFront domain (returns CF URL if set) |
| `onUploadComplete` | `(url: string) => void` | No | Success callback |
| `onUploadError` | `(error: Error) => void` | No | Error callback |
| `onProgress` | `(progress: number) => void` | No | Progress callback (0-100) |
| `enableCompression` | `boolean` | No | Enable compression (default: true) |
| `enableEditor` | `boolean` | No | Enable full image editor (default: false) |
| `enableCrop` | `boolean` | No | Enable simple cropping - deprecated, use enableEditor |
| `enableDragDrop` | `boolean` | No | Enable drag & drop (default: true) |
| `maxFileSizeMB` | `number` | No | Max file size (default: 10) |
| `allowedFileTypes` | `string[]` | No | Allowed MIME types |
| `compressionOptions` | `CompressionOptions` | No | Compression settings |
| `editorConfig` | `EditorConfig` | No | Image editor configuration |

### EditorConfig

| Option | Type | Description |
|--------|------|-------------|
| `enabledTabs` | `ImageEditorTab[]` | Tabs to show: 'Adjust', 'Filters', 'Finetune', 'Resize', 'Annotate', 'Watermark' |
| `defaultTab` | `ImageEditorTab` | Default tab when editor opens |
| `cropPresets` | `CropPreset[]` | Crop presets (e.g., `{ label: '1:1', ratio: 1 }`) |
| `aspectRatioLocked` | `boolean` | Lock aspect ratio |
| `defaultAspectRatio` | `number` | Default aspect ratio when locked |

### ImageEditor Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | `string` | Yes | Image source URL or base64 |
| `onSave` | `(blob: Blob, fileName: string) => void` | Yes | Save callback |
| `onClose` | `() => void` | Yes | Close callback |
| `defaultTab` | `ImageEditorTab` | No | Default tab (default: 'Adjust') |
| `enabledTabs` | `ImageEditorTab[]` | No | Tabs to show |
| `cropPresets` | `CropPreset[]` | No | Crop presets |
| `aspectRatioLocked` | `boolean` | No | Lock aspect ratio |
| `defaultAspectRatio` | `number` | No | Default aspect ratio |

### ImageCropper Props (Legacy)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | `string` | Yes | Image source URL |
| `onCropComplete` | `(blob: Blob) => void` | Yes | Crop complete callback |
| `onCancel` | `() => void` | Yes | Cancel callback |
| `aspectRatio` | `number` | No | Fixed aspect ratio |

### CompressionOptions

| Option | Type | Description |
|--------|------|-------------|
| `maxSizeMB` | `number` | Target max file size |
| `maxWidthOrHeight` | `number` | Max dimension |
| `useWebWorker` | `boolean` | Use web worker |

### Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/presigned-url` | Generate upload URL (requires `projectCode`, `ownerKey`) |
| `DELETE` | `/objects` | Delete an object (requires `key`) |
| `GET` | `/objects` | List objects (requires `projectCode`, optional filters) |

All endpoints require `X-Api-Key` header.

## Requirements

- Node.js >= 18.0.0
- React >= 18.0.0
- AWS CDK 2.x (for backend)

## Development

```bash
# Install and build
npm install

# Run tests
npm test

# Build all packages
npm run build
```

## For AI Agents

See [.ai-integration-guide.md](./.ai-integration-guide.md) for detailed integration instructions.

## License

MIT

## Repository

https://github.com/EarthLinkNetwork/lime
