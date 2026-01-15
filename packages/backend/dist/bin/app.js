#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const s3_upload_stack_1 = require("../lib/s3-upload-stack");
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
new s3_upload_stack_1.S3UploadStack(app, 'S3UploadStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsNERBQXVEO0FBRXZELHVDQUF1QztBQUN2QyxvQ0FBb0M7QUFDcEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7QUFDakMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFFL0MsSUFBSSxjQUFjLElBQUksY0FBYyxLQUFLLGdCQUFnQixFQUFFLENBQUM7SUFDMUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDekQsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO0lBQzNELE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsZ0JBQWdCLHNCQUFzQixDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDO0FBQ0QsZ0NBQWdDO0FBRWhDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLElBQUksK0JBQWEsQ0FBQyxHQUFHLEVBQUUsZUFBZSxFQUFFO0lBQ3RDLEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxnQkFBZ0I7S0FDM0Q7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgUzNVcGxvYWRTdGFjayB9IGZyb20gJy4uL2xpYi9zMy11cGxvYWQtc3RhY2snO1xuXG4vLyA9PT09PSBBV1MgUFJPRklMRSBTQUZFVFkgQ0hFQ0sgPT09PT1cbi8vIOOBk+OBruODl+ODreOCuOOCp+OCr+ODiOOBr+W/heOBmiBiZXJyeSBwcm9maWxlIOOCkuS9v+eUqOOBmeOCi+OBk+OBqFxuY29uc3QgUkVRVUlSRURfUFJPRklMRSA9ICdiZXJyeSc7XG5jb25zdCBjdXJyZW50UHJvZmlsZSA9IHByb2Nlc3MuZW52LkFXU19QUk9GSUxFO1xuXG5pZiAoY3VycmVudFByb2ZpbGUgJiYgY3VycmVudFByb2ZpbGUgIT09IFJFUVVJUkVEX1BST0ZJTEUpIHtcbiAgY29uc29sZS5lcnJvcignPScucmVwZWF0KDYwKSk7XG4gIGNvbnNvbGUuZXJyb3IoJ0VSUk9SOiBXcm9uZyBBV1MgUHJvZmlsZSEnKTtcbiAgY29uc29sZS5lcnJvcignPScucmVwZWF0KDYwKSk7XG4gIGNvbnNvbGUuZXJyb3IoYEN1cnJlbnQ6ICBBV1NfUFJPRklMRT0ke2N1cnJlbnRQcm9maWxlfWApO1xuICBjb25zb2xlLmVycm9yKGBSZXF1aXJlZDogQVdTX1BST0ZJTEU9JHtSRVFVSVJFRF9QUk9GSUxFfWApO1xuICBjb25zb2xlLmVycm9yKCcnKTtcbiAgY29uc29sZS5lcnJvcihg44GT44Gu44OX44Ot44K444Kn44Kv44OI44Gv5b+F44GaICcke1JFUVVJUkVEX1BST0ZJTEV9JyBwcm9maWxlIOOCkuS9v+eUqOOBl+OBpuOBj+OBoOOBleOBhOOAgmApO1xuICBjb25zb2xlLmVycm9yKCc9Jy5yZXBlYXQoNjApKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuLy8gPT09PT0gRU5EIFBST0ZJTEUgQ0hFQ0sgPT09PT1cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxubmV3IFMzVXBsb2FkU3RhY2soYXBwLCAnUzNVcGxvYWRTdGFjaycsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtbm9ydGhlYXN0LTEnLFxuICB9LFxufSk7XG4iXX0=