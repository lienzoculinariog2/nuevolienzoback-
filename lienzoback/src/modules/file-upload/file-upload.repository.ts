import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { unlinkSync } from 'fs'; 

@Injectable()
export class FileUploadRepository {
  constructor(private readonly cloudinaryConfig: CloudinaryConfig) {
    cloudinary.config(this.cloudinaryConfig.getCloudinaryConfig());
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'products',
      });
      return result;
    } finally {
      unlinkSync(file.path);
    }
  }
}
