import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for S3 photo service
 */
interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Photo upload result
 */
interface PhotoUploadResult {
  photoUrl: string;
  fileName: string;
}

/**
 * Service for uploading profile photos to S3
 * Handles validation, resizing, and storage
 */
export class S3PhotoService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly TARGET_SIZE = 400; // 400x400px

  constructor(config?: S3Config) {
    // Get configuration from environment or use provided config
    const bucketName = config?.bucketName || process.env.S3_BUCKET_NAME;
    const region = config?.region || process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

    if (!bucketName) {
      throw new Error('S3 bucket name is required');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required');
    }

    this.bucketName = bucketName;
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Validate file type
   * @param mimeType - File MIME type
   * @throws Error if file type is not allowed
   */
  private validateFileType(mimeType: string): void {
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error('File must be JPG, PNG, or GIF');
    }
  }

  /**
   * Validate file size
   * @param size - File size in bytes
   * @throws Error if file size exceeds limit
   */
  private validateFileSize(size: number): void {
    if (size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must not exceed ${this.MAX_FILE_SIZE / 1024 / 1024} MB`);
    }
  }

  /**
   * Resize image to target dimensions
   * @param buffer - Image buffer
   * @returns Resized image buffer
   */
  private async resizeImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(this.TARGET_SIZE, this.TARGET_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 }) // Convert to JPEG for consistency
      .toBuffer();
  }

  /**
   * Generate unique filename
   * @param originalName - Original file name
   * @returns Unique filename
   */
  private generateFileName(originalName?: string): string {
    const extension = originalName?.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = uuidv4();
    return `profile-photos/${uniqueId}.${extension}`;
  }

  /**
   * Upload profile photo to S3
   * @param file - File buffer
   * @param mimeType - File MIME type
   * @param size - File size in bytes
   * @param originalName - Original file name
   * @returns Upload result with photo URL
   */
  async uploadProfilePhoto(
    file: Buffer,
    mimeType: string,
    size: number,
    originalName?: string
  ): Promise<PhotoUploadResult> {
    // Validate file
    this.validateFileType(mimeType);
    this.validateFileSize(size);

    // Resize image
    const resizedImage = await this.resizeImage(file);

    // Generate unique filename
    const fileName = this.generateFileName(originalName);

    // Upload to S3
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: fileName,
        Body: resizedImage,
        ContentType: 'image/jpeg', // Always JPEG after processing
        ACL: 'public-read', // Make publicly readable
      },
    });

    await upload.done();

    // Construct public URL
    const region = process.env.AWS_REGION || 'us-east-1';
    const photoUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return {
      photoUrl,
      fileName,
    };
  }

  /**
   * Upload photo from base64 string
   * @param base64Data - Base64 encoded image data
   * @param mimeType - File MIME type
   * @returns Upload result with photo URL
   */
  async uploadFromBase64(base64Data: string, mimeType: string): Promise<PhotoUploadResult> {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');

    return await this.uploadProfilePhoto(buffer, mimeType, buffer.length);
  }
}
