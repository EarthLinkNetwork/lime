import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageCropper } from '../ImageCropper';

// Mock react-image-crop
vi.mock('react-image-crop', () => ({
  default: ({ crop, onChange, children }: any) => (
    <div data-testid="react-crop" onClick={() => onChange({ x: 10, y: 10, width: 100, height: 100 })}>
      {children}
    </div>
  ),
}));

describe('ImageCropper', () => {
  const mockOnCropComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const testImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('画像が表示されること', () => {
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

  it('クロップ領域の選択ができること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    expect(cropArea).toBeInTheDocument();
  });

  it('キャンセルボタンがキャンセルコールバックを呼ぶこと', () => {
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
  });

  it('確定ボタンが存在すること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /crop|切り抜き|confirm|確定/i });
    expect(confirmButton).toBeInTheDocument();
  });

  it('アスペクト比が設定できること', () => {
    render(
      <ImageCropper
        src={testImageSrc}
        onCropComplete={mockOnCropComplete}
        onCancel={mockOnCancel}
        aspectRatio={16 / 9}
      />
    );

    const cropArea = screen.getByTestId('react-crop');
    expect(cropArea).toBeInTheDocument();
  });
});
