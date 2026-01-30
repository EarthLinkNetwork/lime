import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
export declare class S3UploadStack extends cdk.Stack {
    readonly bucket: s3.Bucket;
    readonly presignedUrlLambda: lambdaNodejs.NodejsFunction;
    readonly deleteObjectLambda: lambdaNodejs.NodejsFunction;
    readonly listObjectsLambda: lambdaNodejs.NodejsFunction;
    readonly imageResizeLambda: lambdaNodejs.NodejsFunction;
    readonly httpApi: apigatewayv2.HttpApi;
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
