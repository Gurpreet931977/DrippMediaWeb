import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request) {
  try {
    const { fileName, contentType, folder = 'Reels' } = await request.json();

    if (!fileName || !contentType) {
      return Response.json({ error: 'fileName and contentType are required' }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || 'portfolio';
    const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

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

    // Sanitize file name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `${folder}/${Date.now()}_${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Create the final public URL that will be stored in Supabase
    const publicUrl = `${publicUrlBase}/${objectKey}`;

    return Response.json({
      presignedUrl,
      publicUrl,
      objectKey
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return Response.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
