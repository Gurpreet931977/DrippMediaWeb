import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || 'portfolio';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return Response.json({ error: 'R2 API keys missing in environment' }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600
          }
        ]
      }
    });

    await s3Client.send(command);
    return Response.json({ success: true, message: 'CORS configured successfully for ' + bucketName });
  } catch (error) {
    console.error('Error configuring CORS:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
