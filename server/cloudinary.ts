import { v2 as cloudinary } from 'cloudinary';

const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured');
} else {
  console.log('Cloudinary not configured — images will be stored as base64 fallback');
}

/**
 * Upload a base64 image to Cloudinary and return the URL.
 * Falls back to returning the base64 string if Cloudinary isn't configured.
 */
export async function uploadImage(base64Data: string, folder: string = 'boomerang'): Promise<string> {
  if (!base64Data) return '';
  if (!isConfigured) return base64Data; // fallback: store base64 as before

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // max 800x800
        { quality: 'auto', fetch_format: 'auto' },   // auto-optimize
      ],
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return base64Data; // fallback to base64 on error
  }
}

/**
 * Upload an avatar (smaller, square crop).
 */
export async function uploadAvatar(base64Data: string): Promise<string> {
  if (!base64Data) return '';
  if (!isConfigured) return base64Data;

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'boomerang/avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary avatar upload failed:', err);
    return base64Data;
  }
}
