import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentOrderService {
  private readonly logger = new Logger(PaymentOrderService.name);

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createPaymentForOrder(orderId: string, createPaymentIntentDto: CreatePaymentIntentDto) {
    try {
      // Verify the order exists
      const order = await this.ordersRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Check if order is already paid
      if (order.isPaid) {
        throw new Error(`Order ${orderId} is already paid`);
      }

      // Create payment intent
      const paymentResponse = await this.paymentsService.createPaymentIntent(createPaymentIntentDto);

      // Update order with payment intent ID
      await this.ordersRepository.update(orderId, {
        stripePaymentIntentId: paymentResponse.paymentIntentId,
        paymentStatus: paymentResponse.status,
      });

      this.logger.log(`Payment intent created for order ${orderId}: ${paymentResponse.paymentIntentId}`);

      return paymentResponse;
    } catch (error) {
      this.logger.error(`Error creating payment for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntentId: string) {
    try {
      // Find order by payment intent ID
      const order = await this.ordersRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!order) {
        this.logger.warn(`No order found for payment intent: ${paymentIntentId}`);
        return;
      }

      // Update order status
      await this.ordersRepository.update(order.id, {
        isPaid: true,
        statusOrder: OrderStatus.PAID,
        paymentStatus: 'succeeded',
      });

      this.logger.log(`Order ${order.id} marked as paid`);
    } catch (error) {
      this.logger.error(`Error handling payment success: ${error.message}`);
      throw error;
    }
  }

  async handlePaymentFailure(paymentIntentId: string) {
    try {
      // Find order by payment intent ID
      const order = await this.ordersRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!order) {
        this.logger.warn(`No order found for payment intent: ${paymentIntentId}`);
        return;
      }

      // Update order status
      await this.ordersRepository.update(order.id, {
        statusOrder: OrderStatus.PAYMENT_FAILED,
        paymentStatus: 'failed',
      });

      this.logger.log(`Order ${order.id} marked as payment failed`);
    } catch (error) {
      this.logger.error(`Error handling payment failure: ${error.message}`);
      throw error;
    }
  }

  async getOrderPaymentStatus(orderId: string) {
    try {
      const order = await this.ordersRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      if (!order.stripePaymentIntentId) {
        return {
          orderId,
          hasPaymentIntent: false,
          paymentStatus: null,
        };
      }

      // Get payment intent details from Stripe
      const paymentIntent = await this.paymentsService.getPaymentIntent(order.stripePaymentIntentId);

      return {
        orderId,
        hasPaymentIntent: true,
        paymentIntentId: order.stripePaymentIntentId,
        paymentStatus: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency,
        isPaid: order.isPaid,
        orderStatus: order.statusOrder,
      };
    } catch (error) {
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}
