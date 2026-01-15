import * as react_jsx_runtime from 'react/jsx-runtime';

interface S3UploaderProps {
    apiEndpoint: string;
    apiKey: string;
    onUploadComplete?: (url: string) => void;
    onUploadError?: (error: Error) => void;
    onProgress?: (progress: number) => void;
    maxFileSizeMB?: number;
    allowedFileTypes?: string[];
    enableCrop?: boolean;
    enableCompression?: boolean;
    compressionOptions?: CompressionOptions$1;
}
interface ImageCropperProps$1 {
    src: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}
interface CompressionOptions$1 {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}

declare function S3Uploader({ apiEndpoint, apiKey, onUploadComplete, onUploadError, onProgress, maxFileSizeMB, allowedFileTypes, enableCrop, enableCompression, compressionOptions, }: S3UploaderProps): react_jsx_runtime.JSX.Element;

interface ImageCropperProps {
    src: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}
declare function ImageCropper({ src, onCropComplete, onCancel, aspectRatio, }: ImageCropperProps): react_jsx_runtime.JSX.Element;

interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}
declare function compressImage(file: File, options?: CompressionOptions): Promise<File>;

export { type CompressionOptions$1 as CompressionOptions, ImageCropper, type ImageCropperProps$1 as ImageCropperProps, S3Uploader, type S3UploaderProps, compressImage };
