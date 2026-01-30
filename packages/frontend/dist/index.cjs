'use strict';

var React = require('react');
var reactDom = require('react-dom');
var FilerobotImageEditor = require('react-filerobot-image-editor');
var jsxRuntime = require('react/jsx-runtime');
var imageCompression = require('browser-image-compression');
var ReactCrop = require('react-image-crop');
require('react-image-crop/dist/ReactCrop.css');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React__default = /*#__PURE__*/_interopDefault(React);
var FilerobotImageEditor__default = /*#__PURE__*/_interopDefault(FilerobotImageEditor);
var imageCompression__default = /*#__PURE__*/_interopDefault(imageCompression);
var ReactCrop__default = /*#__PURE__*/_interopDefault(ReactCrop);

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/components/ImageEditor.css
var init_ImageEditor = __esm({
  "src/components/ImageEditor.css"() {
  }
});

// src/components/ImageEditor.tsx
var ImageEditor_exports = {};
__export(ImageEditor_exports, {
  ImageEditor: () => ImageEditor,
  TABS: () => FilerobotImageEditor.TABS,
  TOOLS: () => FilerobotImageEditor.TOOLS
});
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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  const tabsIds = enabledTabs.map((tab) => {
    switch (tab) {
      case "Adjust":
        return FilerobotImageEditor.TABS.ADJUST;
      case "Filters":
        return FilerobotImageEditor.TABS.FILTERS;
      case "Finetune":
        return FilerobotImageEditor.TABS.FINETUNE;
      case "Resize":
        return FilerobotImageEditor.TABS.RESIZE;
      case "Annotate":
        return FilerobotImageEditor.TABS.ANNOTATE;
      case "Watermark":
        return FilerobotImageEditor.TABS.WATERMARK;
      default:
        return FilerobotImageEditor.TABS.ADJUST;
    }
  });
  const defaultTabId = (() => {
    switch (defaultTab) {
      case "Adjust":
        return FilerobotImageEditor.TABS.ADJUST;
      case "Filters":
        return FilerobotImageEditor.TABS.FILTERS;
      case "Finetune":
        return FilerobotImageEditor.TABS.FINETUNE;
      case "Resize":
        return FilerobotImageEditor.TABS.RESIZE;
      case "Annotate":
        return FilerobotImageEditor.TABS.ANNOTATE;
      case "Watermark":
        return FilerobotImageEditor.TABS.WATERMARK;
      default:
        return FilerobotImageEditor.TABS.ADJUST;
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
  const editorContent = /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: "image-editor-overlay",
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        backgroundColor: "#1a1a1a"
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        FilerobotImageEditor__default.default,
        {
          source: src,
          onSave: handleSave,
          onClose,
          tabsIds,
          defaultTabId,
          defaultToolId: FilerobotImageEditor.TOOLS.CROP,
          savingPixelRatio: 4,
          previewPixelRatio: window.devicePixelRatio,
          Crop: cropConfig,
          Rotate: {
            componentType: "slider"
          },
          Text: { text: "" }
        }
      )
    }
  );
  if (!mounted) {
    return null;
  }
  return reactDom.createPortal(editorContent, document.body);
}
var init_ImageEditor2 = __esm({
  "src/components/ImageEditor.tsx"() {
    init_ImageEditor();
  }
});
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
  const compressedFile = await imageCompression__default.default(file, {
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
  const [crop, setCrop] = React.useState({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = React.useState(null);
  const imgRef = React.useRef(null);
  const handleCropChange = React.useCallback((c) => {
    setCrop(c);
  }, []);
  const handleCropComplete = React.useCallback((c) => {
    setCompletedCrop(c);
  }, []);
  const getCroppedImage = React.useCallback(async () => {
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
  const handleConfirm = React.useCallback(async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  }, [getCroppedImage, onCropComplete]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "image-cropper", children: [
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "image-cropper__container", children: /* @__PURE__ */ jsxRuntime.jsx(
      ReactCrop__default.default,
      {
        crop,
        onChange: handleCropChange,
        onComplete: handleCropComplete,
        aspect: aspectRatio,
        children: /* @__PURE__ */ jsxRuntime.jsx(
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
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "image-cropper__actions", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "image-cropper__button image-cropper__button--cancel",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
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
if (typeof window !== "undefined") {
  window.React = React__default.default;
}
function ImageEditorLazy(props) {
  const [EditorComponent, setEditorComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.React = React__default.default;
    Promise.resolve().then(() => (init_ImageEditor2(), ImageEditor_exports)).then((mod) => {
      setEditorComponent(() => mod.ImageEditor);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load ImageEditor:", err);
      setError("Failed to load image editor");
      setLoading(false);
    });
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
      height: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1a1a1a",
      color: "#fff"
    }, children: /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { style: {
        width: "40px",
        height: "40px",
        border: "3px solid #333",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px"
      } }),
      /* @__PURE__ */ jsxRuntime.jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: "Loading editor..." })
    ] }) });
  }
  if (error || !EditorComponent) {
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: {
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#fee",
      color: "#c00",
      borderRadius: "8px"
    }, children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: error || "Failed to load editor" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          onClick: props.onClose,
          style: {
            marginTop: "10px",
            padding: "8px 16px",
            cursor: "pointer"
          },
          children: "Close"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(EditorComponent, { ...props });
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
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [progress, setProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const processFile = React.useCallback(
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
  const handleFileSelect = React.useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );
  const handleDragOver = React.useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = React.useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);
  const handleDrop = React.useCallback(
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
  const handleEditorSave = React.useCallback((blob, fileName) => {
    const editedFile = new File([blob], fileName || selectedFile?.name || "edited.jpg", {
      type: blob.type || "image/jpeg"
    });
    setSelectedFile(editedFile);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsEditorOpen(false);
  }, [selectedFile]);
  const handleEditorClose = React.useCallback(() => {
    setIsEditorOpen(false);
  }, []);
  const handleCropComplete = React.useCallback((croppedBlob) => {
    handleEditorSave(croppedBlob, selectedFile?.name || "cropped.jpg");
  }, [handleEditorSave, selectedFile]);
  const handleCropCancel = React.useCallback(() => {
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
  const handleUpload = React.useCallback(async () => {
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
  const handleReset = React.useCallback(() => {
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
    return /* @__PURE__ */ jsxRuntime.jsx(
      ImageEditorLazy,
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
    return /* @__PURE__ */ jsxRuntime.jsx(
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
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "s3-uploader", children: [
    enableDragDrop && /* @__PURE__ */ jsxRuntime.jsxs(
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
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: dropZoneIconStyle, children: isDragOver ? "\u{1F4E5}" : "\u{1F4C1}" }),
          /* @__PURE__ */ jsxRuntime.jsx("p", { style: dropZoneTextStyle, children: isDragOver ? "Drop to upload" : "Drag & drop image here, or click to select" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "s3-uploader__input-container", children: [
      /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "file-input", className: "s3-uploader__label", children: "Select File" }),
      /* @__PURE__ */ jsxRuntime.jsx(
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
    previewUrl && !isEditorOpen && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "s3-uploader__preview", children: /* @__PURE__ */ jsxRuntime.jsx(
      "img",
      {
        src: previewUrl,
        alt: "Preview",
        className: "s3-uploader__preview-image",
        style: { maxWidth: "200px", maxHeight: "200px" }
      }
    ) }),
    errorMessage && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "s3-uploader__error", role: "alert", children: errorMessage }),
    status === "uploading" || status === "compressing" ? /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "s3-uploader__progress", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
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
      /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "s3-uploader__progress-text", children: [
        progress,
        "%"
      ] })
    ] }) : null,
    status === "success" && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "s3-uploader__success", role: "status", children: "Upload complete!" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "s3-uploader__actions", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: handleUpload,
          disabled: !selectedFile || status === "uploading" || status === "compressing",
          className: "s3-uploader__button s3-uploader__button--upload",
          children: "Upload"
        }
      ),
      (selectedFile || status === "success" || status === "error") && /* @__PURE__ */ jsxRuntime.jsx(
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

Object.defineProperty(exports, "TABS", {
  enumerable: true,
  get: function () { return FilerobotImageEditor.TABS; }
});
Object.defineProperty(exports, "TOOLS", {
  enumerable: true,
  get: function () { return FilerobotImageEditor.TOOLS; }
});
exports.ImageCropper = ImageCropper;
exports.ImageEditor = ImageEditorLazy;
exports.S3Uploader = S3Uploader;
exports.compressImage = compressImage;
exports.deleteObject = deleteObject;
exports.listObjects = listObjects;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map