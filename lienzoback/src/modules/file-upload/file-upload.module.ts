import { Module, forwardRef } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from '../products/entities/product.entity';
import { FileUploadRepository } from './file-upload.repository';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Products]),
    forwardRef(() => ProductsModule), // ✅ Aquí agregas forwardRef
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, FileUploadRepository, CloudinaryConfig],
  exports: [FileUploadService], // ✅ Exportas si otros módulos lo usan
})
export class FileUploadModule {}
