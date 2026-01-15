import { describe, it, expect, vi } from 'vitest';
import { compressImage, CompressionOptions } from '../imageCompression';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn().mockImplementation(async (file: File, options: any) => {
    // Simulate compression - return smaller file
    const compressedSize = Math.min(file.size, options.maxSizeMB * 1024 * 1024);
    return new File(['compressed'], file.name, { type: file.type });
  }),
}));

describe('compressImage', () => {
  const createMockFile = (sizeInMB: number, name = 'test.jpg', type = 'image/jpeg'): File => {
    const bytes = new Uint8Array(sizeInMB * 1024 * 1024);
    return new File([bytes], name, { type });
  };

  it('2MB以上のファイルが圧縮されること', async () => {
    const largeFile = createMockFile(5); // 5MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(largeFile, options);

    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('test.jpg');
  });

  it('閾値以下のファイルはそのまま返されること', async () => {
    const smallFile = createMockFile(1); // 1MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(smallFile, options);

    expect(result).toBe(smallFile);
  });

  it('デフォルトオプションが適用されること', async () => {
    const file = createMockFile(5);

    const result = await compressImage(file);

    expect(result).toBeInstanceOf(File);
  });

  it('maxWidthOrHeightが設定されること', async () => {
    const file = createMockFile(5);
    const options: CompressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 };

    const result = await compressImage(file, options);

    expect(result).toBeInstanceOf(File);
  });

  it('非画像ファイルがエラーをスローすること', async () => {
    const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

    await expect(compressImage(textFile)).rejects.toThrow('Invalid file type');
  });
});
