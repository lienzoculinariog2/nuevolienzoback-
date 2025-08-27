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

  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    try {
      console.log('💳 ===== CREANDO PAYMENT INTENT =====');
      console.log(`📋 Order ID: ${createPaymentIntentDto.orderId}`);
      console.log(`👤 Customer Email: ${createPaymentIntentDto.customerEmail}`);
      console.log(`📝 Description: ${createPaymentIntentDto.description}`);
      console.log(`🔑 Idempotency Key: ${createPaymentIntentDto.idempotencyKey}`);

      const { orderId, customerEmail, description, idempotencyKey } = createPaymentIntentDto;

      // 🛡️ SECURITY: Check idempotency to prevent duplicate payments
      if (idempotencyKey) {
        console.log('🔍 Verificando idempotencia...');
        const existingPayment = await this.checkIdempotency(idempotencyKey, orderId);
        if (existingPayment) {
          console.log(
            `⚠️ Pago duplicado detectado para orden ${orderId} con key ${idempotencyKey}`,
          );
          this.logger.warn(
            `Duplicate payment attempt detected for order ${orderId} with key ${idempotencyKey}`,
          );
          throw new ConflictException('Payment already processed with this idempotency key');
        }
        console.log('✅ Idempotencia verificada - no hay pagos duplicados');
      }

      // 🛡️ SECURITY: Calculate amount server-side, don't trust client
      console.log('💰 Calculando resumen de la orden...');
      const orderSummary = await this.paymentCalculationService.getOrderSummary(orderId);
      console.log(
        `📊 Order Summary: Amount: $${orderSummary.amount}, Currency: ${orderSummary.currency}`,
      );

      // Validate that order is not already paid
      if (orderSummary.amount <= 0) {
        console.log(`❌ ERROR: Order amount must be greater than 0`);
        throw new BadRequestException('Order amount must be greater than 0');
      }

      console.log('🔄 Preparando parámetros para Stripe...');
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(orderSummary.amount * 100), // Convert dollars to cents for Stripe
        currency: orderSummary.currency,
        metadata: {
          orderId,
          itemCount: orderSummary.items.length.toString(),
          totalAmount: orderSummary.amount.toString(),
          ...(idempotencyKey && { idempotencyKey }),
        },
        description: description || orderSummary.description,
      };

      console.log('📊 Metadata que se enviará a Stripe:', paymentIntentParams.metadata);

      // Add customer email if provided
      if (customerEmail) {
        paymentIntentParams.receipt_email = customerEmail;
        console.log(`📧 Receipt email configurado: ${customerEmail}`);
      } else if (orderSummary.customerEmail) {
        paymentIntentParams.receipt_email = orderSummary.customerEmail;
        console.log(`📧 Receipt email configurado: ${orderSummary.customerEmail}`);
      }

      console.log('🚀 Creando Payment Intent en Stripe...');
      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);
      console.log(`✅ Payment Intent creado en Stripe: ${paymentIntent.id}`);
      console.log(`💰 Amount: ${paymentIntent.amount} cents ($${paymentIntent.amount / 100})`);
      console.log(`💱 Currency: ${paymentIntent.currency}`);
      console.log(`📊 Status: ${paymentIntent.status}`);

      // 🛡️ SECURITY: Create payment record in our database
      console.log('💾 Creando registro de pago en la base de datos...');
      await this.paymentManagementService.createPaymentRecord(orderId, paymentIntent);
      console.log('✅ Registro de pago creado en la base de datos');

      this.logger.log(
        `Payment intent created: ${paymentIntent.id} for order: ${orderId} with amount: $${orderSummary.amount}`,
      );

      const response = {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert cents back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        orderId,
        description: paymentIntent.description || orderSummary.description,
      };

      console.log('✅ ===== PAYMENT INTENT CREADO EXITOSAMENTE =====');
      console.log(`📋 Payment Intent ID: ${response.paymentIntentId}`);
      console.log(`💰 Amount: $${response.amount}`);
      console.log(`💱 Currency: ${response.currency}`);
      console.log(`📊 Status: ${response.status}`);

      return response;
    } catch (error) {
      console.log(`❌ ERROR en createPaymentIntent: ${error.message}`);
      console.log(`❌ Error stack: ${error.stack}`);
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

  handleWebhook(payload: Buffer, signature: string): Stripe.Event {
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

  /**
   * Check if a payment with the same idempotency key already exists
   */
  private async checkIdempotency(idempotencyKey: string, orderId: string): Promise<boolean> {
    try {
      const existingPayment = await this.paymentManagementService.checkIdempotency(
        idempotencyKey,
        orderId,
      );
      return !!existingPayment;
    } catch (error) {
      this.logger.error(`Error checking idempotency: ${error.message}`);
      return false;
    }
  }

  /**
   * Get order items information from database (alternative to metadata)
   */
  async getOrderItems(orderId: string): Promise<any[]> {
    try {
      const orderSummary = await this.paymentCalculationService.getOrderSummary(orderId);
      return orderSummary.items;
    } catch (error) {
      this.logger.error(`Error getting order items: ${error.message}`);
      throw error;
    }
  }
}
