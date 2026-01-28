export interface S3UploaderProps {
  apiEndpoint: string;
  apiKey: string;
  /** Project identifier for S3 key hierarchy */
  projectCode: string;
  /** Owner key for data isolation (e.g., userId, teamId, tenantId) */
  ownerKey: string;
  /** Logical folder within the owner's space (default: 'uploads') */
  folder?: string;
  /** S3 Object Tags for metadata */
  tags?: Record<string, string>;
  /** CloudFront domain for image delivery (e.g., "d1xxx.cloudfront.net"). If provided, onUploadComplete returns CloudFront URL instead of S3 URL. */
  cloudfrontDomain?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  enableCrop?: boolean;
  enableCompression?: boolean;
  compressionOptions?: CompressionOptions;
  /** Enable drag & drop upload (default: true) */
  enableDragDrop?: boolean;
}

export interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface DeleteObjectResponse {
  deleted: boolean;
  key: string;
}

export interface ObjectInfo {
  key: string;
  size: number;
  lastModified: string;
  tags?: Record<string, string>;
}

export interface ListObjectsResponse {
  objects: ObjectInfo[];
  nextCursor: string | null;
}

export interface ListObjectsParams {
  apiEndpoint: string;
  apiKey: string;
  projectCode: string;
  ownerKey?: string;
  folder?: string;
  limit?: number;
  cursor?: string;
  includeTags?: boolean;
}
