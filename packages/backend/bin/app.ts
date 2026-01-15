#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3UploadStack } from '../lib/s3-upload-stack';

// ===== AWS PROFILE SAFETY CHECK =====
// このプロジェクトは必ず berry profile を使用すること
const REQUIRED_PROFILE = 'berry';
const currentProfile = process.env.AWS_PROFILE;

if (currentProfile && currentProfile !== REQUIRED_PROFILE) {
  console.error('='.repeat(60));
  console.error('ERROR: Wrong AWS Profile!');
  console.error('='.repeat(60));
  console.error(`Current:  AWS_PROFILE=${currentProfile}`);
  console.error(`Required: AWS_PROFILE=${REQUIRED_PROFILE}`);
  console.error('');
  console.error(`このプロジェクトは必ず '${REQUIRED_PROFILE}' profile を使用してください。`);
  console.error('='.repeat(60));
  process.exit(1);
}
// ===== END PROFILE CHECK =====

const app = new cdk.App();

new S3UploadStack(app, 'S3UploadStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
});
