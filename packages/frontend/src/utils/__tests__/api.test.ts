/**
 * API Client テスト
 * Task 9: フロントエンド API クライアント（削除・一覧）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteObject, listObjects } from '../api';

global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('deleteObject', () => {
    it('正しいendpoint, method, headers, bodyでリクエストすること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted: true, key: 'berry/user-123/uploads/abc.jpg' }),
      });

      await deleteObject({
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        key: 'berry/user-123/uploads/abc.jpg',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/objects',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': 'test-key',
          },
          body: JSON.stringify({ key: 'berry/user-123/uploads/abc.jpg' }),
        }
      );
    });

    it('正常レスポンスを返すこと', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted: true, key: 'berry/user-123/uploads/abc.jpg' }),
      });

      const result = await deleteObject({
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        key: 'berry/user-123/uploads/abc.jpg',
      });

      expect(result).toEqual({ deleted: true, key: 'berry/user-123/uploads/abc.jpg' });
    });

    it('エラー時に例外を投げること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(
        deleteObject({
          apiEndpoint: 'https://api.example.com',
          apiKey: 'test-key',
          key: 'berry/user-123/uploads/abc.jpg',
        })
      ).rejects.toThrow('Failed to delete object: 403');
    });
  });

  describe('listObjects', () => {
    it('正しいendpoint, query params, headersでリクエストすること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ objects: [], nextCursor: null }),
      });

      await listObjects({
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        projectCode: 'berry',
      });

      const call = (global.fetch as any).mock.calls[0];
      const url = new URL(call[0]);
      expect(url.origin + url.pathname).toBe('https://api.example.com/objects');
      expect(url.searchParams.get('projectCode')).toBe('berry');
      expect(call[1].headers['X-Api-Key']).toBe('test-key');
    });

    it('ownerKey, folder, limit, cursor, includeTagsがクエリパラメータに含まれること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ objects: [], nextCursor: null }),
      });

      await listObjects({
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        projectCode: 'berry',
        ownerKey: 'user-123',
        folder: 'avatars',
        limit: 25,
        cursor: 'token-abc',
        includeTags: true,
      });

      const call = (global.fetch as any).mock.calls[0];
      const url = new URL(call[0]);
      expect(url.searchParams.get('ownerKey')).toBe('user-123');
      expect(url.searchParams.get('folder')).toBe('avatars');
      expect(url.searchParams.get('limit')).toBe('25');
      expect(url.searchParams.get('cursor')).toBe('token-abc');
      expect(url.searchParams.get('includeTags')).toBe('true');
    });

    it('レスポンスが正しい型で返ること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            objects: [
              { key: 'berry/user-123/uploads/abc.jpg', size: 12345, lastModified: '2025-01-01T00:00:00Z' },
            ],
            nextCursor: 'next-token',
          }),
      });

      const result = await listObjects({
        apiEndpoint: 'https://api.example.com',
        apiKey: 'test-key',
        projectCode: 'berry',
      });

      expect(result.objects).toHaveLength(1);
      expect(result.objects[0].key).toBe('berry/user-123/uploads/abc.jpg');
      expect(result.objects[0].size).toBe(12345);
      expect(result.nextCursor).toBe('next-token');
    });

    it('エラー時に例外を投げること', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(
        listObjects({
          apiEndpoint: 'https://api.example.com',
          apiKey: 'test-key',
          projectCode: 'berry',
        })
      ).rejects.toThrow('Failed to list objects: 400');
    });
  });
});
