import { useEffect } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import type { ImageEditorProps } from '../types';

// CSS to fix z-index issues and layout for react-filerobot-image-editor
const LIME_EDITOR_STYLES = `
/* Z-index fixes for dropdowns in modal contexts */
#SfxPopper {
  z-index: 999999 !important;
}
.FIE_crop-presets-menu {
  z-index: 999999 !important;
}
#SfxPopper .SfxMenu-root {
  pointer-events: auto !important;
}
#SfxPopper .SfxMenuItem-root {
  pointer-events: auto !important;
  cursor: pointer !important;
}
.FIE_topbar-zoom-menu {
  z-index: 999999 !important;
}
.SfxModal-Wrapper {
  z-index: 999998 !important;
}

/* Layout fixes for ImageEditor */
.lime-image-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.lime-image-editor-wrapper .FIE_root {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* Ensure the editor fills the container properly */
.lime-image-editor-wrapper > div {
  flex: 1;
  display: flex;
  min-height: 0;
}
`;

export function ImageEditor({
  src,
  onSave,
  onClose,
  defaultTab = 'Adjust',
  enabledTabs = ['Adjust', 'Filters', 'Finetune', 'Resize', 'Annotate'],
  cropPresets,
  aspectRatioLocked = false,
  defaultAspectRatio,
}: ImageEditorProps) {
  // Inject CSS to fix z-index issues and layout
  useEffect(() => {
    const styleId = 'lime-image-editor-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = LIME_EDITOR_STYLES;
      document.head.appendChild(style);
    }
    // Don't remove on unmount - other instances might still need it
  }, []);

  // Map string tab names to TABS enum
  const tabsIds = enabledTabs.map((tab) => {
    switch (tab) {
      case 'Adjust':
        return TABS.ADJUST;
      case 'Filters':
        return TABS.FILTERS;
      case 'Finetune':
        return TABS.FINETUNE;
      case 'Resize':
        return TABS.RESIZE;
      case 'Annotate':
        return TABS.ANNOTATE;
      case 'Watermark':
        return TABS.WATERMARK;
      default:
        return TABS.ADJUST;
    }
  });

  const defaultTabId = (() => {
    switch (defaultTab) {
      case 'Adjust':
        return TABS.ADJUST;
      case 'Filters':
        return TABS.FILTERS;
      case 'Finetune':
        return TABS.FINETUNE;
      case 'Resize':
        return TABS.RESIZE;
      case 'Annotate':
        return TABS.ANNOTATE;
      case 'Watermark':
        return TABS.WATERMARK;
      default:
        return TABS.ADJUST;
    }
  })();

  const handleSave = (editedImageObject: { imageBase64?: string; fullName?: string; mimeType?: string }) => {
    if (!editedImageObject.imageBase64) return;

    // Convert base64 to Blob
    const base64Data = editedImageObject.imageBase64.split(',')[1];
    const mimeType = editedImageObject.mimeType || 'image/jpeg';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    onSave(blob, editedImageObject.fullName || 'edited-image');
  };

  // Build crop presets configuration
  const cropConfig: Record<string, unknown> = {
    autoResize: true,
  };

  if (aspectRatioLocked && defaultAspectRatio) {
    cropConfig.ratio = defaultAspectRatio;
    cropConfig.noPresets = true;
  } else if (cropPresets && cropPresets.length > 0) {
    cropConfig.presetsItems = cropPresets.map((preset) => ({
      titleKey: preset.label,
      ratio: preset.ratio,
      width: preset.width,
      height: preset.height,
    }));
  }

  return (
    <div className="lime-image-editor-wrapper">
      <FilerobotImageEditor
        source={src}
        onSave={handleSave}
        onClose={onClose}
        tabsIds={tabsIds}
        defaultTabId={defaultTabId}
        defaultToolId={TOOLS.CROP}
        savingPixelRatio={4}
        previewPixelRatio={window.devicePixelRatio}
        Crop={cropConfig}
        Rotate={{
          componentType: 'slider',
        }}
        Text={{ text: '' }}
      />
    </div>
  );
}

export { TABS, TOOLS };
