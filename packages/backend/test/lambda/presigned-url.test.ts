/**
 * AC1: API Key検証テスト - 有効なAPI Keyがないリクエストは403 Forbiddenを返すこと
 * AC2: Lambda putObject権限テスト - S3のputObject権限を持つ署名付きURLを正常に発行すること
 */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Mock AWS SDK
const mockGetSignedUrl = jest.fn().mockResolvedValue('https://s3.example.com/presigned-url');
const mockS3Client = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => mockS3Client),
  PutObjectCommand: jest.fn().mockImplementation((params) => params),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

// Set env before importing handler
process.env.BUCKET_NAME = 'test-bucket';
process.env.VALID_API_KEYS = ''; // Empty = accept any key (development mode)

// Import handler after mocks
import { handler } from '../../lambda/presigned-url/index';

describe('Presigned URL Lambda', () => {
  const createEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'POST /presigned-url',
    rawPath: '/presigned-url',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'valid-api-key',
      ...overrides.headers,
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api-id',
      domainName: 'test.execute-api.ap-northeast-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/presigned-url',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      requestId: 'test-request-id',
      routeKey: 'POST /presigned-url',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    body: JSON.stringify({
      fileName: 'test.jpg',
      contentType: 'image/jpeg',
      projectCode: 'berry',
      ownerKey: 'user-123',
    }),
    isBase64Encoded: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC1: API Key Validation - 403 Forbidden', () => {
    it('API Keyがない場合、403 Forbiddenを返すこと', async () => {
      const event = createEvent({
        headers: {
          'content-type': 'application/json',
          // x-api-key is missing
        },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'Forbidden: API Key required',
      });
    });

    it('API Keyが空文字の場合、403 Forbiddenを返すこと', async () => {
      const event = createEvent({
        headers: {
          'content-type': 'application/json',
          'x-api-key': '',
        },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(403);
    });

    it('有効なAPI Keyがある場合、403を返さないこと', async () => {
      const event = createEvent();

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).not.toBe(403);
    });
  });

  describe('AC2: Presigned URL Generation with putObject permission', () => {
    it('正常なリクエストで署名付きURLを発行すること', async () => {
      const event = createEvent();

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toHaveProperty('uploadUrl');
      expect(body).toHaveProperty('key');
      expect(body).toHaveProperty('fileUrl');
    });

    it('PutObjectCommandがS3バケットとキーで呼ばれること', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const event = createEvent();

      await handler(event);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'berry/user-123/uploads/test-uuid-1234.jpg',
          ContentType: 'image/jpeg',
        })
      );
    });

    it('getSignedUrlがPUT用に呼ばれること', async () => {
      const event = createEvent();

      await handler(event);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Bucket: 'test-bucket',
          ContentType: 'image/jpeg',
        }),
        { expiresIn: 3600 }
      );
    });

    it('カスタムフォルダが指定された場合、そのフォルダにキーが生成されること', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          projectCode: 'berry',
          ownerKey: 'user-123',
          folder: 'custom-folder',
        }),
      });

      await handler(event);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'berry/user-123/custom-folder/test-uuid-1234.jpg',
        })
      );
    });
  });

  describe('Validation', () => {
    it('リクエストボディがない場合、400を返すこと', async () => {
      const event = createEvent({ body: undefined });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'Request body is required',
      });
    });

    it('fileNameがない場合、400を返すこと', async () => {
      const event = createEvent({
        body: JSON.stringify({ contentType: 'image/jpeg' }),
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'fileName and contentType are required',
      });
    });

    it('contentTypeがない場合、400を返すこと', async () => {
      const event = createEvent({
        body: JSON.stringify({ fileName: 'test.jpg', projectCode: 'berry', ownerKey: 'user-123' }),
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('projectCodeがない場合、400を返すこと', async () => {
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          ownerKey: 'user-123',
        }),
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'projectCode and ownerKey are required',
      });
    });

    it('ownerKeyがない場合、400を返すこと', async () => {
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          projectCode: 'berry',
        }),
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'projectCode and ownerKey are required',
      });
    });
  });

  describe('v2: Key structure with projectCode/ownerKey', () => {
    it('キーが {projectCode}/{ownerKey}/{folder}/{UUID}.{ext} 形式で生成されること', async () => {
      const event = createEvent();

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.key).toBe('berry/user-123/uploads/test-uuid-1234.jpg');
    });

    it('folder未指定時はデフォルト uploads が使われること', async () => {
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          projectCode: 'sakura',
          ownerKey: 'team-abc',
        }),
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      const body = JSON.parse(result.body as string);
      expect(body.key).toBe('sakura/team-abc/uploads/test-uuid-1234.jpg');
    });
  });

  describe('v2: S3 Object Tagging', () => {
    it('tags未指定でもアップロードが成功すること', async () => {
      const event = createEvent();

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
    });

    it('tags指定時にPutObjectCommandのTaggingパラメータにタグが含まれること', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          projectCode: 'berry',
          ownerKey: 'user-123',
          tags: { category: 'avatar', status: 'active' },
        }),
      });

      await handler(event);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Tagging: 'category=avatar&status=active',
        })
      );
    });

    it('複数タグが正しくエンコードされること', async () => {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const event = createEvent({
        body: JSON.stringify({
          fileName: 'test.jpg',
          contentType: 'image/jpeg',
          projectCode: 'berry',
          ownerKey: 'user-123',
          tags: { a: '1', b: '2', c: '3' },
        }),
      });

      await handler(event);

      const call = PutObjectCommand.mock.calls[0][0];
      expect(call.Tagging).toContain('a=1');
      expect(call.Tagging).toContain('b=2');
      expect(call.Tagging).toContain('c=3');
    });
  });
});
