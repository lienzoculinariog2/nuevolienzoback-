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
import { OrdersModule } from '../orders/orders.module';
import { RolesGuard } from '../common/guard/roles.guard';

@Module({
  imports: [
    ConfigModule,
    OrdersModule,
    TypeOrmModule.forFeature([Orders, OrderDetail, Products, Payment]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentOrderService,
    PaymentCalculationService,
    PaymentManagementService,
    WebhookMonitoringService,
    RolesGuard,
  ],
  exports: [
    PaymentsService,
    PaymentOrderService,
    PaymentCalculationService,
    PaymentManagementService,
    WebhookMonitoringService,
  ],
})
export class PaymentsModule {}
