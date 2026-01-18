import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { jsxs, jsx } from 'react/jsx-runtime';

var DEFAULT_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
async function compressImage(file, options = {}) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed types: JPEG, PNG, GIF, WebP");
  }
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = (mergedOptions.maxSizeMB || 2) * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    return file;
  }
  const compressedFile = await imageCompression(file, {
    maxSizeMB: mergedOptions.maxSizeMB,
    maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
    useWebWorker: mergedOptions.useWebWorker
  });
  return compressedFile;
}
function ImageCropper({
  src,
  onCropComplete,
  onCancel,
  aspectRatio
}) {
  const [crop, setCrop] = useState({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const handleCropChange = useCallback((c) => {
    setCrop(c);
  }, []);
  const handleCropComplete = useCallback((c) => {
    setCompletedCrop(c);
  }, []);
  const getCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      return null;
    }
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
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
        "image/jpeg",
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
  return /* @__PURE__ */ jsxs("div", { className: "image-cropper", children: [
    /* @__PURE__ */ jsx("div", { className: "image-cropper__container", children: /* @__PURE__ */ jsx(
      ReactCrop,
      {
        crop,
        onChange: handleCropChange,
        onComplete: handleCropComplete,
        aspect: aspectRatio,
        children: /* @__PURE__ */ jsx(
          "img",
          {
            ref: imgRef,
            src,
            alt: "Crop preview",
            style: { maxWidth: "100%", maxHeight: "70vh" }
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "image-cropper__actions", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "image-cropper__button image-cropper__button--cancel",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleConfirm,
          className: "image-cropper__button image-cropper__button--confirm",
          children: "Crop"
        }
      )
    ] })
  ] });
}
function S3Uploader({
  apiEndpoint,
  apiKey,
  cloudfrontDomain,
  onUploadComplete,
  onUploadError,
  onProgress,
  maxFileSizeMB = 10,
  allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  enableCrop = false,
  enableCompression = true,
  compressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 }
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);
  const handleFileSelect = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!allowedFileTypes.includes(file.type)) {
        setErrorMessage(`Invalid file type. Allowed: ${allowedFileTypes.join(", ")}`);
        return;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setErrorMessage(`File too large. Maximum size: ${maxFileSizeMB}MB`);
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (enableCrop) {
        setShowCropper(true);
      }
    },
    [allowedFileTypes, maxFileSizeMB, enableCrop]
  );
  const handleCropComplete = useCallback((croppedBlob) => {
    const croppedFile = new File([croppedBlob], selectedFile?.name || "cropped.jpg", {
      type: "image/jpeg"
    });
    setSelectedFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedBlob));
    setShowCropper(false);
  }, [selectedFile]);
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
  }, []);
  const getPresignedUrl = async (fileName, contentType) => {
    const response = await fetch(`${apiEndpoint}/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify({ fileName, contentType })
    });
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }
    return response.json();
  };
  const uploadToS3 = async (uploadUrl, file) => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  };
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    try {
      setStatus("compressing");
      setProgress(10);
      onProgress?.(10);
      let fileToUpload = selectedFile;
      if (enableCompression && selectedFile.type.startsWith("image/")) {
        fileToUpload = await compressImage(selectedFile, compressionOptions);
      }
      setStatus("uploading");
      setProgress(30);
      onProgress?.(30);
      const { uploadUrl, fileUrl, key } = await getPresignedUrl(
        fileToUpload.name,
        fileToUpload.type
      );
      setProgress(50);
      onProgress?.(50);
      await uploadToS3(uploadUrl, fileToUpload);
      setProgress(100);
      onProgress?.(100);
      setStatus("success");
      const finalUrl = cloudfrontDomain ? `https://${cloudfrontDomain.replace(/^https?:\/\//, "")}/${key}` : fileUrl;
      onUploadComplete?.(finalUrl);
    } catch (error) {
      setStatus("error");
      const errorObj = error instanceof Error ? error : new Error("Unknown error");
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
    onProgress
  ]);
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);
  if (showCropper && previewUrl) {
    return /* @__PURE__ */ jsx(
      ImageCropper,
      {
        src: previewUrl,
        onCropComplete: handleCropComplete,
        onCancel: handleCropCancel
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "s3-uploader", children: [
    /* @__PURE__ */ jsxs("div", { className: "s3-uploader__input-container", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "file-input", className: "s3-uploader__label", children: "Select File" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          id: "file-input",
          type: "file",
          accept: "image/*",
          onChange: handleFileSelect,
          className: "s3-uploader__input",
          disabled: status === "uploading" || status === "compressing"
        }
      )
    ] }),
    previewUrl && !showCropper && /* @__PURE__ */ jsx("div", { className: "s3-uploader__preview", children: /* @__PURE__ */ jsx(
      "img",
      {
        src: previewUrl,
        alt: "Preview",
        className: "s3-uploader__preview-image",
        style: { maxWidth: "200px", maxHeight: "200px" }
      }
    ) }),
    errorMessage && /* @__PURE__ */ jsx("div", { className: "s3-uploader__error", role: "alert", children: errorMessage }),
    status === "uploading" || status === "compressing" ? /* @__PURE__ */ jsxs("div", { className: "s3-uploader__progress", children: [
      /* @__PURE__ */ jsx(
        "progress",
        {
          value: progress,
          max: 100,
          className: "s3-uploader__progress-bar",
          role: "progressbar",
          "aria-valuenow": progress,
          "aria-valuemin": 0,
          "aria-valuemax": 100
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "s3-uploader__progress-text", children: [
        progress,
        "%"
      ] })
    ] }) : null,
    status === "success" && /* @__PURE__ */ jsx("div", { className: "s3-uploader__success", role: "status", children: "Upload complete!" }),
    /* @__PURE__ */ jsxs("div", { className: "s3-uploader__actions", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleUpload,
          disabled: !selectedFile || status === "uploading" || status === "compressing",
          className: "s3-uploader__button s3-uploader__button--upload",
          children: "Upload"
        }
      ),
      (selectedFile || status === "success" || status === "error") && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleReset,
          className: "s3-uploader__button s3-uploader__button--reset",
          children: "Reset"
        }
      )
    ] })
  ] });
}

export { ImageCropper, S3Uploader, compressImage };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map