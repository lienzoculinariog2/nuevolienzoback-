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
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommonModule } from './modules/common/common.module';
import { MigrationService } from './modules/common/services/migration.service';
import { NotificationsModule } from './modules/notifications/notifications.module';

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

    CommonModule,
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
    CheckoutModule,
    PaymentsModule,
    NotificationsModule,
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
    private readonly migrationService: MigrationService,
  ) {}

  async onModuleInit() {
    console.info('🔄 Iniciando aplicación...');

    // Ejecutar migraciones primero
    console.info('📦 Ejecutando migraciones...');
    await this.migrationService.runMigrations();

    console.info('🌱 Ejecutando seeders...');

    const areTablesPopulated = await this.productsService.isPopulated();
    if (areTablesPopulated) {
      console.log('✅ Base de datos ya poblada. Saltando seeders.');
      return;
    }

    console.log('🌱 Sembrando categorías...');
    await this.categoriesService.seedCategories();

    console.log('🌱 Sembrando ingredientes...');
    await this.ingredientsService.seedIngredients();

    console.log('🌱 Sembrando productos y vinculando relaciones...');
    await this.productsService.seedProducts();

    console.log('✅ Seeders completados exitosamente.');
  }
}
