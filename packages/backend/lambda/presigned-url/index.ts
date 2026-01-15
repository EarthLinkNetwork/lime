import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
const VALID_API_KEYS = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

interface RequestBody {
  fileName: string;
  contentType: string;
  folder?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // API Key validation
    const apiKey = event.headers['x-api-key'];
    if (!apiKey) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: API Key required' }),
      };
    }

    // Validate API Key against allowed keys (if configured)
    // If VALID_API_KEYS is empty, accept any key (for development)
    if (VALID_API_KEYS.length > 0 && !VALID_API_KEYS.includes(apiKey)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: Invalid API Key' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body: RequestBody = JSON.parse(event.body);
    const { fileName, contentType, folder = 'uploads' } = body;

    if (!fileName || !contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'fileName and contentType are required' }),
      };
    }

    // Generate unique key
    const extension = fileName.split('.').pop();
    const key = `${folder}/${randomUUID()}.${extension}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUrl,
        key,
        fileUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
