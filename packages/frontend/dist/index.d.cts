import * as react_jsx_runtime from 'react/jsx-runtime';
export { TABS, TOOLS } from 'react-filerobot-image-editor';

/** Available tabs in the image editor */
type ImageEditorTab = 'Adjust' | 'Filters' | 'Finetune' | 'Resize' | 'Annotate' | 'Watermark';
/** Crop preset configuration */
interface CropPreset {
    label: string;
    ratio?: number;
    width?: number;
    height?: number;
}
interface S3UploaderProps {
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
    /** @deprecated Use enableEditor instead */
    enableCrop?: boolean;
    /** Enable full image editor (crop, rotate, filters, etc.) - default: false */
    enableEditor?: boolean;
    enableCompression?: boolean;
    compressionOptions?: CompressionOptions$1;
    /** Enable drag & drop upload (default: true) */
    enableDragDrop?: boolean;
    /** Image editor configuration */
    editorConfig?: {
        /** Tabs to show in editor (default: all) */
        enabledTabs?: ImageEditorTab[];
        /** Default tab when editor opens */
        defaultTab?: ImageEditorTab;
        /** Crop presets (e.g., 1:1, 4:3, 16:9) */
        cropPresets?: CropPreset[];
        /** Lock aspect ratio */
        aspectRatioLocked?: boolean;
        /** Default aspect ratio when locked */
        defaultAspectRatio?: number;
    };
}
interface ImageCropperProps$1 {
    src: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}
interface ImageEditorProps {
    /** Image source URL or base64 */
    src: string;
    /** Called when user saves the edited image */
    onSave: (blob: Blob, fileName: string) => void;
    /** Called when user closes the editor */
    onClose: () => void;
    /** Default tab to open (default: 'Adjust') */
    defaultTab?: ImageEditorTab;
    /** Tabs to show in editor */
    enabledTabs?: ImageEditorTab[];
    /** Crop presets */
    cropPresets?: CropPreset[];
    /** Lock aspect ratio */
    aspectRatioLocked?: boolean;
    /** Default aspect ratio when locked */
    defaultAspectRatio?: number;
}
interface CompressionOptions$1 {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}
interface DeleteObjectResponse {
    deleted: boolean;
    key: string;
}
interface ObjectInfo {
    key: string;
    size: number;
    lastModified: string;
    tags?: Record<string, string>;
}
interface ListObjectsResponse {
    objects: ObjectInfo[];
    nextCursor: string | null;
}
interface ListObjectsParams {
    apiEndpoint: string;
    apiKey: string;
    projectCode: string;
    ownerKey?: string;
    folder?: string;
    limit?: number;
    cursor?: string;
    includeTags?: boolean;
}

declare function S3Uploader({ apiEndpoint, apiKey, projectCode, ownerKey, folder, tags, cloudfrontDomain, onUploadComplete, onUploadError, onProgress, maxFileSizeMB, allowedFileTypes, enableCrop, enableEditor, enableCompression, compressionOptions, enableDragDrop, editorConfig, }: S3UploaderProps): react_jsx_runtime.JSX.Element;

interface ImageCropperProps {
    src: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}
declare function ImageCropper({ src, onCropComplete, onCancel, aspectRatio, }: ImageCropperProps): react_jsx_runtime.JSX.Element;

declare function ImageEditorLazy(props: ImageEditorProps): react_jsx_runtime.JSX.Element;

interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}
declare function compressImage(file: File, options?: CompressionOptions): Promise<File>;

interface DeleteObjectParams {
    apiEndpoint: string;
    apiKey: string;
    key: string;
}
declare function deleteObject(params: DeleteObjectParams): Promise<DeleteObjectResponse>;
declare function listObjects(params: ListObjectsParams): Promise<ListObjectsResponse>;

export { type CompressionOptions$1 as CompressionOptions, type CropPreset, type DeleteObjectResponse, ImageCropper, type ImageCropperProps$1 as ImageCropperProps, ImageEditorLazy as ImageEditor, type ImageEditorProps, type ImageEditorTab, type ListObjectsParams, type ListObjectsResponse, type ObjectInfo, S3Uploader, type S3UploaderProps, compressImage, deleteObject, listObjects };
