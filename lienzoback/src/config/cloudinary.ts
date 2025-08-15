import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryConfig {
  private readonly logger = new Logger(CloudinaryConfig.name);

  constructor() {
    this.validateCloudinaryConfig();
    this.configureCloudinary();
  }

  private validateCloudinaryConfig(): void {
    const requiredEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logger.error(`❌ Variables de entorno de Cloudinary faltantes: ${missingVars.join(', ')}`);
      this.logger.warn('⚠️  La subida de imágenes no funcionará correctamente');
    } else {
      this.logger.log('✅ Todas las variables de entorno de Cloudinary están configuradas');
    }
  }

  private configureCloudinary(): void {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      
      this.logger.log('✅ Cloudinary configurado correctamente');
      this.logger.log(`📁 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      this.logger.log(`🔑 API Key: ${process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'No configurado'}`);
      this.logger.log(`🔐 API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'No configurado'}`);
    } catch (error) {
      this.logger.error('❌ Error al configurar Cloudinary:', error);
      throw error;
    }
  }

  public getCloudinaryInstance() {
    return cloudinary;
  }
}
