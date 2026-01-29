import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { jsxs, jsx } from 'react/jsx-runtime';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
export { TABS, TOOLS } from 'react-filerobot-image-editor';

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
function ImageEditor({
  src,
  onSave,
  onClose,
  defaultTab = "Adjust",
  enabledTabs = ["Adjust", "Filters", "Finetune", "Resize", "Annotate"],
  cropPresets,
  aspectRatioLocked = false,
  defaultAspectRatio
}) {
  const tabsIds = enabledTabs.map((tab) => {
    switch (tab) {
      case "Adjust":
        return TABS.ADJUST;
      case "Filters":
        return TABS.FILTERS;
      case "Finetune":
        return TABS.FINETUNE;
      case "Resize":
        return TABS.RESIZE;
      case "Annotate":
        return TABS.ANNOTATE;
      case "Watermark":
        return TABS.WATERMARK;
      default:
        return TABS.ADJUST;
    }
  });
  const defaultTabId = (() => {
    switch (defaultTab) {
      case "Adjust":
        return TABS.ADJUST;
      case "Filters":
        return TABS.FILTERS;
      case "Finetune":
        return TABS.FINETUNE;
      case "Resize":
        return TABS.RESIZE;
      case "Annotate":
        return TABS.ANNOTATE;
      case "Watermark":
        return TABS.WATERMARK;
      default:
        return TABS.ADJUST;
    }
  })();
  const handleSave = (editedImageObject) => {
    if (!editedImageObject.imageBase64) return;
    const base64Data = editedImageObject.imageBase64.split(",")[1];
    const mimeType = editedImageObject.mimeType || "image/jpeg";
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    onSave(blob, editedImageObject.fullName || "edited-image");
  };
  const cropConfig = {
    autoResize: true
  };
  if (aspectRatioLocked && defaultAspectRatio) {
    cropConfig.ratio = defaultAspectRatio;
    cropConfig.noPresets = true;
  } else if (cropPresets && cropPresets.length > 0) {
    cropConfig.presetsItems = cropPresets.map((preset) => ({
      titleKey: preset.label,
      ratio: preset.ratio,
      width: preset.width,
      height: preset.height
    }));
  }
  return /* @__PURE__ */ jsx("div", { className: "image-editor", style: { height: "100vh", width: "100%" }, children: /* @__PURE__ */ jsx(
    FilerobotImageEditor,
    {
      source: src,
      onSave: handleSave,
      onClose,
      tabsIds,
      defaultTabId,
      defaultToolId: TOOLS.CROP,
      savingPixelRatio: 4,
      previewPixelRatio: window.devicePixelRatio,
      Crop: cropConfig,
      Rotate: {
        componentType: "slider"
      },
      Text: { text: "" }
    }
  ) });
}
function S3Uploader({
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
  allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  enableCrop = false,
  enableEditor = false,
  enableCompression = true,
  compressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 },
  enableDragDrop = true,
  editorConfig
}) {
  const editorEnabled = enableEditor || enableCrop;
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const processFile = useCallback(
    (file) => {
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
      if (editorEnabled) {
        setIsEditorOpen(true);
      }
    },
    [allowedFileTypes, maxFileSizeMB, editorEnabled]
  );
  const handleFileSelect = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );
  const handleEditorSave = useCallback((blob, fileName) => {
    const editedFile = new File([blob], fileName || selectedFile?.name || "edited.jpg", {
      type: blob.type || "image/jpeg"
    });
    setSelectedFile(editedFile);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsEditorOpen(false);
  }, [selectedFile]);
  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
  }, []);
  const handleCropComplete = useCallback((croppedBlob) => {
    handleEditorSave(croppedBlob, selectedFile?.name || "cropped.jpg");
  }, [handleEditorSave, selectedFile]);
  const handleCropCancel = useCallback(() => {
    setIsEditorOpen(false);
  }, []);
  const getPresignedUrl = async (fileName, contentType) => {
    const requestBody = {
      fileName,
      contentType,
      projectCode,
      ownerKey
    };
    if (folder) {
      requestBody.folder = folder;
    }
    if (tags && Object.keys(tags).length > 0) {
      requestBody.tags = tags;
    }
    const response = await fetch(`${apiEndpoint}/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify(requestBody)
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
    setIsEditorOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);
  if (isEditorOpen && previewUrl && enableEditor) {
    return /* @__PURE__ */ jsx(
      ImageEditor,
      {
        src: previewUrl,
        onSave: handleEditorSave,
        onClose: handleEditorClose,
        defaultTab: editorConfig?.defaultTab,
        enabledTabs: editorConfig?.enabledTabs,
        cropPresets: editorConfig?.cropPresets,
        aspectRatioLocked: editorConfig?.aspectRatioLocked,
        defaultAspectRatio: editorConfig?.defaultAspectRatio
      }
    );
  }
  if (isEditorOpen && previewUrl && enableCrop && !enableEditor) {
    return /* @__PURE__ */ jsx(
      ImageCropper,
      {
        src: previewUrl,
        onCropComplete: handleCropComplete,
        onCancel: handleCropCancel
      }
    );
  }
  const dropZoneStyle = {
    border: `2px dashed ${isDragOver ? "#2196F3" : "#ccc"}`,
    borderRadius: "8px",
    padding: "40px 20px",
    textAlign: "center",
    backgroundColor: isDragOver ? "#e3f2fd" : "#fafafa",
    transition: "all 0.2s ease",
    cursor: "pointer",
    marginBottom: "16px"
  };
  const dropZoneIconStyle = {
    fontSize: "48px",
    marginBottom: "8px",
    color: isDragOver ? "#2196F3" : "#999"
  };
  const dropZoneTextStyle = {
    margin: 0,
    color: isDragOver ? "#2196F3" : "#666",
    fontSize: "14px"
  };
  const dropZoneClassName = [
    "s3-uploader__drop-zone",
    isDragOver ? "s3-uploader--drag-over" : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { className: "s3-uploader", children: [
    enableDragDrop && /* @__PURE__ */ jsxs(
      "div",
      {
        className: dropZoneClassName,
        style: dropZoneStyle,
        onDragOver: handleDragOver,
        onDragEnter: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onClick: () => fileInputRef.current?.click(),
        "data-testid": "drop-zone",
        children: [
          /* @__PURE__ */ jsx("div", { style: dropZoneIconStyle, children: isDragOver ? "\u{1F4E5}" : "\u{1F4C1}" }),
          /* @__PURE__ */ jsx("p", { style: dropZoneTextStyle, children: isDragOver ? "Drop to upload" : "Drag & drop image here, or click to select" })
        ]
      }
    ),
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
    previewUrl && !isEditorOpen && /* @__PURE__ */ jsx("div", { className: "s3-uploader__preview", children: /* @__PURE__ */ jsx(
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

// src/utils/api.ts
async function deleteObject(params) {
  const { apiEndpoint, apiKey, key } = params;
  const response = await fetch(`${apiEndpoint}/objects`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey
    },
    body: JSON.stringify({ key })
  });
  if (!response.ok) {
    throw new Error(`Failed to delete object: ${response.status}`);
  }
  return response.json();
}
async function listObjects(params) {
  const { apiEndpoint, apiKey, projectCode, ownerKey, folder, limit, cursor, includeTags } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("projectCode", projectCode);
  if (ownerKey) searchParams.set("ownerKey", ownerKey);
  if (folder) searchParams.set("folder", folder);
  if (limit) searchParams.set("limit", String(limit));
  if (cursor) searchParams.set("cursor", cursor);
  if (includeTags) searchParams.set("includeTags", "true");
  const response = await fetch(`${apiEndpoint}/objects?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "X-Api-Key": apiKey
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.status}`);
  }
  return response.json();
}

export { ImageCropper, ImageEditor, S3Uploader, compressImage, deleteObject, listObjects };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map