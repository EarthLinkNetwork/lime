import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import type { ImageEditorProps } from '../types';

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
    <div
      className="image-editor-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#1a1a1a',
      }}
    >
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
