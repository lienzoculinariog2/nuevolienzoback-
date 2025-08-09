import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FileUploadRepository } from './file-upload.repository';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
  ) {}
  
  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const uploadResponse = await this.fileUploadRepository.uploadImage(file);
      if (!uploadResponse || !uploadResponse.secure_url) {
        throw new InternalServerErrorException('Failed to get secure URL from Cloudinary');
      }
      return uploadResponse.secure_url;
    } catch (error) {
      console.error('Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }
}