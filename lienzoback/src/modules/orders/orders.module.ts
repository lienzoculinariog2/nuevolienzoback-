import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Users } from '../users/entities/user.entity';
import { Products } from '../products/entities/product.entity';
import { DiscountCodesUsed } from '../discount-codes/entities/discount-codes-used.entity';
import { DiscountCodesModule } from '../discount-codes/discount-codes.module';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';
import { DiscountCodes } from '../discount-codes/entities/discount-codes.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Orders,
      Users,
      OrderDetail,
      Products,
      DiscountCodesUsed,
      DiscountCodes,
      Cart,
      CartItem,
    ]),
    DiscountCodesModule,
    CartModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
