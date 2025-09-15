const BUCKET_NAME = process.env.S3_BUCKET || 'avara-sl';

function getS3() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AWS = require('aws-sdk');
    return new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION || 'us-east-1',
    });
  } catch (err) {
    return null;
  }
}

export async function generateSignedUrl(key: string, contentType: string): Promise<string> {
  const s3 = getS3();
  if (!s3) throw new Error('S3 client not available');
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: contentType,
  };
  return s3.getSignedUrl('putObject', params);
}

export async function uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
  const s3 = getS3();
  if (!s3) throw new Error('S3 client not available');
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  };
  const result = await s3.upload(params).promise();
  return result.Location;
}

export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  const s3 = getS3();
  if (!s3) throw new Error('S3 client not available');
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };
  await s3.deleteObject(params).promise();
}