import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand} from '@aws-sdk/client-s3';
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

const MAX_FILE_SIZE = 100 * 1024; // 100 KB

async function compressToUnder100KB(inputBuffer) {
  let quality = 80;
  let resized = sharp(inputBuffer).rotate().jpeg({ quality });

  while (quality >= 30) {
    const outputBuffer = await resized.toBuffer();
    if (outputBuffer.length <= MAX_FILE_SIZE) {
      return outputBuffer;
    }
    quality -= 10;
    resized = sharp(inputBuffer).rotate().jpeg({ quality });
  }

  // If still too big, resize image
  let width = 1000;
  while (width >= 200) {
    const resizedBuffer = await sharp(inputBuffer)
      .resize({ width, withoutEnlargement: true })
      .rotate()
      .jpeg({ quality: 60 })
      .toBuffer();
    if (resizedBuffer.length <= MAX_FILE_SIZE) {
      return resizedBuffer;
    }
    width -= 200;
  }

  // As last resort, return smallest compressed version
  return await sharp(inputBuffer).rotate().resize({ width: 200 }).jpeg({ quality: 40 }).toBuffer();
}

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
    let finalFileName = `imagebank/${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.\w+$/, '')}.jpg`;
    let finalContentType = 'image/jpeg';
    let wasConverted = false;

    // If HEIC, convert to JPEG buffer
    if (originalType === 'image/heic' || originalName.toLowerCase().endsWith('.heic')) {
      const jpegBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1,
      });
      finalBuffer = await compressToUnder100KB(jpegBuffer);
      wasConverted = true;
    } else {
      // Convert all to JPEG and compress
      finalBuffer = await compressToUnder100KB(buffer);
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

export async function GET() {
  try {
    const prefix = 'imagebank/';

    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
    });

    const data = await s3Client.send(command);

    const items = (data.Contents || [])
      .filter(item => item.Key !== prefix)
      .map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${item.Key}`,
      }));

    return Response.json({
      success: true,
      count: items.length,
      items,
    });

  } catch (error) {
    console.error('List error:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to list files',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return Response.json(
        { success: false, error: 'No key provided' },
        { status: 400 }
      );
    }

    // Safety check: only allow deleting from imagebank
    if (!key.startsWith('imagebank/')) {
      return Response.json(
        { success: false, error: 'Invalid key' },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return Response.json({
      success: true,
      message: 'Image deleted successfully',
      key,
    });

  } catch (error) {
    console.error('Delete error:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to delete image',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
