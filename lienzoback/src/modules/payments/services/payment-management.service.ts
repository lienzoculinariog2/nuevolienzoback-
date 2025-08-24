import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, PaymentProvider } from '../entities/payment.entity';
import { Orders, OrderStatus } from '../../orders/entities/order.entity';
import { PaymentCalculationService } from './payment-calculation.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentManagementService {
  private readonly logger = new Logger(PaymentManagementService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    private readonly paymentCalculationService: PaymentCalculationService,
  ) {}

  /**
   * Create a new payment record for an order
   */
  async createPaymentRecord(orderId: string, stripePaymentIntent: Stripe.PaymentIntent): Promise<Payment> {
    const orderSummary = await this.paymentCalculationService.getOrderSummary(orderId);
    
    const payment = this.paymentRepository.create({
      orderId,
      provider: PaymentProvider.STRIPE,
      type: PaymentType.PAYMENT,
      status: this.mapStripeStatusToPaymentStatus(stripePaymentIntent.status),
      amount: orderSummary.amount,
      currency: orderSummary.currency,
      stripePaymentIntentId: stripePaymentIntent.id,
      customerEmail: orderSummary.customerEmail,
      description: orderSummary.description,
      metadata: {
        orderId,
        items: orderSummary.items,
        stripePaymentIntent: {
          id: stripePaymentIntent.id,
          status: stripePaymentIntent.status,
          amount: stripePaymentIntent.amount,
          currency: stripePaymentIntent.currency,
        },
      },
      idempotencyKey: stripePaymentIntent.metadata?.idempotencyKey,
    });

    return await this.paymentRepository.save(payment);
  }

  /**
   * Update payment status based on Stripe webhook events
   */
  async updatePaymentStatus(paymentIntentId: string, stripeEvent: Stripe.Event): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with Stripe payment intent ${paymentIntentId} not found`);
    }

    const newStatus = this.mapStripeEventToPaymentStatus(stripeEvent.type);
    payment.status = newStatus;
    payment.processedAt = new Date();

    // Update metadata with event information
    payment.metadata = {
      ...payment.metadata,
      lastEvent: {
        type: stripeEvent.type,
        timestamp: new Date().toISOString(),
        data: stripeEvent.data.object,
      },
    };

    // Handle specific event types
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payment);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(payment);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(payment);
        break;
    }

    return await this.paymentRepository.save(payment);
  }

  /**
   * Create a refund record
   */
  async createRefundRecord(
    paymentId: string,
    stripeRefund: Stripe.Refund,
    reason?: string,
  ): Promise<Payment> {
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!originalPayment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (!originalPayment.canRefund) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    const refundAmount = stripeRefund.amount / 100; // Convert from cents

    // Create refund record
    const refund = this.paymentRepository.create({
      orderId: originalPayment.orderId,
      provider: PaymentProvider.STRIPE,
      type: refundAmount >= originalPayment.amount ? PaymentType.REFUND : PaymentType.PARTIAL_REFUND,
      status: PaymentStatus.SUCCEEDED,
      amount: refundAmount,
      currency: originalPayment.currency,
      stripeRefundId: stripeRefund.id,
      stripePaymentIntentId: originalPayment.stripePaymentIntentId,
      customerEmail: originalPayment.customerEmail,
      description: `Refund for payment ${originalPayment.id}`,
      metadata: {
        originalPaymentId: originalPayment.id,
        reason,
        stripeRefund: {
          id: stripeRefund.id,
          amount: stripeRefund.amount,
          currency: stripeRefund.currency,
          reason: stripeRefund.reason,
        },
      },
      processedAt: new Date(),
    });

    // Update original payment refunded amount
    originalPayment.refundedAmount += refundAmount;
    await this.paymentRepository.save(originalPayment);

    return await this.paymentRepository.save(refund);
  }

  /**
   * Get payment history for an order
   */
  async getOrderPaymentHistory(orderId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByStripeIntentId(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with Stripe payment intent ${paymentIntentId} not found`);
    }

    return payment;
  }

  /**
   * Check if payment is idempotent
   */
  async checkIdempotency(idempotencyKey: string, orderId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { idempotencyKey, orderId },
    });
  }

  /**
   * Map Stripe status to our PaymentStatus enum
   */
  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
        return PaymentStatus.REQUIRES_PAYMENT_METHOD;
      case 'requires_confirmation':
        return PaymentStatus.REQUIRES_CONFIRMATION;
      case 'requires_action':
        return PaymentStatus.REQUIRES_ACTION;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_capture':
        return PaymentStatus.REQUIRES_CONFIRMATION; // Use closest available status
      case 'canceled':
        return PaymentStatus.CANCELED;
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Map Stripe event to PaymentStatus
   */
  private mapStripeEventToPaymentStatus(eventType: string): PaymentStatus {
    switch (eventType) {
      case 'payment_intent.succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'payment_intent.payment_failed':
        return PaymentStatus.FAILED;
      case 'payment_intent.canceled':
        return PaymentStatus.CANCELED;
      case 'payment_intent.processing':
        return PaymentStatus.PROCESSING;
      case 'payment_intent.requires_action':
        return PaymentStatus.REQUIRES_ACTION;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(payment: Payment): Promise<void> {
    // Update order status
    await this.ordersRepository.update(payment.orderId, {
      isPaid: true,
      statusOrder: OrderStatus.PAID,
    });

    this.logger.log(`Order ${payment.orderId} marked as paid`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(payment: Payment): Promise<void> {
    // Update order status
    await this.ordersRepository.update(payment.orderId, {
      statusOrder: OrderStatus.PAYMENT_FAILED,
    });

    this.logger.log(`Order ${payment.orderId} marked as payment failed`);
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(payment: Payment): Promise<void> {
    // Update order status
    await this.ordersRepository.update(payment.orderId, {
      statusOrder: OrderStatus.CANCELED,
    });

    this.logger.log(`Order ${payment.orderId} marked as canceled`);
  }
}
