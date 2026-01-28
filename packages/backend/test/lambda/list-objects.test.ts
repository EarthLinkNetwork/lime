/**
 * List Objects Lambda テスト
 * Task 4: 一覧取得 API
 */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Mock AWS SDK
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  ListObjectsV2Command: jest.fn().mockImplementation((params) => ({ ...params, _type: 'ListObjectsV2' })),
  GetObjectTaggingCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'GetObjectTagging' })),
}));

// Set env before importing handler
process.env.BUCKET_NAME = 'test-bucket';
process.env.VALID_API_KEYS = '';

// Import handler after mocks
import { handler } from '../../lambda/list-objects/index';

describe('List Objects Lambda', () => {
  const createEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'GET /objects',
    rawPath: '/objects',
    rawQueryString: 'projectCode=berry',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'valid-api-key',
      ...overrides.headers,
    },
    queryStringParameters: {
      projectCode: 'berry',
      ...overrides.queryStringParameters,
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api-id',
      domainName: 'test.execute-api.ap-northeast-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'GET',
        path: '/objects',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      requestId: 'test-request-id',
      routeKey: 'GET /objects',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    body: undefined,
    isBase64Encoded: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  describe('API Key Validation', () => {
    it('API Keyがない場合、403を返すこと', async () => {
      const event = createEvent({
        headers: { 'content-type': 'application/json' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
    });
  });

  describe('Validation', () => {
    it('projectCode未指定で400を返すこと', async () => {
      const event = createEvent({
        queryStringParameters: {},
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'projectCode is required',
      });
    });
  });

  describe('List Operation', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({
        Contents: [
          {
            Key: 'berry/user-123/uploads/abc.jpg',
            Size: 12345,
            LastModified: new Date('2025-01-01T00:00:00Z'),
          },
          {
            Key: 'berry/user-123/uploads/def.png',
            Size: 67890,
            LastModified: new Date('2025-01-02T00:00:00Z'),
          },
        ],
        IsTruncated: false,
        NextContinuationToken: undefined,
      });
    });

    it('正常リクエストでListObjectsV2Commandがprojectcode prefixで呼ばれること', async () => {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const event = createEvent();

      await handler(event);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Prefix: 'berry/',
        })
      );
    });

    it('ownerKey指定でprefixが{projectCode}/{ownerKey}/になること', async () => {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const event = createEvent({
        queryStringParameters: {
          projectCode: 'berry',
          ownerKey: 'user-123',
        },
      });

      await handler(event);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          Prefix: 'berry/user-123/',
        })
      );
    });

    it('folder指定でprefixが{projectCode}/{ownerKey}/{folder}/になること', async () => {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const event = createEvent({
        queryStringParameters: {
          projectCode: 'berry',
          ownerKey: 'user-123',
          folder: 'avatars',
        },
      });

      await handler(event);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          Prefix: 'berry/user-123/avatars/',
        })
      );
    });

    it('limitパラメータがMaxKeysに渡されること', async () => {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const event = createEvent({
        queryStringParameters: {
          projectCode: 'berry',
          limit: '25',
        },
      });

      await handler(event);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          MaxKeys: 25,
        })
      );
    });

    it('cursorパラメータがContinuationTokenに渡されること', async () => {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      const event = createEvent({
        queryStringParameters: {
          projectCode: 'berry',
          cursor: 'some-token',
        },
      });

      await handler(event);

      expect(ListObjectsV2Command).toHaveBeenCalledWith(
        expect.objectContaining({
          ContinuationToken: 'some-token',
        })
      );
    });

    it('レスポンスにobjects配列とnextCursorが含まれること', async () => {
      const event = createEvent();

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.objects).toHaveLength(2);
      expect(body.objects[0]).toEqual({
        key: 'berry/user-123/uploads/abc.jpg',
        size: 12345,
        lastModified: '2025-01-01T00:00:00.000Z',
      });
      expect(body.nextCursor).toBeNull();
    });

    it('ページネーションのnextCursorが返されること', async () => {
      mockSend.mockResolvedValue({
        Contents: [
          { Key: 'berry/user-123/uploads/abc.jpg', Size: 100, LastModified: new Date() },
        ],
        IsTruncated: true,
        NextContinuationToken: 'next-token-123',
      });

      const event = createEvent();
      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      const body = JSON.parse(result.body as string);
      expect(body.nextCursor).toBe('next-token-123');
    });

    it('includeTags=true時にタグが取得されること', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [
            { Key: 'berry/user-123/uploads/abc.jpg', Size: 100, LastModified: new Date('2025-01-01') },
          ],
          IsTruncated: false,
        })
        .mockResolvedValueOnce({
          TagSet: [
            { Key: 'category', Value: 'avatar' },
            { Key: 'status', Value: 'active' },
          ],
        });

      const event = createEvent({
        queryStringParameters: {
          projectCode: 'berry',
          includeTags: 'true',
        },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      const body = JSON.parse(result.body as string);
      expect(body.objects[0].tags).toEqual({
        category: 'avatar',
        status: 'active',
      });
    });
  });
});
