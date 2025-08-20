import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
import { Orders } from '../orders/entities/order.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Orders]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentOrderService],
  exports: [PaymentsService, PaymentOrderService],
})
export class PaymentsModule {}
