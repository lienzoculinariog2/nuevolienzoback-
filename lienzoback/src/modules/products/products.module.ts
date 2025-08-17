import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/product.entity';
import { Categories } from '../categories/entities/category.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { Orders } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { Ingredients } from '../ingredients/entities/ingredient.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categories, Products, Orders, OrderDetail, Ingredients]),
    FileUploadModule,
    CategoriesModule,
    IngredientsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
