import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentCalculationService } from './services/payment-calculation.service';
import { PaymentManagementService } from './services/payment-management.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentCalculationService: PaymentCalculationService,
    private readonly paymentManagementService: PaymentManagementService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto): Promise<PaymentResponseDto> {
    try {
      const { orderId, customerEmail, description, idempotencyKey } = createPaymentIntentDto;

      // 🛡️ SECURITY: Check idempotency to prevent duplicate payments
      if (idempotencyKey) {
        const existingPayment = await this.paymentManagementService.checkIdempotency(idempotencyKey, orderId);
        if (existingPayment) {
          this.logger.warn(`Duplicate payment attempt detected for order ${orderId} with key ${idempotencyKey}`);
          throw new ConflictException('Payment already processed with this idempotency key');
        }
      }

      // 🛡️ SECURITY: Calculate amount server-side, don't trust client
      const orderSummary = await this.paymentCalculationService.getOrderSummary(orderId);
      
      // Validate that order is not already paid
      if (orderSummary.amount <= 0) {
        throw new BadRequestException('Order amount must be greater than 0');
      }

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(orderSummary.amount * 100), // Convert dollars to cents for Stripe
        currency: orderSummary.currency,
        metadata: {
          orderId,
          items: JSON.stringify(orderSummary.items),
          ...(idempotencyKey && { idempotencyKey }),
        },
        description: description || orderSummary.description,
      };

      // Add customer email if provided
      if (customerEmail) {
        paymentIntentParams.receipt_email = customerEmail;
      } else if (orderSummary.customerEmail) {
        paymentIntentParams.receipt_email = orderSummary.customerEmail;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      // 🛡️ SECURITY: Create payment record in our database
      await this.paymentManagementService.createPaymentRecord(orderId, paymentIntent);

      this.logger.log(`Payment intent created: ${paymentIntent.id} for order: ${orderId} with amount: $${orderSummary.amount}`);

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert cents back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        orderId,
        description: paymentIntent.description || orderSummary.description,
      };
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'requires_confirmation') {
        return await this.stripe.paymentIntents.confirm(paymentIntentId);
      }
      
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`);
      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error retrieving payment intent: ${error.message}`);
      throw error;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error canceling payment intent: ${error.message}`);
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert dollars to cents
      }

      return await this.stripe.refunds.create(refundParams);
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw error;
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<Stripe.Event> {
    try {
      const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      this.logger.log(`Webhook received: ${event.type}`);
      
      return event;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw error;
    }
  }
}
