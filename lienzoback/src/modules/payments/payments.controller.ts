import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
import { CreatePaymentIntentDto, CreatePaymentForOrderDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import Stripe from 'stripe';
import type { Request } from 'express';
import { PaymentManagementService } from './services/payment-management.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentOrderService: PaymentOrderService,
    private readonly paymentManagementService: PaymentManagementService,
  ) {}

  @Post('order/:orderId/create-payment')
  @ApiOperation({ summary: 'Create a payment intent for a specific order' })
  @ApiBody({ type: CreatePaymentForOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully for order',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentForOrder(
    @Param('orderId') orderId: string,
    @Body() createPaymentForOrderDto: CreatePaymentForOrderDto,
  ): Promise<PaymentResponseDto> {
    try {
      return await this.paymentOrderService.createPaymentForOrder(
        orderId,
        createPaymentForOrderDto,
      );
    } catch (error) {
      this.logger.error(`Error creating payment for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating payment for order',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('order-status/:orderId')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getOrderPaymentStatus(@Param('orderId') orderId: string) {
    try {
      const paymentStatus = await this.paymentOrderService.getOrderPaymentStatus(orderId);
      return paymentStatus;
    } catch (error) {
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error getting payment status',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Req() request: Request, @Headers('stripe-signature') signature: string) {
    try {
      // 🔍 DEBUGGING: Log información detallada del request
      console.log('🔔 ===== WEBHOOK RECIBIDO =====');
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);
      console.log(`🌐 URL: ${request.url}`);
      console.log(`📋 Method: ${request.method}`);
      console.log(`📦 Headers: ${JSON.stringify(request.headers, null, 2)}`);
      console.log(`📏 Raw body exists: ${!!request.body}`);
      console.log(`📏 Raw body length: ${request.body?.length || 0}`);
      console.log(`📏 Raw body type: ${typeof request.body}`);
      console.log(`🔑 Signature exists: ${!!signature}`);
      console.log(`🔑 Signature: ${signature ? signature.substring(0, 50) + '...' : 'MISSING'}`);

      // 🛡️ Use request.body as Buffer (express.raw() provides it as Buffer)
      const payload = request.body as Buffer;

      if (!payload) {
        console.log('❌ ERROR: No payload available');
        this.logger.error('❌ ERROR: No payload available');
        throw new Error('No payload available');
      }

      if (!signature) {
        console.log('❌ ERROR: No stripe-signature header');
        this.logger.error('❌ ERROR: No stripe-signature header');
        throw new Error('No stripe-signature header');
      }

      console.log('🔍 ===== VERIFICANDO WEBHOOK =====');
      const event = this.paymentsService.handleWebhook(payload, signature);
      console.log(`✅ Webhook verified successfully: ${event.type}`);
      console.log(`📋 Event data: ${JSON.stringify(event.data, null, 2)}`);

      // 🛡️ Use the new payment management service for all webhook events
      console.log('🔍 ===== PROCESANDO EVENTO =====');
      await this.handleWebhookEvent(event);

      console.log('✅ ===== WEBHOOK PROCESADO EXITOSAMENTE =====');
      return { received: true };
    } catch (error) {
      console.log('❌ ===== ERROR EN WEBHOOK =====');
      console.log(`❌ Error message: ${error.message}`);
      console.log(`❌ Error stack: ${error.stack}`);
      console.log(`❌ Error name: ${error.name}`);

      this.logger.error('❌ ===== ERROR EN WEBHOOK =====');
      this.logger.error(`❌ Error message: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      this.logger.error(`❌ Error name: ${error.name}`);

      // 🔍 DEBUGGING: Log más información del error
      if (error.message.includes('signature')) {
        console.log('🔍 Signature verification failed - Check webhook secret');
        this.logger.error('🔍 Signature verification failed - Check webhook secret');
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Webhook error',
          message: error.message,
          details: {
            hasRawBody: !!request.body,
            rawBodyLength: request.body?.length || 0,
            hasSignature: !!signature,
            timestamp: new Date().toISOString(),
            errorName: error.name,
            errorStack: error.stack?.split('\n')[0],
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
      case 'payment_intent.processing':
      case 'payment_intent.requires_action':
        await this.handlePaymentIntentEvent(event);
        break;
      case 'charge.refunded':
        this.handleRefundEvent(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentEvent(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`🔍 ===== PROCESANDO PAYMENT INTENT: ${event.type} =====`);
    this.logger.log(`📋 Payment Intent ID: ${paymentIntent.id}`);
    this.logger.log(`💰 Amount: ${paymentIntent.amount}`);
    this.logger.log(`💱 Currency: ${paymentIntent.currency}`);
    this.logger.log(`📊 Status: ${paymentIntent.status}`);

    try {
      // Handle specific event types using PaymentOrderService directly
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.logger.log('🔄 Llamando a handlePaymentSuccess...');
          await this.paymentOrderService.handlePaymentSuccess(paymentIntent.id);
          this.logger.log('✅ handlePaymentSuccess completado');
          break;
        case 'payment_intent.payment_failed':
          this.logger.log('🔄 Llamando a handlePaymentFailure...');
          this.paymentOrderService.handlePaymentFailure(paymentIntent.id);
          this.logger.log('✅ handlePaymentFailure completado');
          break;
        case 'payment_intent.canceled':
          // Handle canceled payment
          this.logger.log(`⚠️ Payment intent ${paymentIntent.id} was canceled`);
          break;
        case 'payment_intent.processing':
          this.logger.log(`⏳ Payment intent ${paymentIntent.id} is processing`);
          break;
        case 'payment_intent.requires_action':
          this.logger.log(`🔄 Payment intent ${paymentIntent.id} requires action`);
          break;
        default:
          this.logger.log(`⚠️ Unhandled payment intent event: ${event.type}`);
      }

      this.logger.log(`✅ Payment Intent ${paymentIntent.id} procesado exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error procesando Payment Intent ${paymentIntent.id}: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      throw error;
    }
  }

  private handleRefundEvent(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    this.logger.log(`Processing refund event for charge: ${charge.id}`);

    try {
      // Find the payment by charge ID and create refund record
      // This would need to be implemented based on your charge tracking
      this.logger.log(`Refund processed for charge: ${charge.id}`);
    } catch (error) {
      this.logger.error(`Error processing refund event: ${error.message}`);
    }
  }
}
