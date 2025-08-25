import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Products } from '../products/entities/product.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, CreatePaymentForOrderDto } from './dto/create-payment-intent.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PaymentOrderService {
  private readonly logger = new Logger(PaymentOrderService.name);

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    private readonly paymentsService: PaymentsService,
    private readonly cartService: CartService,
  ) {}

  async createPaymentForOrder(orderId: string, createPaymentForOrderDto: CreatePaymentForOrderDto) {
    try {
      // Verify the order exists
      const order = await this.ordersRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Create payment intent with orderId from parameter
      const createPaymentIntentDto: CreatePaymentIntentDto = {
        orderId,
        customerEmail: createPaymentForOrderDto.customerEmail,
        description: createPaymentForOrderDto.description,
        idempotencyKey: createPaymentForOrderDto.idempotencyKey,
      };
      
      const paymentResponse = await this.paymentsService.createPaymentIntent(createPaymentIntentDto);

      // Create payment record
      const payment = this.paymentRepository.create({
        orderId,
        stripePaymentIntentId: paymentResponse.paymentIntentId,
        amount: order.totalAmount,
        customerEmail: createPaymentForOrderDto.customerEmail,
        description: createPaymentForOrderDto.description,
        idempotencyKey: createPaymentForOrderDto.idempotencyKey,
        status: PaymentStatus.PENDING,
      });

      await this.paymentRepository.save(payment);

      this.logger.log(`Payment intent created for order ${orderId}: ${paymentResponse.paymentIntentId}`);

      return paymentResponse;
    } catch (error) {
      this.logger.error(`Error creating payment for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntentId: string) {
    try {
      // Find payment by payment intent ID
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['order'],
      });

      if (!payment) {
        this.logger.warn(`No payment found for payment intent: ${paymentIntentId}`);
        return;
      }

      // Update payment status
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCEEDED,
        processedAt: new Date(),
      });

      // Update order status
      await this.ordersRepository.update(payment.orderId, {
        status: OrderStatus.PAID,
      });

      // Update product stock
      await this.updateProductStock(payment.orderId);

      // Clear the user's cart after successful payment
      try {
        await this.cartService.clearCart(payment.order.userId);
        this.logger.log(`Cart cleared for user ${payment.order.userId} after successful payment`);
      } catch (cartError) {
        this.logger.warn(`Failed to clear cart for user ${payment.order.userId}: ${cartError.message}`);
        // Don't throw error here as the payment was successful
      }

      this.logger.log(`Order ${payment.orderId} marked as paid, stock updated, and cart cleared`);
    } catch (error) {
      this.logger.error(`Error handling payment success: ${error.message}`);
      throw error;
    }
  }

  async handlePaymentFailure(paymentIntentId: string) {
    try {
      // Find payment by payment intent ID
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['order'],
      });

      if (!payment) {
        this.logger.warn(`No payment found for payment intent: ${paymentIntentId}`);
        return;
      }

      // Update payment status
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        processedAt: new Date(),
      });

      // Update order status
      await this.ordersRepository.update(payment.orderId, {
        status: OrderStatus.PAYMENT_FAILED,
      });

      this.logger.log(`Order ${payment.orderId} marked as payment failed`);
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

      // Get the latest payment for this order
      const payment = await this.paymentRepository.findOne({
        where: { orderId },
        order: { createdAt: 'DESC' },
      });

      if (!payment) {
        return {
          orderId,
          hasPaymentIntent: false,
          paymentStatus: null,
        };
      }

      // Get payment intent details from Stripe
      const paymentIntent = await this.paymentsService.getPaymentIntent(payment.stripePaymentIntentId);

      return {
        orderId,
        hasPaymentIntent: true,
        paymentIntentId: payment.stripePaymentIntentId,
        paymentStatus: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency,
        isPaid: payment.status === PaymentStatus.SUCCEEDED,
        orderStatus: order.status,
      };
    } catch (error) {
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product stock after successful payment
   */
  private async updateProductStock(orderId: string): Promise<void> {
    try {
      // Get order details with products
      const orderDetails = await this.orderDetailRepository.find({
        where: { order: { id: orderId } },
        relations: ['product'],
      });

      for (const detail of orderDetails) {
        if (detail.product) {
          const product = await this.productsRepository.findOneBy({ id: detail.product.id });
          if (product) {
            // Decrease stock
            product.stock -= detail.quantity;
            
            // Deactivate product if stock reaches 0
            if (product.stock <= 0) {
              product.isActive = false;
              this.logger.log(`Product ${product.name} deactivated due to zero stock`);
            }
            
            await this.productsRepository.save(product);
            this.logger.log(`Stock updated for product ${product.name}: -${detail.quantity} (new stock: ${product.stock})`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error updating product stock for order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}
