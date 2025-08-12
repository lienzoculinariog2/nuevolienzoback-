import { Module, OnModuleInit } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import typeOrmConfig from './config/typeorm';
import { CategoriesService } from './modules/categories/categories.service';
import { ProductsService } from './modules/products/products.service';
import { OrdersModule } from './modules/orders/orders.module';
import { DiscountCodesModule } from './modules/discount-codes/discount-codes.module';
import { ReviewsModule } from './modules/product-review/reviews.module';
//import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('typeorm')!,
    }),

    UsersModule,
    ProductsModule,
    CategoriesModule,
    AuthModule,
    FileUploadModule,
    OrdersModule,
    DiscountCodesModule,
    ReviewsModule,
    DiscountCodesModule,
    //CartModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  async onModuleInit() {
    console.info('Running all seeders...');
    await this.categoriesService.seeder();
    await this.productsService.seeder();
    console.info('All seeders finished successfully.');
  }
}
