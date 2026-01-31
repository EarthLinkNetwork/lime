import React, { useState, useCallback, useRef } from 'react';
import { compressImage } from '../utils/imageCompression';
import { ImageCropper } from './ImageCropper';
import { ImageEditorLazy } from './ImageEditorLazy';
import type { S3UploaderProps, PresignedUrlResponse } from '../types';

type UploadStatus = 'idle' | 'compressing' | 'editing' | 'uploading' | 'success' | 'error';

export function S3Uploader({
  apiEndpoint,
  apiKey,
  projectCode,
  ownerKey,
  folder,
  tags,
  cloudfrontDomain,
  onUploadComplete,
  onUploadError,
  onProgress,
  maxFileSizeMB = 10,
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  enableCrop = false,
  enableEditor = false,
  enableCompression = true,
  compressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 },
  enableDragDrop = true,
  editorConfig,
}: S3UploaderProps) {
  // Support legacy enableCrop prop
  const editorEnabled = enableEditor || enableCrop;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        setErrorMessage(`Invalid file type. Allowed: ${allowedFileTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setErrorMessage(`File too large. Maximum size: ${maxFileSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
      setErrorMessage(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Show editor if enabled
      if (editorEnabled) {
        setIsEditorOpen(true);
      }
    },
    [allowedFileTypes, maxFileSizeMB, editorEnabled]
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  const handleEditorSave = useCallback((blob: Blob, fileName: string) => {
    const editedFile = new File([blob], fileName || selectedFile?.name || 'edited.jpg', {
      type: blob.type || 'image/jpeg',
    });
    setSelectedFile(editedFile);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsEditorOpen(false);
  }, [selectedFile]);

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  // Legacy support for ImageCropper
  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    handleEditorSave(croppedBlob, selectedFile?.name || 'cropped.jpg');
  }, [handleEditorSave, selectedFile]);

  const handleCropCancel = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const getPresignedUrl = async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
    const requestBody: Record<string, unknown> = {
      fileName,
      contentType,
      projectCode,
      ownerKey,
    };
    if (folder) {
      requestBody.folder = folder;
    }
    if (tags && Object.keys(tags).length > 0) {
      requestBody.tags = tags;
    }

    const response = await fetch(`${apiEndpoint}/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }

    return response.json();
  };

  const uploadToS3 = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setStatus('compressing');
      setProgress(10);
      onProgress?.(10);

      // Compress image if enabled
      let fileToUpload = selectedFile;
      if (enableCompression && selectedFile.type.startsWith('image/')) {
        fileToUpload = await compressImage(selectedFile, compressionOptions);
      }

      setStatus('uploading');
      setProgress(30);
      onProgress?.(30);

      // Get presigned URL
      const { uploadUrl, fileUrl, key } = await getPresignedUrl(
        fileToUpload.name,
        fileToUpload.type
      );

      setProgress(50);
      onProgress?.(50);

      // Upload to S3
      await uploadToS3(uploadUrl, fileToUpload);

      setProgress(100);
      onProgress?.(100);
      setStatus('success');

      // Return CloudFront URL if domain is provided, otherwise S3 URL
      const finalUrl = cloudfrontDomain
        ? `https://${cloudfrontDomain.replace(/^https?:\/\//, '')}/${key}`
        : fileUrl;
      onUploadComplete?.(finalUrl);
    } catch (error) {
      setStatus('error');
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setErrorMessage(errorObj.message);
      onUploadError?.(errorObj);
    }
  }, [
    selectedFile,
    enableCompression,
    compressionOptions,
    apiEndpoint,
    apiKey,
    cloudfrontDomain,
    onUploadComplete,
    onUploadError,
    onProgress,
  ]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setIsEditorOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Show full image editor if enabled (lazy loaded for Next.js compatibility)
  if (isEditorOpen && previewUrl && enableEditor) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '500px', flex: 1 }}>
        <ImageEditorLazy
          src={previewUrl}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
          defaultTab={editorConfig?.defaultTab}
          enabledTabs={editorConfig?.enabledTabs}
          cropPresets={editorConfig?.cropPresets}
          aspectRatioLocked={editorConfig?.aspectRatioLocked}
          defaultAspectRatio={editorConfig?.defaultAspectRatio}
        />
      </div>
    );
  }

  // Legacy: Show simple cropper if enableCrop is used
  if (isEditorOpen && previewUrl && enableCrop && !enableEditor) {
    return (
      <ImageCropper
        src={previewUrl}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    );
  }

  const dropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${isDragOver ? '#2196F3' : '#ccc'}`,
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: isDragOver ? '#e3f2fd' : '#fafafa',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    marginBottom: '16px',
  };

  const dropZoneIconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '8px',
    color: isDragOver ? '#2196F3' : '#999',
  };

  const dropZoneTextStyle: React.CSSProperties = {
    margin: 0,
    color: isDragOver ? '#2196F3' : '#666',
    fontSize: '14px',
  };

  const dropZoneClassName = [
    's3-uploader__drop-zone',
    isDragOver ? 's3-uploader--drag-over' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="s3-uploader">
      {enableDragDrop && (
        <div
          className={dropZoneClassName}
          style={dropZoneStyle}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="drop-zone"
        >
          <div style={dropZoneIconStyle}>
            {isDragOver ? '📥' : '📁'}
          </div>
          <p style={dropZoneTextStyle}>
            {isDragOver ? 'Drop to upload' : 'Drag & drop image here, or click to select'}
          </p>
        </div>
      )}

      <div className="s3-uploader__input-container">
        <label htmlFor="file-input" className="s3-uploader__label">
          Select File
        </label>
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="s3-uploader__input"
          disabled={status === 'uploading' || status === 'compressing'}
        />
      </div>

      {previewUrl && !isEditorOpen && (
        <div className="s3-uploader__preview">
          <img
            src={previewUrl}
            alt="Preview"
            className="s3-uploader__preview-image"
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
        </div>
      )}

      {errorMessage && (
        <div className="s3-uploader__error" role="alert">
          {errorMessage}
        </div>
      )}

      {status === 'uploading' || status === 'compressing' ? (
        <div className="s3-uploader__progress">
          <progress
            value={progress}
            max={100}
            className="s3-uploader__progress-bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="s3-uploader__progress-text">{progress}%</span>
        </div>
      ) : null}

      {status === 'success' && (
        <div className="s3-uploader__success" role="status">
          Upload complete!
        </div>
      )}

      <div className="s3-uploader__actions">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || status === 'uploading' || status === 'compressing'}
          className="s3-uploader__button s3-uploader__button--upload"
        >
          Upload
        </button>
        {(selectedFile || status === 'success' || status === 'error') && (
          <button
            type="button"
            onClick={handleReset}
            className="s3-uploader__button s3-uploader__button--reset"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
