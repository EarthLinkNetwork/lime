/**
 * AC3: 画像圧縮テスト - 5MB以上の画像を選択した際、設定された閾値（例: 2MB）以下に圧縮されること
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage, CompressionOptions } from '../imageCompression';

// Create a more realistic mock that simulates actual compression behavior
vi.mock('browser-image-compression', () => ({
  default: vi.fn().mockImplementation(async (file: File, options: any) => {
    const targetSize = (options.maxSizeMB || 2) * 1024 * 1024;
    // Simulate compression - file is reduced to target size
    const compressedContent = new Uint8Array(Math.min(file.size, Math.floor(targetSize * 0.8)));
    return new File([compressedContent], file.name, { type: file.type });
  }),
}));

describe('AC3: Image Compression - 5MB以上を2MB以下に圧縮', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createLargeFile = (sizeInMB: number, name = 'large-image.jpg', type = 'image/jpeg'): File => {
    // Create a file with actual size
    const bytes = new Uint8Array(Math.floor(sizeInMB * 1024 * 1024));
    return new File([bytes], name, { type });
  };

  it('5MB以上の画像が圧縮されること', async () => {
    const largeFile = createLargeFile(5); // 5MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(largeFile, options);

    // Verify compression occurred
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('large-image.jpg');
  });

  it('7MB画像が2MB閾値で圧縮され、出力が元より小さくなること', async () => {
    const largeFile = createLargeFile(7); // 7MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(largeFile, options);

    // The mock simulates compression to 80% of target (1.6MB)
    expect(result.size).toBeLessThan(largeFile.size);
    expect(result.size).toBeLessThanOrEqual(2 * 1024 * 1024);
  });

  it('10MB画像でも2MB以下に圧縮されること', async () => {
    const veryLargeFile = createLargeFile(10); // 10MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(veryLargeFile, options);

    expect(result.size).toBeLessThanOrEqual(2 * 1024 * 1024);
  });

  it('閾値未満のファイル（1MB）は圧縮せずにそのまま返すこと', async () => {
    const smallFile = createLargeFile(1); // 1MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(smallFile, options);

    // File should be returned as-is
    expect(result).toBe(smallFile);
    expect(result.size).toBe(smallFile.size);
  });

  it('閾値ちょうど（2MB）のファイルは圧縮しないこと', async () => {
    const exactFile = createLargeFile(2); // 2MB file
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(exactFile, options);

    // File should be returned as-is since it's at the threshold
    expect(result).toBe(exactFile);
  });

  it('カスタム閾値（1MB）で5MB画像が圧縮されること', async () => {
    const largeFile = createLargeFile(5); // 5MB file
    const options: CompressionOptions = { maxSizeMB: 1 };

    const result = await compressImage(largeFile, options);

    expect(result.size).toBeLessThanOrEqual(1 * 1024 * 1024);
  });

  it('PNG画像も圧縮対象であること', async () => {
    const pngFile = createLargeFile(5, 'large-image.png', 'image/png');
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(pngFile, options);

    expect(result).toBeInstanceOf(File);
    expect(result.size).toBeLessThan(pngFile.size);
  });

  it('WebP画像も圧縮対象であること', async () => {
    const webpFile = createLargeFile(5, 'large-image.webp', 'image/webp');
    const options: CompressionOptions = { maxSizeMB: 2 };

    const result = await compressImage(webpFile, options);

    expect(result).toBeInstanceOf(File);
    expect(result.size).toBeLessThan(webpFile.size);
  });

  it('maxWidthOrHeightオプションが圧縮ライブラリに渡されること', async () => {
    const browserImageCompression = await import('browser-image-compression');
    const largeFile = createLargeFile(5);
    const options: CompressionOptions = { maxSizeMB: 2, maxWidthOrHeight: 1920 };

    await compressImage(largeFile, options);

    expect(browserImageCompression.default).toHaveBeenCalledWith(
      largeFile,
      expect.objectContaining({
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
      })
    );
  });
});
