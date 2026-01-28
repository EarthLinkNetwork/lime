import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class S3UploadStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly presignedUrlLambda: lambdaNodejs.NodejsFunction;
  public readonly deleteObjectLambda: lambdaNodejs.NodejsFunction;
  public readonly listObjectsLambda: lambdaNodejs.NodejsFunction;
  public readonly imageResizeLambda: lambdaNodejs.NodejsFunction;
  public readonly httpApi: apigatewayv2.HttpApi;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket with CORS configuration
    this.bucket = new s3.Bucket(this, 'UploadBucket', {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          prefix: '_tmp/',
          expiration: cdk.Duration.days(1),
          enabled: true,
        },
      ],
    });

    // Lambda for generating presigned URLs (using NodejsFunction for TypeScript support)
    this.presignedUrlLambda = new lambdaNodejs.NodejsFunction(this, 'PresignedUrlLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/presigned-url/index.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        // API Keys are configured via environment variable
        // Set VALID_API_KEYS in Lambda console or via CDK context
        // Format: comma-separated list of valid keys
        // If empty, any API key is accepted (development mode)
        VALID_API_KEYS: process.env.VALID_API_KEYS || '',
      },
      timeout: cdk.Duration.seconds(10),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: false,
      },
    });

    // Grant S3 put permissions to the Lambda
    this.bucket.grantPut(this.presignedUrlLambda);

    // Lambda for deleting objects
    this.deleteObjectLambda = new lambdaNodejs.NodejsFunction(this, 'DeleteObjectLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/delete-object/index.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        VALID_API_KEYS: process.env.VALID_API_KEYS || '',
      },
      timeout: cdk.Duration.seconds(10),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: false,
      },
    });

    // Grant S3 delete permissions
    this.bucket.grantDelete(this.deleteObjectLambda);

    // Lambda for listing objects
    this.listObjectsLambda = new lambdaNodejs.NodejsFunction(this, 'ListObjectsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/list-objects/index.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        VALID_API_KEYS: process.env.VALID_API_KEYS || '',
      },
      timeout: cdk.Duration.seconds(10),
      bundling: {
        externalModules: [],
        minify: true,
        sourceMap: false,
      },
    });

    // Grant S3 read permissions to the list Lambda
    this.bucket.grantRead(this.listObjectsLambda);

    // HTTP API
    this.httpApi = new apigatewayv2.HttpApi(this, 'UploadApi', {
      apiName: 's3-upload-api',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'X-Api-Key'],
      },
    });

    // Route for presigned URL generation
    this.httpApi.addRoutes({
      path: '/presigned-url',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'PresignedUrlIntegration',
        this.presignedUrlLambda
      ),
    });

    // Route for object deletion
    this.httpApi.addRoutes({
      path: '/objects',
      methods: [apigatewayv2.HttpMethod.DELETE],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'DeleteObjectIntegration',
        this.deleteObjectLambda
      ),
    });

    // Route for listing objects
    this.httpApi.addRoutes({
      path: '/objects',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'ListObjectsIntegration',
        this.listObjectsLambda
      ),
    });

    // Lambda for image resizing (using NodejsFunction for TypeScript support)
    this.imageResizeLambda = new lambdaNodejs.NodejsFunction(this, 'ImageResizeLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/image-resize/index.ts'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
      bundling: {
        externalModules: ['sharp'],  // sharp needs native bindings, use Lambda layer or external
        minify: true,
        sourceMap: false,
        nodeModules: ['sharp'],
      },
    });

    // Grant S3 read permissions to the image resize Lambda
    this.bucket.grantRead(this.imageResizeLambda);

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'HTTP API endpoint',
    });

    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name',
    });
  }
}
