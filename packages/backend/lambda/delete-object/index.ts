import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
const VALID_API_KEYS = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

interface RequestBody {
  key: string;
}

// CORS headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // API Key validation
    const apiKey = event.headers['x-api-key'];
    if (!apiKey) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: API Key required' }),
      };
    }

    if (VALID_API_KEYS.length > 0 && !VALID_API_KEYS.includes(apiKey)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Invalid API Key' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body: RequestBody = JSON.parse(event.body);
    const { key } = body;

    if (!key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'key is required' }),
      };
    }

    // Validate key format: must have at least projectCode/ownerKey/file
    const parts = key.split('/');
    if (parts.length < 3) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid key format: must contain at least projectCode/ownerKey/file' }),
      };
    }

    // Delete object from S3
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        deleted: true,
        key,
      }),
    };
  } catch (error) {
    console.error('Error deleting object:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
