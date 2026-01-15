import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import sharp from 'sharp';

const s3Client = new S3Client({});

type OutputFormat = 'webp' | 'png' | 'jpeg' | 'auto';

interface ResizeParams {
  width?: number;
  height?: number;
  radius?: number;
  quality?: number;
  format?: OutputFormat;
}

function parseQueryParams(queryParams: Record<string, string | undefined>): ResizeParams {
  const format = queryParams.f?.toLowerCase();
  return {
    width: queryParams.w ? parseInt(queryParams.w, 10) : undefined,
    height: queryParams.h ? parseInt(queryParams.h, 10) : undefined,
    radius: queryParams.r ? parseInt(queryParams.r, 10) : undefined,
    quality: queryParams.q ? parseInt(queryParams.q, 10) : 80,
    format: (format === 'webp' || format === 'png' || format === 'jpeg') ? format : 'auto',
  };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const bucketName = process.env.BUCKET_NAME;
    const key = event.pathParameters?.proxy || event.rawPath.replace(/^\//, '');

    if (!bucketName || !key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing bucket or key' }),
      };
    }

    const params = parseQueryParams(event.queryStringParameters || {});

    // If no resize parameters, return original
    if (!params.width && !params.height && !params.radius) {
      return {
        statusCode: 302,
        headers: {
          Location: `https://${bucketName}.s3.amazonaws.com/${key}`,
        },
        body: '',
      };
    }

    // Get original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(getCommand);
    const imageBuffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);

    // Process image with sharp
    let sharpInstance = sharp(imageBuffer);

    // Resize
    if (params.width || params.height) {
      sharpInstance = sharpInstance.resize(params.width, params.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply rounded corners
    if (params.radius && params.radius > 0) {
      const metadata = await sharp(imageBuffer).metadata();
      const width = params.width || metadata.width || 100;
      const height = params.height || metadata.height || 100;

      const roundedCorners = Buffer.from(
        `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${params.radius}" ry="${params.radius}"/></svg>`
      );

      sharpInstance = sharpInstance.composite([
        {
          input: roundedCorners,
          blend: 'dest-in',
        },
      ]);
    }

    // Determine output format
    // If radius is applied, use PNG (supports transparency) unless explicitly specified
    let outputFormat: OutputFormat = params.format || 'auto';
    if (outputFormat === 'auto') {
      outputFormat = params.radius && params.radius > 0 ? 'png' : 'webp';
    }

    // Convert to specified format
    let outputBuffer: Buffer;
    let contentType: string;

    switch (outputFormat) {
      case 'png':
        outputBuffer = await sharpInstance.png({ quality: params.quality }).toBuffer();
        contentType = 'image/png';
        break;
      case 'jpeg':
        outputBuffer = await sharpInstance.jpeg({ quality: params.quality }).toBuffer();
        contentType = 'image/jpeg';
        break;
      case 'webp':
      default:
        outputBuffer = await sharpInstance.webp({ quality: params.quality }).toBuffer();
        contentType = 'image/webp';
        break;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: outputBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Image processing failed' }),
    };
  }
};

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
