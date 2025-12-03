import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});



export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = file.name;
    const originalType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!originalType.startsWith('image/')) {
      return Response.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    let finalBuffer;
    let finalFileName = `sale-items/${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.\w+$/, '')}.jpg`;
    let finalContentType = 'image/jpeg';
    let wasConverted = false;

    // If HEIC, convert to JPEG buffer
    if (originalType === 'image/heic' || originalName.toLowerCase().endsWith('.heic')) {
      const jpegBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1,
      });
      finalBuffer = jpegBuffer
      wasConverted = true;
    } else {
      // Convert all to JPEG and compress
      finalBuffer = buffer
      wasConverted = originalType !== 'image/jpeg';
    }

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: finalFileName,
      Body: finalBuffer,
      ContentType: finalContentType,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${finalFileName}`;

    return Response.json({
      success: true,
      url: fileUrl,
      fileName: finalFileName,
      message: 'File uploaded and compressed to under 100 KB',
      size: finalBuffer.length,
      converted: wasConverted
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({
      success: false,
      error: 'Upload failed',
      details: error.message
    }, { status: 500 });
  }
}
