import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { config as dotenvconfig } from 'dotenv';

dotenvconfig({ path: '.env.development' });

@Injectable()
export class CloudinaryConfig {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configurado correctamente');
  }
}
