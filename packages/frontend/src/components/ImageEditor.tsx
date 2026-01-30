import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create a dedicated portal container to avoid conflicts
    const container = document.createElement('div');
    container.id = 'lime-image-editor-portal';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999;';
    document.body.appendChild(container);
    setPortalContainer(container);

    // Cleanup on unmount
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
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

  // Wait for portal container to be ready
  if (!portalContainer) {
    return null;
  }

  const editorContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      {/* Editor modal */}
      <div
        className="image-editor-modal"
        style={{
          width: '90vw',
          height: '90vh',
          maxWidth: '1400px',
          maxHeight: '900px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
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
    </div>
  );

  // Use portal to render outside of any parent transform context
  return createPortal(editorContent, portalContainer);
}

export { TABS, TOOLS };
