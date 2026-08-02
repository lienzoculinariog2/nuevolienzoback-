import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import typeOrmConfig from './config/typeorm';
import { OrdersModule } from './modules/orders/orders.module';
import { DiscountCodesModule } from './modules/discount-codes/discount-codes.module';
import { ReviewsModule } from './modules/product-review/reviews.module';
import { CartModule } from './modules/cart/cart.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommonModule } from './modules/common/common.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DatabaseBootstrapService } from './bootstrap/database-bootstrap.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
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
    IngredientsModule,
    CartModule,
    CheckoutModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [DatabaseBootstrapService],
})
export class AppModule {}
