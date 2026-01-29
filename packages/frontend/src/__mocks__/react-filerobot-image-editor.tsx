import React from 'react';

// Mock TABS enum
export const TABS = {
  ADJUST: 'Adjust',
  FILTERS: 'Filters',
  FINETUNE: 'Finetune',
  RESIZE: 'Resize',
  ANNOTATE: 'Annotate',
  WATERMARK: 'Watermark',
} as const;

// Mock TOOLS enum
export const TOOLS = {
  CROP: 'Crop',
  ROTATE: 'Rotate',
  FLIP_X: 'Flip_X',
  FLIP_Y: 'Flip_Y',
  BRIGHTNESS: 'Brightness',
  CONTRAST: 'Contrast',
  HSV: 'HSV',
  BLUR: 'Blur',
  TEXT: 'Text',
  IMAGE: 'Image',
  RECT: 'Rect',
  ELLIPSE: 'Ellipse',
  POLYGON: 'Polygon',
  PEN: 'Pen',
  LINE: 'Line',
  ARROW: 'Arrow',
} as const;

interface MockEditorProps {
  source: string;
  onSave?: (editedImageObject: { imageBase64?: string; fullName?: string; mimeType?: string }) => void;
  onClose?: () => void;
  [key: string]: unknown;
}

// Mock FilerobotImageEditor component
export default function FilerobotImageEditor({ source, onSave, onClose }: MockEditorProps) {
  return React.createElement('div', {
    'data-testid': 'mock-filerobot-image-editor',
    'data-source': source,
    onClick: () => {
      if (onSave) {
        onSave({
          imageBase64: 'data:image/jpeg;base64,mockBase64Data',
          fullName: 'edited-image.jpg',
          mimeType: 'image/jpeg',
        });
      }
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
  }, 'Mock Image Editor');
}
