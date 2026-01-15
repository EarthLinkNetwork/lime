import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({
  src,
  onCropComplete,
  onCancel,
  aspectRatio,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCropChange = useCallback((c: Crop) => {
    setCrop(c);
  }, []);

  const handleCropComplete = useCallback((c: PixelCrop) => {
    setCompletedCrop(c);
  }, []);

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop]);

  const handleConfirm = useCallback(async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  }, [getCroppedImage, onCropComplete]);

  return (
    <div className="image-cropper">
      <div className="image-cropper__container">
        <ReactCrop
          crop={crop}
          onChange={handleCropChange}
          onComplete={handleCropComplete}
          aspect={aspectRatio}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </ReactCrop>
      </div>
      <div className="image-cropper__actions">
        <button
          type="button"
          onClick={onCancel}
          className="image-cropper__button image-cropper__button--cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="image-cropper__button image-cropper__button--confirm"
        >
          Crop
        </button>
      </div>
    </div>
  );
}
