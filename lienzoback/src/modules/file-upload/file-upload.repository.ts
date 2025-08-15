import { v2 as cloudinary } from 'cloudinary';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { bufferToStream } from '../common/utils/buffer-to-stream';
import type { Express } from 'express';

@Injectable()
export class FileUploadRepository {
  private readonly logger = new Logger(FileUploadRepository.name);

  async uploadImage(file: Express.Multer.File): Promise<any> {
    this.logger.log('🚀 Iniciando upload a Cloudinary...');
    this.logger.log(`📁 Archivo: ${file.originalname}, Tamaño: ${file.size} bytes, Tipo: ${file.mimetype}`);

    // Validar configuración de Cloudinary
    this.validateCloudinaryConfig();
    
    // Validar archivo
    this.validateFile(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            this.logger.error('❌ Error en Cloudinary upload:', error);
            return reject(new InternalServerErrorException(`Error al subir imagen: ${error.message}`));
          }
          
          this.logger.log('✅ Upload exitoso a Cloudinary:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            size: result.bytes
          });
          
          return resolve(result);
        },
      );

      try {
        bufferToStream(file.buffer).pipe(uploadStream);
      } catch (error) {
        this.logger.error('❌ Error al procesar el buffer del archivo:', error);
        reject(new InternalServerErrorException('Error al procesar el archivo'));
      }
    });
  }

  private validateCloudinaryConfig(): void {
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      this.logger.error(`❌ Variables de entorno de Cloudinary faltantes: ${missingVars.join(', ')}`);
      this.logger.warn('⚠️  La subida de imágenes no funcionará. Configure las variables en Render.');
      throw new InternalServerErrorException(
        `Configuración de Cloudinary incompleta. Variables faltantes: ${missingVars.join(', ')}. ` +
        'Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Render.'
      );
    }

    this.logger.log('✅ Configuración de Cloudinary validada');
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new InternalServerErrorException('No se proporcionó ningún archivo');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new InternalServerErrorException('El archivo está vacío');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new InternalServerErrorException('El archivo es demasiado grande (máximo 5MB)');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new InternalServerErrorException('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)');
    }

    this.logger.log('✅ Archivo validado correctamente');
  }
}
