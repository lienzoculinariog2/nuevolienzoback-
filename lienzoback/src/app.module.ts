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
import { CartModule } from './modules/cart/cart.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { IngredientsService } from './modules/ingredients/ingredients.service';
import { PaymentsModule } from './modules/payments/payments.module';

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
    IngredientsModule,
    CartModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  usersServiceService: any;
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async onModuleInit() {
    console.info('Running all seeders...');

    const areTablesPopulated = await this.productsService.isPopulated();
    if (areTablesPopulated) {
      console.log('Database already populated. Skipping seeder.');
      return;
    }

    console.log('Seeding categories...');
    await this.categoriesService.seedCategories();

    console.log('Seeding ingredients...');
    await this.ingredientsService.seedIngredients();

    console.log('Seeding products and linking relationships...');
    await this.productsService.seedProducts();

    console.log('Seeder finished successfully.');
  }
}
