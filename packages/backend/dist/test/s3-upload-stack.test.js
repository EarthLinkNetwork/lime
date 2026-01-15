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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtdXBsb2FkLXN0YWNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L3MzLXVwbG9hZC1zdGFjay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlEO0FBQ3pELDREQUF1RDtBQUV2RCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQW9CLENBQUM7SUFDekIsSUFBSSxRQUFrQixDQUFDO0lBRXZCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDcEIsS0FBSyxHQUFHLElBQUksK0JBQWEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDNUMsUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDekIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMxQixRQUFRLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUM3QixRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ2hELGlCQUFpQixFQUFFO29CQUNqQixTQUFTLEVBQUUsa0JBQUssQ0FBQyxTQUFTLENBQUM7d0JBQ3pCLGtCQUFLLENBQUMsVUFBVSxDQUFDOzRCQUNmLGNBQWMsRUFBRSxrQkFBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFDL0MsY0FBYyxFQUFFLGtCQUFLLENB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SCxRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBQ25DLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFO2dCQUN0RCxPQUFPLEVBQUUsWUFBWTtnQkFDckIsVUFBVSxFQUFFLEdBQUc7YUFDaEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlLCBNYXRjaCB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgUzNVcGxvYWRTdGFjayB9IGZyb20gJy4uL2xpYi9zMy11cGxvYWQtc3RhY2snO1xuXG5kZXNjcmliZSgnUzNVcGxvYWRTdGFjaycsICgpID0+IHtcbiAgbGV0IGFwcDogY2RrLkFwcDtcbiAgbGV0IHN0YWNrOiBTM1VwbG9hZFN0YWNrO1xuICBsZXQgdGVtcGxhdGU6IFRlbXBsYXRlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgc3RhY2sgPSBuZXcgUzNVcGxvYWRTdGFjayhhcHAsICdUZXN0U3RhY2snKTtcbiAgICB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTMyBCdWNrZXQnLCAoKSA9PiB7XG4gICAgdGVzdCgnUzPjg5DjgrHjg4Pjg4jjgYzkvZzmiJDjgZXjgozjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIDEpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ09SU+ioreWumuOBjOacieWKueWMluOBleOCjOOBpuOBhOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBDb3JzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIENvcnNSdWxlczogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgIE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICBBbGxvd2VkTWV0aG9kczogTWF0Y2guYXJyYXlXaXRoKFsnUFVUJywgJ0dFVCddKSxcbiAgICAgICAgICAgICAgQWxsb3dlZE9yaWdpbnM6IE1hdGNoLmFycmF5V2l0aChbJyonXSksXG4gICAgICAgICAgICAgIEFsbG93ZWRIZWFkZXJzOiBNYXRjaC5hcnJheVdpdGgoWycqJ10pLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ+ODkeODluODquODg+OCr+OCouOCr+OCu+OCueOBjOODluODreODg+OCr+OBleOCjOOBpuOBhOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBQdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBCbG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgQmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgICAgSWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgICBSZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0xhbWJkYSAtIFByZXNpZ25lZCBVUkwgR2VuZXJhdG9yJywgKCkgPT4ge1xuICAgIHRlc3QoJ+e9suWQjeS7mOOBjVVSTOeZuuihjExhbWJkYeOBjOS9nOaIkOOBleOCjOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgICBIYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIFJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnTGFtYmRh44GMUzPjgbjjga5wdXRPYmplY3TmqKnpmZDjgpLmjIHjgaTjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpQb2xpY3knLCB7XG4gICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgU3RhdGVtZW50OiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgIEFjdGlvbjogTWF0Y2guYXJyYXlXaXRoKFsnczM6UHV0T2JqZWN0J10pLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQVBJIEdhdGV3YXkgLSBIVFRQIEFQSScsICgpID0+IHtcbiAgICB0ZXN0KCdIVFRQIEFQSeOBjOS9nOaIkOOBleOCjOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpBcGlHYXRld2F5VjI6OkFwaScsIDEpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnSFRUUCBBUEnjga7jg5fjg63jg4jjgrPjg6vjgr/jgqTjg5fjgYxIVFRQ44Gn44GC44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkFwaUdhdGV3YXlWMjo6QXBpJywge1xuICAgICAgICBQcm90b2NvbFR5cGU6ICdIVFRQJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgn572y5ZCN5LuY44GNVVJM5Y+W5b6X55So44Gu44Or44O844OI44GM5a2Y5Zyo44GZ44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkFwaUdhdGV3YXlWMjo6Um91dGUnLCB7XG4gICAgICAgIFJvdXRlS2V5OiAnUE9TVCAvcHJlc2lnbmVkLXVybCcsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ0Nsb3VkRnJvbnTjg4fjgqPjgrnjg4jjg6rjg5Pjg6Xjg7zjgrfjg6fjg7PjgYzkvZzmiJDjgZXjgozjgovjgZPjgagnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6Q2xvdWRGcm9udDo6RGlzdHJpYnV0aW9uJywgMSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdTM+OBjOOCquODquOCuOODs+OBqOOBl+OBpuioreWumuOBleOCjOOBpuOBhOOCi+OBk+OBqCcsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpDbG91ZEZyb250OjpEaXN0cmlidXRpb24nLCB7XG4gICAgICAgIERpc3RyaWJ1dGlvbkNvbmZpZzoge1xuICAgICAgICAgIE9yaWdpbnM6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgRG9tYWluTmFtZTogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdJbWFnZSBSZXNpemUgTGFtYmRhJywgKCkgPT4ge1xuICAgIHRlc3QoJ+eUu+WDj+ODquOCteOCpOOCuueUqExhbWJkYUBFZGdl44GM5L2c5oiQ44GV44KM44KL44GT44GoJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIFJ1bnRpbWU6ICdub2RlanMyMC54JyxcbiAgICAgICAgTWVtb3J5U2l6ZTogNTEyLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=