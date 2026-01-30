"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const s3_upload_stack_1 = require("../lib/s3-upload-stack");
describe('S3UploadStack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new cdk.App();
        stack = new s3_upload_stack_1.S3UploadStack(app, 'TestStack');
        template = assertions_1.Template.fromStack(stack);
    });
    describe('S3 Bucket', () => {
        test('S3バケットが作成されること', () => {
            template.resourceCountIs('AWS::S3::Bucket', 1);
        });
        test('CORS設定が有効化されていること', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                CorsConfiguration: {
                    CorsRules: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            AllowedMethods: assertions_1.Match.arrayWith(['PUT', 'GET']),
                            AllowedOrigins: assertions_1.Match.arrayWith(['*']),
                            AllowedHeaders: assertions_1.Match.arrayWith(['*']),
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
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith(['s3:PutObject']),
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
                    Origins: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            DomainName: assertions_1.Match.anyValue(),
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
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
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
                    Statement: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
                            Action: assertions_1.Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
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
                    Rules: assertions_1.Match.arrayWith([
                        assertions_1.Match.objectLike({
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
                    AllowMethods: assertions_1.Match.arrayWith(['DELETE', 'GET', 'POST', 'OPTIONS']),
                },
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtdXBsb2FkLXN0YWNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L3MzLXVwbG9hZC1zdGFjay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlEO0FBQ3pELDREQUF1RDtBQUV2RCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQW9CLENBQUM7SUFDekIsSUFBSSxRQUFrQixDQUFDO0lBRXZCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxHQUFHLElBQUksK0JBQWEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDNUMsUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDekIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMxQixRQUFRLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUM3QixRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ2hELGlCQUFpQixFQUFFO29CQUNqQixTQUFTLEVBQUUsa0JBQUssQ0FBQyxTQUFTLENBQUM7d0JBQ3pCLGtCQUFLLENBQUMsVUFBVSxDQUFDOzRCQUNmLGNBQWMsRUFBRSxrQkFBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFDL0MsY0FBYyxFQUFFLGtCQUFLLENB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QUMvQixJQUFJLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1lBQzNDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsRUFBRTtnQkFDdkQsaUJBQWlCLEVBQUU7b0JBQ2pCLFlBQVksRUFBRSxrQkFBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2lCQUNwRTthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSwgTWF0Y2ggfSBmcm9tICdhd3MtY2RrLWxpYi9hc3NlcnRpb25zJztcbmltcG9ydCB7IFMzVXBsb2FkU3RhY2sgfSBmcm9tICcuLi9saWIvczMtdXBsb2FkLXN0YWNrJztcblxuZGVzY3JpYmUoJ1MzVXBsb2FkU3RhY2snLCAoKSA9PiB7XG4gIGxldCBhcHA6IGNkay5BcHA7XG4gIGxldCBzdGFjazogUzNVcGxvYWRTdGFjaztcbiAgbGV0IHRlbXBsYXRlOiBUZW1wbGF0ZTtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFMzVXBsb2FkU3RhY2soYXBwLCAnVGVzdFN0YWNrJyk7XG4gICAgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuICB9KTtcblxuICBkZXNjcmliZSgnUzMgQnVja2V0JywgKCkgPT4ge1xuICAgIHRlc3QoJ1Mz44OQ44Kx44OD44OI44GM5L2c5oiQ44GV44KM44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OlMzOjpCdWNrZXQnLCAxKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NPUlPoqK3lrprjgYzmnInlirnljJbjgZXjgozjgabjgYTjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgICAgQ29yc0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBDb3JzUnVsZXM6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgQWxsb3dlZE1ldGhvZHM6IE1hdGNoLmFycmF5V2l0aChbJ1BVVCcsICdHRVQnXSksXG4gICAgICAgICAgICAgIEFsbG93ZWRPcmlnaW5zOiBNYXRjaC5hcnJheVdpdGgoWycqJ10pLFxuICAgICAgICAgICAgICBBbGxvd2VkSGVhZGVyczogTWF0Y2guYXJyYXlXaXRoKFsnKiddKSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCfjg5Hjg5bjg6rjg4Pjgq/jgqLjgq/jgrvjgrnjgYzjg5bjg63jg4Pjgq/jgZXjgozjgabjgYTjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgICAgUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgQmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIEJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgIElnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgUmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdMYW1iZGEgLSBQcmVzaWduZWQgVVJMIEdlbmVyYXRvcicsICgpID0+IHtcbiAgICB0ZXN0KCfnvbLlkI3ku5jjgY1VUkznmbrooYxMYW1iZGHjgYzkvZzmiJDjgZXjgozjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgICAgSGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICBSdW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0xhbWJkYeOBjFMz44G444GucHV0T2JqZWN05qip6ZmQ44KS5oyB44Gk44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6UG9saWN5Jywge1xuICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgIFN0YXRlbWVudDogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICBBY3Rpb246IE1hdGNoLmFycmF5V2l0aChbJ3MzOlB1dE9iamVjdCddKSxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0FQSSBHYXRld2F5IC0gSFRUUCBBUEknLCAoKSA9PiB7XG4gICAgdGVzdCgnSFRUUCBBUEnjgYzkvZzmiJDjgZXjgozjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6QXBpR2F0ZXdheVYyOjpBcGknLCAxKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0hUVFAgQVBJ44Gu44OX44Ot44OI44Kz44Or44K/44Kk44OX44GMSFRUUOOBp+OBguOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpBcGlHYXRld2F5VjI6OkFwaScsIHtcbiAgICAgICAgUHJvdG9jb2xUeXBlOiAnSFRUUCcsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ+e9suWQjeS7mOOBjVVSTOWPluW+l+eUqOOBruODq+ODvOODiOOBjOWtmOWcqOOBmeOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpBcGlHYXRld2F5VjI6OlJvdXRlJywge1xuICAgICAgICBSb3V0ZUtleTogJ1BPU1QgL3ByZXNpZ25lZC11cmwnLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdDbG91ZEZyb250IERpc3RyaWJ1dGlvbicsICgpID0+IHtcbiAgICB0ZXN0KCdDbG91ZEZyb25044OH44Kj44K544OI44Oq44OT44Ol44O844K344On44Oz44GM5L2c5oiQ44GV44KM44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkNsb3VkRnJvbnQ6OkRpc3RyaWJ1dGlvbicsIDEpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUzPjgYzjgqrjg6rjgrjjg7PjgajjgZfjgaboqK3lrprjgZXjgozjgabjgYTjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Q2xvdWRGcm9udDo6RGlzdHJpYnV0aW9uJywge1xuICAgICAgICBEaXN0cmlidXRpb25Db25maWc6IHtcbiAgICAgICAgICBPcmlnaW5zOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgIERvbWFpbk5hbWU6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnSW1hZ2UgUmVzaXplIExhbWJkYScsICgpID0+IHtcbiAgICB0ZXN0KCfnlLvlg4/jg6rjgrXjgqTjgrrnlKhMYW1iZGFARWRnZeOBjOS9nOaIkOOBleOCjOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICBSdW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICAgIE1lbW9yeVNpemU6IDUxMixcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndjI6IERlbGV0ZSBPYmplY3QgTGFtYmRhJywgKCkgPT4ge1xuICAgIHRlc3QoJ+WJiumZpOeUqExhbWJkYeOBjOS9nOaIkOOBleOCjOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIC8vIFNob3VsZCBoYXZlIGF0IGxlYXN0IDMgTGFtYmRhIGZ1bmN0aW9ucyAocHJlc2lnbmVkLXVybCwgaW1hZ2UtcmVzaXplLCBkZWxldGUtb2JqZWN0LCBsaXN0LW9iamVjdHMpXG4gICAgICBjb25zdCBsYW1iZGFzID0gdGVtcGxhdGUuZmluZFJlc291cmNlcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJyk7XG4gICAgICBleHBlY3QoT2JqZWN0LmtleXMobGFtYmRhcykubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnREVMRVRFIC9vYmplY3RzIOODq+ODvOODiOOBjOWtmOWcqOOBmeOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpBcGlHYXRld2F5VjI6OlJvdXRlJywge1xuICAgICAgICBSb3V0ZUtleTogJ0RFTEVURSAvb2JqZWN0cycsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ+WJiumZpExhbWJkYeOBjFMz44GuRGVsZXRlT2JqZWN05qip6ZmQ44KS5oyB44Gk44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6UG9saWN5Jywge1xuICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgIFN0YXRlbWVudDogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICBBY3Rpb246ICdzMzpEZWxldGVPYmplY3QqJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3YyOiBMaXN0IE9iamVjdHMgTGFtYmRhJywgKCkgPT4ge1xuICAgIHRlc3QoJ0dFVCAvb2JqZWN0cyDjg6vjg7zjg4jjgYzlrZjlnKjjgZnjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6QXBpR2F0ZXdheVYyOjpSb3V0ZScsIHtcbiAgICAgICAgUm91dGVLZXk6ICdHRVQgL29iamVjdHMnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCfkuIDopqflj5blvpdMYW1iZGHjgYxTM+OBrkxpc3RCdWNrZXTmqKnpmZDjgpLmjIHjgaTjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpQb2xpY3knLCB7XG4gICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgU3RhdGVtZW50OiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgIEFjdGlvbjogTWF0Y2guYXJyYXlXaXRoKFsnczM6R2V0T2JqZWN0KicsICdzMzpHZXRCdWNrZXQqJywgJ3MzOkxpc3QqJ10pLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndjI6IFMzIExpZmVjeWNsZSBSdWxlcycsICgpID0+IHtcbiAgICB0ZXN0KCdfdG1wLyDjg5fjg6zjg5XjgqPjg4Pjgq/jgrnjgasx5pel44Gu44Op44Kk44OV44K144Kk44Kv44Or44Or44O844Or44GM6Kit5a6a44GV44KM44Gm44GE44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OlMzOjpCdWNrZXQnLCB7XG4gICAgICAgIExpZmVjeWNsZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBSdWxlczogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICBQcmVmaXg6ICdfdG1wLycsXG4gICAgICAgICAgICAgIEV4cGlyYXRpb25JbkRheXM6IDEsXG4gICAgICAgICAgICAgIFN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3YyOiBDT1JTIFVwZGF0ZScsICgpID0+IHtcbiAgICB0ZXN0KCdIVFRQIEFQSeOBrkNPUlPjgatERUxFVEXjgahHRVTjgYzlkKvjgb7jgozjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6QXBpR2F0ZXdheVYyOjpBcGknLCB7XG4gICAgICAgIENvcnNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgQWxsb3dNZXRob2RzOiBNYXRjaC5hcnJheVdpdGgoWydERUxFVEUnLCAnR0VUJywgJ1BPU1QnLCAnT1BUSU9OUyddKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19