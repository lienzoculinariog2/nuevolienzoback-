import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
import { PaymentCalculationService } from './services/payment-calculation.service';
import { PaymentManagementService } from './services/payment-management.service';
import { WebhookMonitoringService } from './services/webhook-monitoring.service';
import { Orders } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Products } from '../products/entities/product.entity';
import { Payment } from './entities/payment.entity';
import { ConfigModule } from '@nestjs/config';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Orders, OrderDetail, Products, Payment]),
    CartModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentOrderService, PaymentCalculationService, PaymentManagementService, WebhookMonitoringService],
  exports: [PaymentsService, PaymentOrderService, PaymentCalculationService, PaymentManagementService, WebhookMonitoringService],
})
export class PaymentsModule {}
