import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { FileUploadRepository } from './file-upload.repository';

@Module({
  imports: [],
  controllers: [FileUploadController],
  providers: [FileUploadService, FileUploadRepository, CloudinaryConfig],
  exports: [FileUploadService], 
})
export class FileUploadModule {}