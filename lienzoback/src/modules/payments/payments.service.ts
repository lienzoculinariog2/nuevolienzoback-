import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly configService: ConfigService) {
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
      const { amount, currency, orderId, customerEmail, description, items } = createPaymentIntentDto;

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Stripe works with cents
        currency,
        metadata: {
          orderId,
        },
        description: description || `Payment for order ${orderId}`,
      };

      // Add customer email if provided
      if (customerEmail) {
        paymentIntentParams.receipt_email = customerEmail;
      }

      // Note: line_items is not supported in PaymentIntent, use metadata for items info
      if (items && items.length > 0) {
        paymentIntentParams.metadata = {
          ...paymentIntentParams.metadata,
          items: JSON.stringify(items),
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      this.logger.log(`Payment intent created: ${paymentIntent.id} for order: ${orderId}`);

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status,
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
        refundParams.amount = Math.round(amount * 100);
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
