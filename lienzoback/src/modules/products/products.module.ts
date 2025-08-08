import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Categories } from '../categories/entities/category.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Categories, Products]), FileUploadModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
