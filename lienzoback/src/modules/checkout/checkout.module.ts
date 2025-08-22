import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Products } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { DiscountCodesUsed } from '../discount-codes/entities/discount-codes-used.entity';
import { DiscountCodesModule } from '../discount-codes/discount-codes.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Orders,
      OrderDetail,
      Cart,
      CartItem,
      Products,
      Users,
      DiscountCodesUsed,
    ]),
    DiscountCodesModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
