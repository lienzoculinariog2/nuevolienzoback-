// src/modules/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categories } from './entities/category.entity';
import { Products } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categories, Products])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
