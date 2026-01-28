import { S3Client, ListObjectsV2Command, GetObjectTaggingCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;
const VALID_API_KEYS = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

const DEFAULT_LIMIT = 50;

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

    if (VALID_API_KEYS.length > 0 && !VALID_API_KEYS.includes(apiKey)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: Invalid API Key' }),
      };
    }

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const { projectCode, ownerKey, folder, limit, cursor, includeTags } = params;

    if (!projectCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'projectCode is required' }),
      };
    }

    // Build prefix
    let prefix = `${projectCode}/`;
    if (ownerKey) {
      prefix += `${ownerKey}/`;
      if (folder) {
        prefix += `${folder}/`;
      }
    }

    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: limit ? parseInt(limit, 10) : DEFAULT_LIMIT,
      ContinuationToken: cursor || undefined,
    });

    const listResult = await s3Client.send(listCommand);

    const contents = listResult.Contents || [];

    // Build objects array
    const objects = await Promise.all(
      contents.map(async (item) => {
        const obj: Record<string, unknown> = {
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified?.toISOString(),
        };

        // Fetch tags if requested
        if (includeTags === 'true' && item.Key) {
          const taggingCommand = new GetObjectTaggingCommand({
            Bucket: BUCKET_NAME,
            Key: item.Key,
          });
          const taggingResult = await s3Client.send(taggingCommand);
          const tags: Record<string, string> = {};
          for (const tag of taggingResult.TagSet || []) {
            if (tag.Key && tag.Value) {
              tags[tag.Key] = tag.Value;
            }
          }
          obj.tags = tags;
        }

        return obj;
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objects,
        nextCursor: listResult.IsTruncated ? listResult.NextContinuationToken : null,
      }),
    };
  } catch (error) {
    console.error('Error listing objects:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
