// src/modules/categories/categories.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categories } from './entities/category.entity';
import { Products } from '../products/entities/product.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Categories, Products]), forwardRef(() => FileUploadModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
