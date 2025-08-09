import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryConfig {
  constructor(private readonly configService: ConfigService) {}

  public getCloudinaryConfig() {
    // ✅ Lógica implementada: Lee las variables del archivo .env
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing in environment variables.');
    }

    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }
}