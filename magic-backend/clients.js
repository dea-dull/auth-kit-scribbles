// clients.js
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SESClient } from '@aws-sdk/client-ses';

const REGION = process.env.AWS_REGION;

// Cognito client
export const cognito = new CognitoIdentityProviderClient({ region: REGION });

// DynamoDB client
const ddb = new DynamoDBClient({ region: REGION });
export const doc = DynamoDBDocumentClient.from(ddb);

// SES client
export const ses = new SESClient({ region: REGION });
