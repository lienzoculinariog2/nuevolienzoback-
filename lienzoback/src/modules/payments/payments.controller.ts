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
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
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
  ) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent for Stripe' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto): Promise<PaymentResponseDto> {
    try {
      return await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating payment intent',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

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

  @Post('confirm/:paymentIntentId')
  @ApiOperation({ summary: 'Confirm a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.paymentsService.confirmPayment(paymentIntentId);
      return {
        status: 'success',
        paymentIntent,
      };
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error confirming payment',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':paymentIntentId')
  @ApiOperation({ summary: 'Get payment intent details' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.paymentsService.getPaymentIntent(paymentIntentId);
      return {
        status: 'success',
        paymentIntent,
      };
    } catch (error) {
      this.logger.error(`Error retrieving payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Payment intent not found',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('cancel/:paymentIntentId')
  @ApiOperation({ summary: 'Cancel a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment intent canceled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.paymentsService.cancelPaymentIntent(paymentIntentId);
      return {
        status: 'success',
        paymentIntent,
      };
    } catch (error) {
      this.logger.error(`Error canceling payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error canceling payment intent',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('refund/:paymentIntentId')
  @ApiOperation({ summary: 'Create a refund for a payment' })
  @ApiBody({ type: CreateRefundDto })
  @ApiResponse({ status: 200, description: 'Refund created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRefund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() createRefundDto: CreateRefundDto,
  ) {
    try {
      const refund = await this.paymentsService.createRefund(paymentIntentId, createRefundDto.amount);
      return {
        status: 'success',
        refund,
      };
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating refund',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!request.rawBody) {
        throw new Error('No raw body available');
      }

      const event = await this.paymentsService.handleWebhook(request.rawBody, signature);

      // Handle different webhook events
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleRefundProcessed(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Webhook error',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    await this.paymentOrderService.handlePaymentSuccess(paymentIntent.id);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    await this.paymentOrderService.handlePaymentFailure(paymentIntent.id);
  }

  private async handleRefundProcessed(charge: any) {
    this.logger.log(`Refund processed: ${charge.id}`);
    // Here you would handle refund processing
  }
}
