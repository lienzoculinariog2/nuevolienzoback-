import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { bufferToStream } from '../common/utils/buffer-to-stream';
import type { Express } from 'express';

@Injectable()
export class FileUploadRepository {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    console.log('Iniciando upload a Cloudinary...');
    console.log('Configuración de Cloudinary:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'No configurado',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'No configurado',
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Error en Cloudinary upload:', error);
            return reject(error);
          }
          console.log('Upload exitoso a Cloudinary:', result);
          return resolve(result);
        },
      );

      bufferToStream(file.buffer).pipe(uploadStream);
    });
  }
}
