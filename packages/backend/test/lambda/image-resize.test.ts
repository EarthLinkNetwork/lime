/**
 * AC5: CloudFrontリサイズテスト - ?w=100を付与してアクセスした際、元画像ではなくリサイズ画像が返ること
 */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Mock S3 Client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  GetObjectCommand: jest.fn().mockImplementation((params) => params),
}));

// Mock sharp
const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  composite: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image-data')),
  metadata: jest.fn().mockResolvedValue({ width: 1920, height: 1080 }),
};

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => mockSharpInstance);
});

// Set env before importing handler
process.env.BUCKET_NAME = 'test-bucket';

// Import handler after mocks
import { handler } from '../../lambda/image-resize/index';

describe('Image Resize Lambda', () => {
  const createEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: 'GET /{proxy+}',
    rawPath: '/uploads/test-image.jpg',
    rawQueryString: 'w=100',
    headers: {},
    queryStringParameters: {
      w: '100',
    },
    pathParameters: {
      proxy: 'uploads/test-image.jpg',
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api-id',
      domainName: 'test.cloudfront.net',
      domainPrefix: 'test',
      http: {
        method: 'GET',
        path: '/uploads/test-image.jpg',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      requestId: 'test-request-id',
      routeKey: 'GET /{proxy+}',
      stage: '$default',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
    },
    isBase64Encoded: false,
    ...overrides,
  });

  // Helper to create a readable stream from buffer
  const createMockStream = (data: Buffer) => {
    const { Readable } = require('stream');
    return Readable.from([data]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock S3 response
    mockSend.mockResolvedValue({
      Body: createMockStream(Buffer.from('original-image-data')),
    });
  });

  describe('AC5: CloudFront Resize - ?w=100 returns resized image', () => {
    it('?w=100を付与した場合、リサイズ処理が実行されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(100, undefined, expect.any(Object));
    });

    it('リサイズ後の画像がBase64エンコードで返されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      expect(result.isBase64Encoded).toBe(true);
      expect(result.headers?.['Content-Type']).toBe('image/webp');
    });

    it('幅と高さの両方が指定された場合、両方がresizeに渡されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', h: '200' },
      });

      await handler(event);

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(100, 200, expect.any(Object));
    });

    it('リサイズパラメータがない場合、302リダイレクトが返されること', async () => {
      const event = createEvent({
        queryStringParameters: {},
        rawQueryString: '',
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(302);
      expect(result.headers?.Location).toContain('test-bucket');
    });

    it('キャッシュヘッダーが設定されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Cache-Control']).toBe('public, max-age=31536000');
    });

    it('S3からGetObjectCommandで元画像を取得すること', async () => {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const event = createEvent({
        queryStringParameters: { w: '100' },
      });

      await handler(event);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'uploads/test-image.jpg',
      });
    });

    it('品質パラメータが指定された場合、webpに渡されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', q: '90' },
      });

      await handler(event);

      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 90 });
    });

    it('角丸パラメータが指定された場合、compositeが呼ばれること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', r: '10' },
      });

      await handler(event);

      expect(mockSharpInstance.composite).toHaveBeenCalled();
    });

    it('角丸パラメータが指定された場合、デフォルトでPNG形式が返されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', r: '10' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Content-Type']).toBe('image/png');
      expect(mockSharpInstance.png).toHaveBeenCalled();
    });

    it('フォーマットパラメータf=jpegが指定された場合、JPEG形式が返されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', f: 'jpeg' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Content-Type']).toBe('image/jpeg');
      expect(mockSharpInstance.jpeg).toHaveBeenCalled();
    });

    it('フォーマットパラメータf=pngが指定された場合、PNG形式が返されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', f: 'png' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Content-Type']).toBe('image/png');
      expect(mockSharpInstance.png).toHaveBeenCalled();
    });

    it('フォーマットパラメータf=webpが指定された場合、WebP形式が返されること', async () => {
      const event = createEvent({
        queryStringParameters: { w: '100', f: 'webp' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.headers?.['Content-Type']).toBe('image/webp');
      expect(mockSharpInstance.webp).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('S3エラー時に500を返すこと', async () => {
      mockSend.mockRejectedValue(new Error('S3 Error'));

      const event = createEvent({
        queryStringParameters: { w: '100' },
      });

      const result = await handler(event) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: 'Image processing failed',
      });
    });
  });
});
