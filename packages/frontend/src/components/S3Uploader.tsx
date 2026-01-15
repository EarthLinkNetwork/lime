import React, { useState, useCallback, useRef } from 'react';
import { compressImage } from '../utils/imageCompression';
import { ImageCropper } from './ImageCropper';
import type { S3UploaderProps, PresignedUrlResponse } from '../types';

type UploadStatus = 'idle' | 'compressing' | 'cropping' | 'uploading' | 'success' | 'error';

export function S3Uploader({
  apiEndpoint,
  apiKey,
  onUploadComplete,
  onUploadError,
  onProgress,
  maxFileSizeMB = 10,
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  enableCrop = false,
  enableCompression = true,
  compressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 },
}: S3UploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

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

      // Show cropper if enabled
      if (enableCrop) {
        setShowCropper(true);
      }
    },
    [allowedFileTypes, maxFileSizeMB, enableCrop]
  );

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], selectedFile?.name || 'cropped.jpg', {
      type: 'image/jpeg',
    });
    setSelectedFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
  }, [selectedFile]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
  }, []);

  const getPresignedUrl = async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
    const response = await fetch(`${apiEndpoint}/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({ fileName, contentType }),
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
      const { uploadUrl, fileUrl } = await getPresignedUrl(
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

      onUploadComplete?.(fileUrl);
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
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (showCropper && previewUrl) {
    return (
      <ImageCropper
        src={previewUrl}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <div className="s3-uploader">
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

      {previewUrl && !showCropper && (
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
