import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
import { PaymentManagementService } from './services/payment-management.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentOrderService: PaymentOrderService,
    private readonly paymentManagementService: PaymentManagementService,
  ) {}

  // 🚫 DESHABILITADO: Crear payment intent genérico (no necesario para flujo de compra)
  // @Post('create-payment-intent')
  // @ApiOperation({ summary: 'Create a payment intent for Stripe' })
  // @ApiBody({ type: CreatePaymentIntentDto })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Payment intent created successfully',
  //   type: PaymentResponseDto,
  // })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto): Promise<PaymentResponseDto> {
  //   try {
  //     return await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  //   } catch (error) {
  //     this.logger.error(`Error creating payment intent: ${error.message}`);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.BAD_REQUEST,
  //         error: 'Error creating payment intent',
  //         message: error.message,
  //       },
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  @Post('order/:orderId/create-payment')
  @ApiOperation({ summary: 'Create a payment intent for a specific order' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully for order',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentForOrder(
    @Param('orderId') orderId: string,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    try {
      return await this.paymentOrderService.createPaymentForOrder(orderId, createPaymentIntentDto);
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

  @Get('order/:orderId/payment-status')
  @ApiOperation({ summary: 'Get payment status for a specific order' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderPaymentStatus(@Param('orderId') orderId: string) {
    try {
      return await this.paymentOrderService.getOrderPaymentStatus(orderId);
    } catch (error) {
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Error getting payment status',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // 🚫 DESHABILITADO: Historial de pagos (no necesario para flujo de compra)
  // @Get('order/:orderId/payment-history')
  // @ApiOperation({ summary: 'Get complete payment history for a specific order' })
  // @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  // @ApiResponse({ status: 404, description: 'Order not found' })
  // async getOrderPaymentHistory(@Param('orderId') orderId: string) {
  //   try {
  //     const paymentHistory = await this.paymentManagementService.getOrderPaymentHistory(orderId);
  //     return {
  //       orderId,
  //       paymentHistory,
  //       totalPayments: paymentHistory.length,
  //       totalAmount: paymentHistory.reduce((sum, payment) => sum + payment.amount, 0),
  //       totalRefunded: paymentHistory.reduce((sum, payment) => sum + payment.refundedAmount, 0),
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error getting payment history for order ${orderId}: ${error.message}`);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.NOT_FOUND,
  //         error: 'Error getting payment history',
  //         message: error.message,
  //       },
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // 🛡️ SECURITY: Removed manual confirmation endpoint
  // Payment confirmation should only happen through Stripe webhooks
  // This prevents inconsistent states between frontend and webhook processing

  // 🚫 DESHABILITADO: Obtener detalles de payment intent (no necesario para flujo de compra)
  // @Get(':paymentIntentId')
  // @ApiOperation({ summary: 'Get payment intent details' })
  // @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  // @ApiResponse({ status: 404, description: 'Payment intent not found' })
  // async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
  //   try {
  //     const paymentIntent = await this.paymentsService.getPaymentIntent(paymentIntentId);
  //     return {
  //       status: 'success',
  //       paymentIntent,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error retrieving payment intent: ${error.message}`);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.NOT_FOUND,
  //         error: 'Payment intent not found',
  //         message: error.message,
  //       },
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // 🚫 DESHABILITADO: Cancelar payment intent (no necesario para flujo de compra)
  // @Post('cancel/:paymentIntentId')
  // @ApiOperation({ summary: 'Cancel a payment intent' })
  // @ApiResponse({ status: 200, description: 'Payment intent canceled successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
  //   try {
  //     const paymentIntent = await this.paymentsService.cancelPaymentIntent(paymentIntentId);
  //     return {
  //       status: 'success',
  //       paymentIntent,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error canceling payment intent: ${error.message}`);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.BAD_REQUEST,
  //         error: 'Error canceling payment intent',
  //         message: error.message,
  //       },
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  // 🚫 DESHABILITADO: Crear reembolso (no necesario para flujo de compra)
  // @Post('refund/:paymentIntentId')
  // @ApiOperation({ summary: 'Create a refund for a payment' })
  // @ApiBody({ type: CreateRefundDto })
  // @ApiResponse({ status: 200, description: 'Refund created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 404, description: 'Payment not found' })
  // async createRefund(
  //   @Param('paymentIntentId') paymentIntentId: string,
  //   @Body() createRefundDto: CreateRefundDto,
  // ) {
  //   try {
  //     // 🛡️ SECURITY: Get payment from our database first
  //     const payment = await this.paymentManagementService.getPaymentByStripeIntentId(paymentIntentId);
  //     
  //     // Create refund in Stripe
  //     const stripeRefund = await this.paymentsService.createRefund(paymentIntentId, createRefundDto.amount);
  //     
  //     // 🛡️ SECURITY: Create refund record in our database
  //     const refundRecord = await this.paymentManagementService.createRefundRecord(
  //       payment.id,
  //       stripeRefund,
  //       'requested_by_customer', // Default reason
  //     );

  //     return {
  //       status: 'success',
  //       refund: {
  //         id: refundRecord.id,
  //         amount: refundRecord.amount,
  //         currency: refundRecord.currency,
  //         status: refundRecord.status,
  //         stripeRefundId: refundRecord.stripeRefundId,
  //         reason: 'requested_by_customer',
  //         createdAt: refundRecord.createdAt,
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error creating refund: ${error.message}`);
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.BAD_REQUEST,
  //         error: 'Error creating refund',
  //         message: error.message,
  //       },
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // 🛡️ Verificar que el raw body esté disponible
      if (!request.rawBody) {
        this.logger.error('Webhook error: No raw body available - Check body-parser configuration');
        throw new Error('No raw body available - Check body-parser configuration');
      }

      // 🛡️ Verificar que la firma esté presente
      if (!signature) {
        this.logger.error('Webhook error: No stripe-signature header');
        throw new Error('No stripe-signature header');
      }

      this.logger.log(`Webhook received: ${request.rawBody.length} bytes, signature: ${signature.substring(0, 20)}...`);

      const event = await this.paymentsService.handleWebhook(request.rawBody, signature);

      // 🛡️ Use the new payment management service for all webhook events
      await this.handleWebhookEvent(event);

      this.logger.log(`Webhook processed successfully: ${event.type}`);
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      this.logger.error(`Webhook error details: ${JSON.stringify({
        hasRawBody: !!request.rawBody,
        rawBodyLength: request.rawBody?.length,
        hasSignature: !!signature,
        signatureLength: signature?.length,
        errorType: error.constructor.name
      })}`);
      
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Webhook error',
          message: error.message,
          details: {
            hasRawBody: !!request.rawBody,
            rawBodyLength: request.rawBody?.length,
            hasSignature: !!signature,
            signatureLength: signature?.length
          }
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
        await this.handleRefundEvent(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentEvent(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`Processing payment intent event: ${event.type} for ${paymentIntent.id}`);
    
    try {
      await this.paymentManagementService.updatePaymentStatus(paymentIntent.id, event);
    } catch (error) {
      this.logger.error(`Error processing payment intent event: ${error.message}`);
    }
  }

  private async handleRefundEvent(event: Stripe.Event) {
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
