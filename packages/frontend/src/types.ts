export interface S3UploaderProps {
  apiEndpoint: string;
  apiKey: string;
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
