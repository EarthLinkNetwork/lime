import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { S3UploadStack } from '../lib/s3-upload-stack';

describe('S3UploadStack', () => {
  let app: cdk.App;
  let stack: S3UploadStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new S3UploadStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('S3バケットが作成されること', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('CORS設定が有効化されていること', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['PUT', 'GET']),
              AllowedOrigins: Match.arrayWith(['*']),
              AllowedHeaders: Match.arrayWith(['*']),
            }),
          ]),
        },
      });
    });

    test('パブリックアクセスがブロックされていること', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Lambda - Presigned URL Generator', () => {
    test('署名付きURL発行Lambdaが作成されること', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs20.x',
      });
    });

    test('LambdaがS3へのputObject権限を持つこと', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:PutObject']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway - HTTP API', () => {
    test('HTTP APIが作成されること', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    });

    test('HTTP APIのプロトコルタイプがHTTPであること', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        ProtocolType: 'HTTP',
      });
    });

    test('署名付きURL取得用のルートが存在すること', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'POST /presigned-url',
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFrontディストリビューションが作成されること', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('S3がオリジンとして設定されていること', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Origins: Match.arrayWith([
            Match.objectLike({
              DomainName: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('Image Resize Lambda', () => {
    test('画像リサイズ用Lambda@Edgeが作成されること', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        MemorySize: 512,
      });
    });
  });

  describe('v2: Delete Object Lambda', () => {
    test('削除用Lambdaが作成されること', () => {
      // Should have at least 3 Lambda functions (presigned-url, image-resize, delete-object, list-objects)
      const lambdas = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(4);
    });

    test('DELETE /objects ルートが存在すること', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'DELETE /objects',
      });
    });

    test('削除LambdaがS3のDeleteObject権限を持つこと', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:DeleteObject*',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('v2: List Objects Lambda', () => {
    test('GET /objects ルートが存在すること', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /objects',
      });
    });

    test('一覧取得LambdaがS3のListBucket権限を持つこと', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('v2: S3 Lifecycle Rules', () => {
    test('_tmp/ プレフィックスに1日のライフサイクルルールが設定されていること', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Prefix: '_tmp/',
              ExpirationInDays: 1,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('v2: CORS Update', () => {
    test('HTTP APIのCORSにDELETEとGETが含まれること', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        CorsConfiguration: {
          AllowMethods: Match.arrayWith(['DELETE', 'GET', 'POST', 'OPTIONS']),
        },
      });
    });
  });
});
