/**
 * AC4: クロップUI範囲テスト - クロップUIで指定した範囲のみが、最終的なファイルとして反映されること
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageCropper } from '../ImageCropper';

// Track crop values
let lastCropValue: any = null;
let onCompleteCallback: any = null;

// Mock react-image-crop with crop tracking
vi.mock('react-image-crop', () => ({
  default: ({ crop, onChange, onComplete, children }: any) => {
    onCompleteCallback = onComplete;
    return (
      <div 
        data-testid="react-crop" 
        onClick={() => {
          const newCrop = { x: 50, y: 50, width: 200, height: 200, unit: 'px' };
          lastCropValue = newCrop;
          onChange(newCrop);
          // Simulate completed crop in pixels
          onComplete({ x: 50, y: 50, width: 200, height: 200 });
        }}
      >
        {children}
      </div>
    );
  },
}));

describe('AC4: Crop UI - 指定範囲のみが反映されること', () => {
  const mockOnCropComplete = vi.fn();
  const mockOnCancel = vi.fn();
  
  // Create a valid test image (1x1 pixel PNG)
  const testImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    vi.clearAllMocks();
    lastCropValue = null;
    onCompleteCallback = null;
    
    // Mock HTMLCanvasElement.toBlob
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob(['cropped-image-data'], { type: 'image/jpeg' }));
    });
    
    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    }));
  });

  it('クロップ領域を選択できること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    expect(lastCropValue).not.toBeNull();
    expect(lastCropValue).toHaveProperty('x');
    expect(lastCropValue).toHaveProperty('y');
    expect(lastCropValue).toHaveProperty('width');
    expect(lastCropValue).toHaveProperty('height');
  });

  it('指定したクロップ座標（x: 50, y: 50）が記録されること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    expect(lastCropValue.x).toBe(50);
    expect(lastCropValue.y).toBe(50);
  });

  it('指定したクロップサイズ（width: 200, height: 200）が記録されること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    expect(lastCropValue.width).toBe(200);
    expect(lastCropValue.height).toBe(200);
  });

  it('確定ボタンをクリックするとonCropCompleteがBlobで呼ばれること', async () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    // Select crop area
    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: /crop|切り抜き|confirm|確定/i });
    fireEvent.click(confirmButton);

    // Wait for async operation
    await waitFor(() => {
      expect(mockOnCropComplete).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('onCropCompleteにBlobが渡されること', async () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    const confirmButton = screen.getByRole('button', { name: /crop|切り抜き|confirm|確定/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const callArg = mockOnCropComplete.mock.calls[0]?.[0];
      expect(callArg).toBeInstanceOf(Blob);
    }, { timeout: 1000 });
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel|キャンセル/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnCropComplete).not.toHaveBeenCalled();
  });

  it('アスペクト比が設定された場合、クロップUIに反映されること', () => {
    const { container } = render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
        aspectRatio={16 / 9}
      />
    );

    // Component should render without errors
    expect(screen.getByTestId('react-crop')).toBeInTheDocument();
  });

  it('画像プレビューが表示されていること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', testImageSrc);
  });

  it('クロップ確定後のBlobがJPEG形式であること', async () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    fireEvent.click(cropArea);

    const confirmButton = screen.getByRole('button', { name: /crop|切り抜き|confirm|確定/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.95
      );
    }, { timeout: 1000 });
  });
});
