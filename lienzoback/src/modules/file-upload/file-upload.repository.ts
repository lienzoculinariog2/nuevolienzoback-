// src/modules/file-upload/file-upload.repository.ts
import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { bufferToStream } from '../common/utils/buffer-to-stream';

@Injectable()
export class FileUploadRepository {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        },
      );

      bufferToStream(file.buffer).pipe(uploadStream);
    });
  }
}
